import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { applicationSchema } from "@/lib/application-schema";
import { sendApplicationEmail } from "@/lib/send-application-email";
import { notifyOwner } from "@/lib/notify";
import { getRole } from "@/lib/content/careers";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const limited = await rateLimit("public-form", clientIp(request), 12, 3600);
  if (!limited.ok) return tooMany();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid JSON" },
      { status: 400 }
    );
  }

  const parsed = applicationSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  // Honeypot drop
  if (parsed.data.hp) return NextResponse.json({ ok: true });

  const { hp: _hp, ...payload } = parsed.data;

  // Write to DB when configured. Email is always sent so applications are
  // never silently lost, even if Postgres is down.
  const db = getDb();
  if (db) {
    try {
      await db.application.create({
        data: {
          name: payload.name,
          phone: payload.phone,
          email: payload.email,
          roleSlug: payload.role,
          availability: payload.availability,
          validLicense: payload.validLicense,
          reliableCommute: payload.reliableCommute,
          yearsExperience: payload.yearsExperience,
          whyJoin: payload.whyJoin || null,
          resumeUrl: payload.resumeUrl || null,
          // No dedicated column yet: record interests as a factual note so
          // they show up in the admin hiring view without a DB migration.
          notes: `Interested in: ${payload.positionsInterested.join(", ")}`,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Application DB write failed", err);
      // Fall through to email so the application isn't lost.
    }
  }

  // Owner email + text, best-effort.
  const roleTitle = getRole(payload.role)?.title ?? payload.role;
  await notifyOwner({
    kind: "application",
    subject: `Job application: ${roleTitle}, ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Role: ${roleTitle}`,
      `Availability: ${payload.availability}`,
      `Interested in: ${payload.positionsInterested.join(", ")}`,
      `License: ${payload.validLicense} · Commute: ${payload.reliableCommute}`,
      `Experience: ${payload.yearsExperience}`,
      payload.whyJoin ? `Why PVS:\n${payload.whyJoin}` : null,
      payload.resumeUrl ? `Resume: ${payload.resumeUrl}` : null,
      ``,
      `Manage: /admin/applications`,
    ]
      .filter(Boolean)
      .join("\n"),
    sms: `PVS job application: ${payload.name} · ${roleTitle} · ${payload.phone}`,
    replyTo: payload.email,
  });

  try {
    await sendApplicationEmail(parsed.data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Application email send failed", err);
    if (!db) {
      return NextResponse.json(
        { ok: false, error: "Could not deliver application, please email us." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}

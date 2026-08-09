import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { supportSchema } from "@/lib/support-schema";
import { getDb } from "@/lib/db";
import { sendSupportEmail } from "@/lib/send-support-email";
import { notifyOwner } from "@/lib/notify";

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

  const parsed = supportSchema.safeParse(json);
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

  // Persist if DB is configured. Email is always sent so requests are
  // never silently lost even when the DB is down.
  const db = getDb();
  if (db) {
    try {
      await db.supportRequest.create({
        data: {
          name: payload.name,
          email: payload.email,
          phone: payload.phone,
          type: payload.type,
          propertyAddress: payload.propertyAddress || null,
          details: payload.details,
        },
      });
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("Support DB write failed", err);
      // Fall through to email, better partial success than total failure.
    }
  }

  // Owner email + text, best-effort.
  await notifyOwner({
    kind: "support",
    subject: `Support ticket (${payload.type}): ${payload.name}`,
    text: [
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Type: ${payload.type}`,
      payload.propertyAddress ? `Address: ${payload.propertyAddress}` : null,
      `Details:\n${payload.details}`,
      ``,
      `Manage: /admin/support`,
    ]
      .filter(Boolean)
      .join("\n"),
    sms: `PVS support ticket (${payload.type}): ${payload.name} · ${payload.phone}`,
    replyTo: payload.email,
  });

  try {
    await sendSupportEmail(parsed.data);
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Support email send failed", err);
    if (!db) {
      // DB also unavailable, bail.
      return NextResponse.json(
        { ok: false, error: "Could not record your request, please call us." },
        { status: 500 }
      );
    }
  }

  return NextResponse.json({ ok: true });
}

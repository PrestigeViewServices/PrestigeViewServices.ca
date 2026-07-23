import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  leadSchema,
  divisionForService,
  LEAD_SERVICES,
} from "@/lib/lead-schema";
import { sendLeadNotification } from "@/lib/send-lead-email";
import { getDb } from "@/lib/db";
import type { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

/**
 * Prestige Club referral attribution (best-effort, never blocks intake).
 * The /r/[code] landing set a pvs_ref cookie; if this lead's email is new
 * to the referrer, record a Referral at BOOKED. Admin advances it to
 * COMPLETED → points awarded after the friend's first paid service.
 */
async function recordReferral(
  db: PrismaClient,
  leadEmail: string
): Promise<string | null> {
  try {
    const store = await cookies();
    const code = store.get("pvs_ref")?.value?.trim().toUpperCase();
    if (!code) return null;
    const referrer = await db.member.findUnique({
      where: { referralCode: code },
      select: { id: true, email: true },
    });
    // No self-referrals, and one referral record per referred email.
    if (!referrer || referrer.email === leadEmail.toLowerCase()) return null;
    const existing = await db.referral.findFirst({
      where: { referredEmail: leadEmail.toLowerCase() },
    });
    if (existing) return null;
    await db.referral.create({
      data: {
        code: `${code}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
        referrerId: referrer.id,
        referredEmail: leadEmail.toLowerCase(),
        status: "BOOKED",
      },
    });
    return code;
  } catch {
    return null;
  }
}

/**
 * Public lead intake. Creates a Lead at the top of the pipeline (status NEW,
 * source PUBLIC_FORM), this is the "public form → Lead automatically" path.
 *
 * Mirrors the winter-reservations route: validate → honeypot → null-DB fallback
 * that logs instead of dropping the submission → create.
 */
export async function POST(request: Request) {
  const limited = await rateLimit("public-form", clientIp(request), 12, 3600);
  if (!limited.ok) return tooMany();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
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

  // Honeypot, silently accept so bots don't learn they were caught.
  if (parsed.data.hp) return NextResponse.json({ ok: true });

  const { hp: _hp, ...payload } = parsed.data;

  const serviceLabel =
    LEAD_SERVICES.find((s) => s.value === payload.service)?.label ??
    payload.service;

  // Email notification is best-effort and must never block or fail intake.
  const notify = () =>
    sendLeadNotification({
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      serviceLabel,
      promoCode: payload.promoCode || null,
      propertyAddress: payload.propertyAddress || null,
      message: payload.message || null,
    }).then((r) => {
      if (!r.sent) {
        // eslint-disable-next-line no-console
        console.warn("[PVS lead] email notification skipped:", r.reason);
      }
    });

  const db = getDb();
  if (!db) {
    // Never silently drop, log so the lead can be recovered.
    // eslint-disable-next-line no-console
    console.log("[PVS lead, no DB]", {
      receivedAt: new Date().toISOString(),
      ...payload,
    });
    await notify();
    return NextResponse.json({ ok: true, id: null });
  }

  try {
    const refCode = await recordReferral(db, payload.email);
    const noteParts = [
      payload.promoCode ? `Promo: ${payload.promoCode}` : null,
      refCode ? `Referred by club code ${refCode} — friend gets $25 off first service` : null,
    ].filter(Boolean);
    const created = await db.lead.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        division: divisionForService(payload.service),
        propertyAddress: payload.propertyAddress || null,
        message: payload.message || null,
        serviceSlugs: [payload.service],
        notes: noteParts.length ? noteParts.join(" · ") : null,
        status: "NEW",
        source: "PUBLIC_FORM",
      },
      select: { id: true },
    });
    await notify();
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Lead DB write failed", err);
    return NextResponse.json(
      { ok: false, error: "Could not submit your request, please call us." },
      { status: 500 }
    );
  }
}

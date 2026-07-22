import { NextResponse } from "next/server";
import {
  leadSchema,
  divisionForService,
  LEAD_SERVICES,
} from "@/lib/lead-schema";
import { sendLeadNotification } from "@/lib/send-lead-email";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/**
 * Public lead intake. Creates a Lead at the top of the pipeline (status NEW,
 * source PUBLIC_FORM), this is the "public form → Lead automatically" path.
 *
 * Mirrors the winter-reservations route: validate → honeypot → null-DB fallback
 * that logs instead of dropping the submission → create.
 */
export async function POST(request: Request) {
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
    const created = await db.lead.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        division: divisionForService(payload.service),
        propertyAddress: payload.propertyAddress || null,
        message: payload.message || null,
        serviceSlugs: [payload.service],
        notes: payload.promoCode ? `Promo: ${payload.promoCode}` : null,
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

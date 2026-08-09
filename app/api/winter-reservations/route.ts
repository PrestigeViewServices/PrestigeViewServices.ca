import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { winterReservationSchema } from "@/lib/winter-reservation-schema";
import { estimateCents } from "@/lib/content/winter-packages";
import { getDb } from "@/lib/db";
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

  const parsed = winterReservationSchema.safeParse(json);
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

  if (parsed.data.hp) return NextResponse.json({ ok: true });

  const { hp: _hp, ...payload } = parsed.data;

  // Server-side recompute, never trust a client-supplied estimate.
  const { low, high } = estimateCents(
    payload.drivewayTier,
    payload.drivewaySize,
    payload.shovelingTier
  );

  // Owner email + text, best-effort, never blocks intake.
  await notifyOwner({
    kind: "winter",
    subject: `Winter reservation: ${payload.name}, ${payload.city}`,
    text: [
      `Name: ${payload.name}`,
      `Phone: ${payload.phone}`,
      `Email: ${payload.email}`,
      `Address: ${payload.streetAddress}, ${payload.city}`,
      `Driveway: ${payload.drivewayTier} · ${payload.drivewaySize}`,
      `Shoveling: ${payload.shovelingTier}`,
      `Estimate: $${(low / 100).toFixed(0)}–$${(high / 100).toFixed(0)}`,
      payload.customerNotes ? `Notes:\n${payload.customerNotes}` : null,
      ``,
      `Manage: /admin/winter-reservations`,
    ]
      .filter(Boolean)
      .join("\n"),
    sms: `PVS winter reservation: ${payload.name} · ${payload.city} · ${payload.phone}`,
    replyTo: payload.email,
  });

  const db = getDb();
  if (!db) {
    // Same pattern as /api/apply: log so submissions are never silently lost
    // when the DB isn't configured.
    // eslint-disable-next-line no-console
    console.log("[PVS winter reservation, no DB]", {
      receivedAt: new Date().toISOString(),
      estimate: { low, high },
      ...payload,
    });
    return NextResponse.json({ ok: true, id: null });
  }

  try {
    const created = await db.winterReservation.create({
      data: {
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        streetAddress: payload.streetAddress,
        city: payload.city,
        region: payload.region || "ON",
        postalCode: payload.postalCode || null,
        drivewayTier: payload.drivewayTier,
        drivewaySize: payload.drivewaySize,
        shovelingTier: payload.shovelingTier,
        estimateLowCents: low,
        estimateHighCents: high,
        customerNotes: payload.customerNotes || null,
      },
      select: { id: true },
    });
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Winter reservation DB write failed", err);
    return NextResponse.json(
      { ok: false, error: "Could not save your reservation, please call us." },
      { status: 500 }
    );
  }
}

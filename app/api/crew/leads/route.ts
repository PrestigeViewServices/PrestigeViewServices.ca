import { NextResponse } from "next/server";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { getCrewSession } from "@/lib/crew-app";
import { recordNotification } from "@/lib/admin-notifications";

export const runtime = "nodejs";

const schema = z.object({
  stopId: z.string().optional(),
  address: z.string().min(3).max(200),
  service: z.string().min(2).max(80),
  note: z.string().max(500).optional(),
});

/** POST /api/crew/leads — crew flags an upsell from the field. */
export async function POST(req: Request) {
  const session = await getCrewSession();
  if (!session) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "db" }, { status: 503 });

  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Address and service are required." }, { status: 400 });
  }
  const d = parsed.data;
  const lead = await db.fieldLead.create({
    data: {
      crewId: session.crewId,
      memberId: session.memberId,
      stopId: d.stopId ?? null,
      address: d.address.trim(),
      service: d.service.trim(),
      note: d.note?.trim() || null,
    },
  });
  await recordNotification({
    kind: "field-lead",
    title: `Upsell lead: ${d.service} at ${d.address}`,
    body: `${session.memberName} (${session.crewName})${d.note ? `: ${d.note}` : ""}`,
    href: "/admin/game-plan/leads",
  }).catch(() => null);
  return NextResponse.json({ ok: true, id: lead.id });
}

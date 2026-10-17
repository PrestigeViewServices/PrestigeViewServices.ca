import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getCrewSession, toCheckItems } from "@/lib/crew-app";

export const runtime = "nodejs";

/** POST { planId, kind: "gear" | "endOfDay", index, done } — tick a checklist box. */
export async function POST(req: Request) {
  const session = await getCrewSession();
  if (!session) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "db" }, { status: 503 });
  const body = (await req.json().catch(() => null)) as { planId?: string; kind?: string; index?: number; done?: boolean } | null;
  if (!body?.planId || (body.kind !== "gear" && body.kind !== "endOfDay") || typeof body.index !== "number") {
    return NextResponse.json({ error: "bad request" }, { status: 400 });
  }
  const plan = await db.gamePlan.findUnique({ where: { id: body.planId }, select: { crewId: true, gear: true, endOfDay: true } });
  if (!plan || plan.crewId !== session.crewId) return NextResponse.json({ error: "not found" }, { status: 404 });
  const items = toCheckItems(body.kind === "gear" ? plan.gear : plan.endOfDay);
  if (!items[body.index]) return NextResponse.json({ error: "no such item" }, { status: 400 });
  items[body.index] = { ...items[body.index], done: !!body.done, byId: body.done ? session.memberId : null };
  await db.gamePlan.update({ where: { id: body.planId }, data: { [body.kind]: items } });
  return NextResponse.json({ ok: true });
}

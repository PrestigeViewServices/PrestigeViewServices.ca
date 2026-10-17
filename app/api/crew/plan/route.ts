import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import {
  canSeePhone,
  crewVisiblePlans,
  crewWeek,
  getCrewSession,
  prettyDate,
  touchMember,
  standings,
  weekStart,
  ymd,
} from "@/lib/crew-app";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/crew/plan — everything the crew screen shows, in one call.
 * The phone polls this every 20 s, so a plan posted from the admin page
 * shows up without a refresh. Response is small (one crew's day).
 */
export async function GET() {
  const session = await getCrewSession();
  if (!session) return NextResponse.json({ error: "signed-out" }, { status: 401 });
  const db = getDb();
  if (!db) return NextResponse.json({ error: "db" }, { status: 503 });
  void touchMember(session.memberId, session.lastSeenAt);

  const [plans, board, week, recent] = await Promise.all([
    crewVisiblePlans(session.crewId),
    standings(),
    crewWeek(session.crewId),
    db.pointEntry.findMany({
      where: { member: { crewId: session.crewId } },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { member: { select: { name: true } } },
    }),
  ]);

  // Customer phone numbers are filtered per viewer: a stop marked "leads
  // only" shows the number to Crew Lead and above; "none" hides it for all.
  type P = NonNullable<typeof plans.today>;
  const redact = (p: P | null) => {
    if (!p) return null;
    return {
      ...p,
      stops: p.stops.map(({ phoneVisibility, customerPhone, ...s }) => ({
        ...s,
        customerPhone: canSeePhone(phoneVisibility, session.rank) ? customerPhone : null,
      })),
    };
  };

  const me = board.find((s) => s.memberId === session.memberId) ?? null;
  const rank = me ? board.findIndex((s) => s.memberId === me.memberId) + 1 : null;

  return NextResponse.json({
    me: {
      memberId: session.memberId,
      name: session.memberName,
      position: session.rank,
      crewId: session.crewId,
      crew: session.crewName,
      week: me?.week ?? 0,
      season: me?.season ?? 0,
      rank,
      of: board.length,
    },
    date: plans.date,
    dateLabel: prettyDate(plans.date),
    weekOf: weekStart(ymd()),
    today: redact(plans.today),
    tomorrow: redact(plans.tomorrow),
    week,
    board: board.slice(0, 12),
    recent: recent.map((r) => ({
      id: r.id,
      name: r.member.name,
      points: r.points,
      reason: r.reason,
      note: r.note && r.note.startsWith("lead:") ? null : r.note,
      date: r.date,
    })),
  });
}

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { syncJobber } from "@/lib/jobber";
import { awardSnowEarlybird } from "@/lib/loyalty";
import { dateFromYyyymmdd, getClubSettings } from "@/lib/club-settings";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Scheduled Jobber sync (see vercel.json crons). Vercel calls this with
 * `Authorization: Bearer ${CRON_SECRET}`; manual runs can pass the same
 * header. Without CRON_SECRET set, only Vercel's cron header is accepted.
 */
export async function GET(req: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  if (!db) {
    return NextResponse.json({ ok: false, reason: "DB not configured" });
  }

  try {
    const summary = await syncJobber(db);
    // Snow early-bird runs daily alongside the sync, and works even before
    // Jobber is connected (reservations come from the winter form).
    const settings = await getClubSettings(db);
    const earlybirdAwarded = await awardSnowEarlybird(db, {
      bonusPoints: settings.pointsSnowEarlybird,
      deadline: dateFromYyyymmdd(settings.snowEarlybirdDeadline),
    });
    return NextResponse.json({ ...summary, earlybirdAwarded });
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: String(err) },
      { status: 500 }
    );
  }
}

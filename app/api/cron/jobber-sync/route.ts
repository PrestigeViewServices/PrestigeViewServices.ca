import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { syncJobber } from "@/lib/jobber";

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
    return NextResponse.json(summary);
  } catch (err) {
    return NextResponse.json(
      { ok: false, reason: String(err) },
      { status: 500 }
    );
  }
}

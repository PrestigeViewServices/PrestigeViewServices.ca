import { NextResponse } from "next/server";
import { getPublicSnowStatus, PHASE_DEFS } from "@/lib/snow-status";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Public snow event status, set by the owner at /admin/site/snow-status.
 * Fetched by the site-wide status bar and the weather widget (both client
 * components in static pages). Short CDN cache: an update shows within a
 * minute, and storm-night traffic stays cheap.
 */
export async function GET() {
  const status = await getPublicSnowStatus();
  const def = PHASE_DEFS[status.phase];
  return NextResponse.json(
    {
      status: {
        phase: status.phase,
        headline: def.headline,
        detail: status.note || def.detail,
        step: def.step,
        tone: def.tone,
        updatedAt: status.phase === "none" ? null : status.updatedAt,
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=30, stale-while-revalidate=60",
      },
    }
  );
}

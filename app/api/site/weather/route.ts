import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Current conditions + next-24h snowfall for Petawawa and Pembroke.
 *
 * The CDN cache is the ONLY cache: fresh for 10 min, then at most one more
 * 5 min stale serve while it refreshes, so data is never older than ~15 min.
 * Past that the CDN fetches fresh before answering. A failed fetch is never
 * cached, so the next request retries Open-Meteo immediately.
 */
export async function GET() {
  const weather = await getWeather();
  return NextResponse.json(
    { weather },
    {
      headers: {
        "Cache-Control": weather
          ? "public, s-maxage=600, stale-while-revalidate=300"
          : "no-store",
      },
    }
  );
}

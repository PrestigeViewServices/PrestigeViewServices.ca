import { NextResponse } from "next/server";
import { getWeather } from "@/lib/weather";

export const runtime = "nodejs";

/**
 * Current conditions + next-24h snowfall for Petawawa and Pembroke.
 * Upstream fetches are cached 15 min (lib/weather.ts); the CDN cache here
 * means a storm-night traffic spike never reaches Open-Meteo.
 */
export async function GET() {
  const weather = await getWeather();
  return NextResponse.json(
    { weather },
    {
      headers: {
        "Cache-Control": weather
          ? "public, s-maxage=600, stale-while-revalidate=1800"
          : "public, s-maxage=60",
      },
    }
  );
}

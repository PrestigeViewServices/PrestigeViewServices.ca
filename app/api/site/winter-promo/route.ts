import { NextResponse } from "next/server";
import { getSiteContent } from "@/lib/site-content";

export const runtime = "nodejs";

/**
 * The winter promo config, as edited at /admin/site/content.
 *
 * The announcement bar mounts in the ROOT layout, so it can't read the
 * database during render without forcing every static page dynamic. It
 * renders the code default instantly and fetches this for overrides; the
 * short CDN cache keeps it cheap and edits appear within a few minutes.
 */
export async function GET() {
  const { winterPromo } = await getSiteContent();
  return NextResponse.json(
    { promo: winterPromo },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

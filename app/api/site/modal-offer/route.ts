import { NextResponse } from "next/server";
import { getSiteContent, modalOfferFrom } from "@/lib/site-content";

export const runtime = "nodejs";

/**
 * The session promo modal's offer, as edited at /admin/site/content.
 *
 * The modal is a client component that mounts in the ROOT layout, so it
 * can't read the database during render without forcing every static page
 * dynamic. It fetches this instead; a short CDN cache keeps it cheap and
 * edits appear within a few minutes.
 */
export async function GET() {
  const content = await getSiteContent();
  const offer = modalOfferFrom(content);
  return NextResponse.json(
    { offer },
    {
      headers: {
        "Cache-Control": "public, s-maxage=300, stale-while-revalidate=600",
      },
    }
  );
}

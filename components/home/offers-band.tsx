import {
  activeOffersFrom,
  getSiteContent,
  toOffer,
} from "@/lib/site-content";
import { OfferCard } from "@/components/offer-card";
import { SectionHeading } from "@/components/section-heading";

/**
 * "What to Book Right Now" — the seasonal offers band on the home page.
 * Offers are owner-editable at /admin/site/content; code copy is the
 * fallback when nothing has been saved.
 */
export async function OffersBand() {
  const content = await getSiteContent();
  const featured = activeOffersFrom(content).slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="This Season"
        title="What to Book Right Now"
        description="Late August is the window: clear the leaves, clear the gutters, and lock your driveway in before the routes close."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((o) => (
          <OfferCard key={o.id} offer={toOffer(o)} />
        ))}
      </div>
    </section>
  );
}

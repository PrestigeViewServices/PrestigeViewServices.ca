import { activeOffers } from "@/lib/content/offers";
import { OfferCard } from "@/components/offer-card";
import { SectionHeading } from "@/components/section-heading";

export function OffersBand() {
  // Lead with the modal-featured offer (recurring revenue priority), then the rest.
  const sorted = [...activeOffers].sort((a, b) => {
    if (a.showInModal && !b.showInModal) return -1;
    if (!a.showInModal && b.showInModal) return 1;
    return 0;
  });

  // Show up to 3 on home — keeps focus tight.
  const featured = sorted.slice(0, 3);

  if (featured.length === 0) return null;

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Limited Time"
        title="Seasonal Offers"
        description="Lock in a recurring service this season and save."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {featured.map((o) => (
          <OfferCard key={o.id} offer={o} />
        ))}
      </div>
    </section>
  );
}

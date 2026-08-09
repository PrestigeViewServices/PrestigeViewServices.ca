import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { SectionHeading } from "@/components/section-heading";

/**
 * Home page before/after showcase. Each pair is a real PVS job shot from the
 * same angle before and after the visit. Portrait pairs sit side by side on
 * desktop; the landscape window pair gets its own full-width row below.
 */
const PORTRAIT_PAIRS = [
  {
    title: "Interlock walkway rebuild",
    note: "Old slabs out, compacted base in, new pavers with a charcoal border.",
    beforeSrc:
      "/images/gallery/landscaping/interlock-walkway-before-old-pavers.webp",
    afterSrc: "/images/gallery/landscaping/interlock-walkway-after-wide.webp",
    beforeAlt:
      "Aging patio-slab front walkway with timber edging before an interlock rebuild in Petawawa",
    afterAlt:
      "Finished interlock front walkway with charcoal paver border at the same Petawawa home",
  },
  {
    title: "Poolside reclaim",
    note: "Overgrowth and broken slabs cleared, then regraded with fresh topsoil.",
    beforeSrc: "/images/gallery/landscaping/pool-deck-before-overgrown.webp",
    afterSrc: "/images/gallery/landscaping/pool-deck-after-topsoil-pool.webp",
    beforeAlt:
      "Overgrown vines and shifting patio slabs crowding a backyard pool before a PVS landscaping rebuild",
    afterAlt:
      "The same backyard pool surrounded by clean, freshly graded topsoil after the rebuild",
  },
];

const WINDOW_PAIR = {
  beforeSrc: "/images/gallery/window-cleaning/modern-dark-frame-01.jpg",
  afterSrc: "/images/gallery/window-cleaning/modern-dark-frame-02.jpg",
  beforeAlt:
    "Residential window with water staining and film before professional window cleaning in the Ottawa Valley",
  afterAlt:
    "Same residential window crystal clear after a Prestige View Services window cleaning",
};

export function BeforeAfterSection() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="See the difference"
        title="Real Results, Up Close"
        description="Drag the handle on each photo to compare the same spot before and after a PVS visit."
      />

      <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:mx-auto lg:max-w-4xl">
        {PORTRAIT_PAIRS.map((pair) => (
          <figure key={pair.title}>
            <BeforeAfterSlider
              beforeSrc={pair.beforeSrc}
              afterSrc={pair.afterSrc}
              beforeAlt={pair.beforeAlt}
              afterAlt={pair.afterAlt}
              aspectClass="aspect-[3/4]"
            />
            <figcaption className="mt-3 px-1">
              <span className="block text-sm font-semibold">{pair.title}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">
                {pair.note}
              </span>
            </figcaption>
          </figure>
        ))}
      </div>

      <div className="mt-10 mx-auto max-w-3xl">
        <BeforeAfterSlider
          beforeSrc={WINDOW_PAIR.beforeSrc}
          afterSrc={WINDOW_PAIR.afterSrc}
          beforeAlt={WINDOW_PAIR.beforeAlt}
          afterAlt={WINDOW_PAIR.afterAlt}
        />
        <p className="mt-3 px-1 text-center text-sm font-semibold">
          One window cleaning visit
        </p>
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Drag the handle, or focus it and use the arrow keys.
        </p>
      </div>
    </section>
  );
}

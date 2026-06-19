import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { SectionHeading } from "@/components/section-heading";

// Real PVS ClearView job — modern dark-framed windows after a single visit.
const BEFORE_SRC = "/images/gallery/window-cleaning/modern-dark-frame-01.jpg";
const AFTER_SRC = "/images/gallery/window-cleaning/modern-dark-frame-02.jpg";

export function BeforeAfterSection() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="See the difference"
        title="ClearView Results — Drag to Compare"
        description="Drag the handle below to see what a single PVS ClearView visit does to filmy, water-stained windows."
      />
      <div className="mt-10 mx-auto max-w-3xl">
        <BeforeAfterSlider
          beforeSrc={BEFORE_SRC}
          afterSrc={AFTER_SRC}
          beforeAlt="Residential window with water staining and film before PVS ClearView cleaning"
          afterAlt="Same residential window crystal clear after a PVS ClearView window cleaning"
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Drag the handle, or focus it and use the ← → arrow keys.
        </p>
      </div>
    </section>
  );
}

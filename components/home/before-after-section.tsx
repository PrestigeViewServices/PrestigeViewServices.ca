import { BeforeAfterSlider } from "@/components/ui/before-after-slider";
import { SectionHeading } from "@/components/section-heading";

// TODO: Replace these placeholders with real ClearView before/after photos.
// Drop the production files into /public/images/before-after/ and update the
// two constants below. Both images should share the same aspect ratio (3:2
// looks best) so the divider lines up exactly between them.
const BEFORE_SRC = "/images/gallery/window-cleaning/aw-exterior-rain.jpg";
const AFTER_SRC =
  "/images/gallery/window-cleaning/stone-residence-after.jpg";

export function BeforeAfterSection() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="See the difference"
        title="ClearView Results — Drag to Compare"
        description="Drag the handle on the image below to see what a single PVS ClearView visit does to filmy windows and weather-stained siding."
      />
      <div className="mt-10 mx-auto max-w-3xl">
        <BeforeAfterSlider
          beforeSrc={BEFORE_SRC}
          afterSrc={AFTER_SRC}
          beforeAlt="Window exterior before PVS ClearView cleaning (placeholder)"
          afterAlt="Window exterior after PVS ClearView cleaning (placeholder)"
        />
        <p className="mt-4 text-center text-xs text-muted-foreground">
          Drag the handle, or focus it and use the ← → arrow keys.
        </p>
      </div>
    </section>
  );
}

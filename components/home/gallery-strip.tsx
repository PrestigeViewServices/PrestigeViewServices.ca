import Image from "next/image";
import { gallery } from "@/lib/content/gallery";
import { SectionHeading } from "@/components/section-heading";

/**
 * Recent Work gallery — driven entirely by lib/content/gallery.ts.
 * Hidden if the array is empty.
 */
export function GalleryStrip() {
  if (gallery.length === 0) return null;

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Recent Work"
        title="A Few Recent Properties"
        description="Real homes across Petawawa, Pembroke, and the Ottawa Valley — cleaned, mowed, and cleared by the PVS team."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {gallery.map((photo) => (
          <figure
            key={photo.id}
            className="group relative overflow-hidden rounded-2xl border border-surface-border bg-surface/60"
          >
            <div className="relative aspect-[3/2]">
              <Image
                src={photo.src}
                alt={photo.alt}
                fill
                sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
              />
              <div
                aria-hidden
                className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/70 to-transparent"
              />
            </div>
            {photo.caption && (
              <figcaption className="absolute bottom-3 left-4 right-4 text-sm font-medium text-white">
                {photo.caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

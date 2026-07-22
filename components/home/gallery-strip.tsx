import Image from "next/image";
import { gallery as staticGallery } from "@/lib/content/gallery";
import { getDb, isDbReady } from "@/lib/db";
import { SectionHeading } from "@/components/section-heading";

/**
 * Recent Work gallery. Tries the DB first (managed via /admin/site/photos);
 * falls back to the static lib/content/gallery.ts entries if no DB photos
 * exist (or the DB isn't configured yet).
 *
 * Hidden entirely when neither source has anything to show.
 */

type GalleryItem = {
  key: string;
  src: string;
  alt: string;
  caption?: string | null;
  width?: number;
  height?: number;
};

async function loadGallery(): Promise<GalleryItem[]> {
  if (isDbReady()) {
    const db = getDb();
    if (db) {
      try {
        const dbPhotos = await db.galleryImage.findMany({
          where: { section: "home", active: true },
          orderBy: [{ sortOrder: "asc" }, { createdAt: "desc" }],
        });
        if (dbPhotos.length > 0) {
          return dbPhotos.map((p) => ({
            key: p.id,
            src: p.url,
            alt: p.alt,
            caption: p.caption,
          }));
        }
      } catch {
        // Swallow, fall through to static gallery if DB query fails.
      }
    }
  }

  return staticGallery.map((g) => ({
    key: g.id,
    src: g.src,
    alt: g.alt,
    caption: g.caption,
    width: g.width,
    height: g.height,
  }));
}

export async function GalleryStrip() {
  const items = await loadGallery();
  if (items.length === 0) return null;

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Recent Work"
        title="A Few Recent Properties"
        description="Real homes across Petawawa, Pembroke, and the Ottawa Valley. Cleaned, mowed, and cleared by the PVS team."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((photo) => (
          <figure
            key={photo.key}
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

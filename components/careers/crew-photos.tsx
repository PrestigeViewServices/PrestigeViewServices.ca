import Image from "next/image";
import { SectionHeading } from "@/components/section-heading";

/**
 * Real crew photos on the careers page: one big team shot, then a row of
 * in-the-field tiles. Photos live in /public/images/careers/.
 */
const TILES = [
  {
    src: "/images/careers/crew-banner-mowers.webp",
    alt: "PVS crew members with the company banner and John Deere mowers outside the shop",
    caption: "The lawn fleet",
  },
  {
    src: "/images/careers/crew-window-squeegee.webp",
    alt: "PVS crew member squeegeeing a residential window from a ladder",
    caption: "Window detail work",
  },
  {
    src: "/images/careers/crew-roof-gutter-work.webp",
    alt: "PVS crew member working along a roofline during a gutter cleaning",
    caption: "Roofline & gutters",
  },
  {
    src: "/images/careers/crew-ladders-banner.webp",
    alt: "Three PVS crew members posing on ladders around the company banner",
    caption: "The window crew",
  },
];

export function CrewPhotos() {
  return (
    <section className="container-max py-14 sm:py-16">
      <SectionHeading
        eyebrow="The Team"
        title="This Is Who You'd Work With"
        description="Real crew, real equipment, real jobs across Petawawa, Pembroke, and the Ottawa Valley."
      />

      <figure className="mt-10 relative aspect-[16/9] sm:aspect-[2/1] overflow-hidden rounded-3xl border border-surface-border bg-surface/50">
        <Image
          src="/images/careers/crew-truck-lineup.webp"
          alt="The PVS crew lined up in front of a company truck at the Petawawa shop"
          fill
          sizes="(min-width: 1280px) 1200px, 100vw"
          className="object-cover"
        />
        <figcaption className="absolute bottom-3 left-4 rounded-full bg-black/55 px-3 py-1 text-xs font-semibold text-white backdrop-blur-sm">
          The PVS crew · Petawawa shop
        </figcaption>
      </figure>

      <div className="mt-5 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {TILES.map((t) => (
          <figure
            key={t.src}
            className="group relative aspect-[4/3] overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
          >
            <Image
              src={t.src}
              alt={t.alt}
              fill
              sizes="(min-width: 1024px) 25vw, 50vw"
              className="object-cover transition-transform duration-700 group-hover:scale-[1.04]"
            />
            <figcaption className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 py-2 pt-8 text-xs font-semibold text-white">
              {t.caption}
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

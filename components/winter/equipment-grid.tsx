import Image from "next/image";
import { MapPin, Medal, Users } from "lucide-react";
import { WINTER_EQUIPMENT } from "@/lib/content/winter-campaign";

/**
 * "Local crew, real equipment" — the proof section. Photos are real PVS
 * jobs from /public/images/gallery/snow-removal; the manifest lives in
 * lib/content/winter-campaign.ts so swapping a photo is a one-line change.
 */
export function EquipmentGrid() {
  return (
    <section className="container-max py-14">
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">Local Crew, Real Equipment</p>
        <h2 className="heading-section mt-2 text-balance">
          The rigs that fight your storm live down the road
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          No subcontracted mystery trucks. PVS runs its own tractors, plow
          trucks, and shovel crew out of Petawawa, operated by people who
          drive these streets every day.
        </p>
      </div>

      <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-sm font-medium">
        <li className="inline-flex items-center gap-1.5">
          <MapPin className="h-4 w-4 text-sky-300" aria-hidden />
          Petawawa based
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Medal className="h-4 w-4 text-sky-300" aria-hidden />
          Veteran owned
        </li>
        <li className="inline-flex items-center gap-1.5">
          <Users className="h-4 w-4 text-sky-300" aria-hidden />
          Crews live here too
        </li>
      </ul>

      <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {WINTER_EQUIPMENT.map((item) => (
          <figure
            key={item.src}
            className="group overflow-hidden rounded-2xl border border-surface-border bg-surface/50"
          >
            <div className="relative aspect-[4/3]">
              <Image
                src={item.src}
                alt={item.alt}
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
            </div>
            <figcaption className="p-4">
              <p className="text-sm font-semibold">{item.title}</p>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {item.caption}
              </p>
            </figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}

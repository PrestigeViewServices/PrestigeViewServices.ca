import Image from "next/image";
import { Check, MapPin, Tractor } from "lucide-react";
import { SNOW_TOWNS } from "@/lib/content/snow-coverage";
import { cn } from "@/lib/utils";

/**
 * "Which machine clears my driveway?" — tractors, on every route in both
 * towns. Reads from lib/content/snow-coverage.ts.
 */
export function EquipmentByTown({
  id = "equipment",
  eyebrow = "Your town, your equipment",
  title = "Tractors on every route. Pembroke and Petawawa.",
  description = "No plow trucks. Every driveway on our routes is cleared by tractor. Here is exactly what shows up at your property this winter.",
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  className?: string;
}) {
  return (
    <section id={id} className={cn("container-max scroll-mt-24 py-14", className)}>
      <div className="max-w-2xl">
        <p className="eyebrow text-sky-300">
          <MapPin className="h-3.5 w-3.5" aria-hidden />
          {eyebrow}
        </p>
        <h2 className="heading-section mt-2 text-balance">{title}</h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          {description}
        </p>
      </div>

      <div className="mt-9 grid gap-5 md:grid-cols-2">
        {SNOW_TOWNS.map((town) => {
          const Icon = Tractor;
          return (
            <article
              key={town.slug}
              className="surface-card overflow-hidden"
              aria-labelledby={`${id}-${town.slug}`}
            >
              <div className="relative aspect-[16/9]">
                <Image
                  src={town.img}
                  alt={town.alt}
                  fill
                  sizes="(max-width: 768px) 100vw, 50vw"
                  className="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5">
                  <p className="text-2xl font-bold text-white">{town.name}</p>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-bold uppercase tracking-wide text-slate-900">
                    <Icon className="h-3.5 w-3.5" aria-hidden />
                    {town.equipment}
                  </span>
                </div>
              </div>
              <div className="p-6">
                <h3 id={`${id}-${town.slug}`} className="text-lg font-semibold">
                  {town.headline}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {town.body}
                </p>
                <ul className="mt-4 space-y-2 text-sm">
                  {town.points.map((p) => (
                    <li key={p} className="flex items-start gap-2">
                      <Check
                        className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                        strokeWidth={3}
                        aria-hidden
                      />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}

import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Building2, Check, MapPin, Tractor, Truck } from "lucide-react";
import { SNOW_TOWNS } from "@/lib/content/snow-coverage";
import { cn } from "@/lib/utils";

/**
 * "Which machine clears my driveway?" — Pembroke runs plow trucks,
 * Petawawa runs tractors only. Reads from lib/content/snow-coverage.ts.
 *
 * `showCommercial` adds the commercial snow strip underneath so every
 * winter page also tells businesses we take their lots.
 */
export function EquipmentByTown({
  id = "equipment",
  eyebrow = "Your town, your equipment",
  title = "Plow trucks in Pembroke. Tractors in Petawawa.",
  description = "We match the machine to the town so every route runs at its best. Here is exactly what shows up at your property this winter.",
  showCommercial = true,
  className,
}: {
  id?: string;
  eyebrow?: string;
  title?: string;
  description?: string;
  showCommercial?: boolean;
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
          const Icon = town.slug === "pembroke" ? Truck : Tractor;
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

      {showCommercial && <CommercialSnowStrip className="mt-5" />}
    </section>
  );
}

/** Slim "we do commercial too" band. Used on every winter surface. */
export function CommercialSnowStrip({ className }: { className?: string }) {
  return (
    <Link
      href="/commercial-snow-removal"
      className={cn(
        "group flex flex-col gap-4 rounded-2xl border border-sky-400/25 bg-gradient-to-r from-blue-950/80 via-slate-900 to-sky-950/60 p-5 transition-colors hover:border-sky-300/50 sm:flex-row sm:items-center sm:p-6",
        className
      )}
    >
      <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
        <Building2 className="h-6 w-6" aria-hidden />
      </span>
      <span className="flex-1">
        <span className="block text-base font-semibold text-white">
          Own a business or manage a property? We do commercial snow removal too.
        </span>
        <span className="mt-1 block text-sm text-sky-100/75">
          Parking lots, storefronts, plazas, multi-unit residential, and
          walkways, plowed and salted on a seasonal contract or per event.
        </span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-sky-300">
        Commercial snow quote
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" aria-hidden />
      </span>
    </Link>
  );
}

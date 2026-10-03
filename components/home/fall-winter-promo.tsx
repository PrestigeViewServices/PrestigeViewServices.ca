import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Building2,
  Check,
  Leaf,
  Snowflake,
  Tractor,
  Truck,
} from "lucide-react";

/**
 * The seasonal push on the home page. Three doors, one per thing we are
 * selling hardest right now: fall cleanups, residential snow, commercial
 * snow. Each card states the outcome, three proof points, and one CTA.
 */
const CARDS = [
  {
    key: "fall",
    eyebrow: "Book now, before the freeze",
    eyebrowIcon: Leaf,
    eyebrowCls: "text-amber-300",
    title: "Fall Cleanup",
    pitch:
      "Leaves hauled, beds cut back, gutters cleared, final cut at winter height. Your yard goes under the snow clean and comes out healthy.",
    points: [
      "Leaves mulched or hauled away",
      "Gutters cleared before ice dams form",
      "One visit, property winter-ready",
    ],
    img: "/images/gallery/landscaping/trimmed-hedge-cleared-yard-ottawa-valley.webp",
    alt: "Ottawa Valley yard cleared and trimmed after a PVS fall cleanup",
    href: "/services/fall-cleanup",
    cta: "Book my fall cleanup",
    ring: "hover:border-amber-300/50",
    btn: "bg-amber-400 text-slate-950 hover:bg-amber-300",
  },
  {
    key: "snow",
    eyebrow: "Winter routes filling",
    eyebrowIcon: Snowflake,
    eyebrowCls: "text-sky-300",
    title: "Residential Snow Removal",
    pitch:
      "One seasonal plan, paid monthly. Storms trigger us automatically, so your driveway is open before you need out. You never make a call.",
    points: [
      "Pembroke: cleared by plow truck",
      "Petawawa: cleared by tractor only",
      "City windrow and walkways available",
    ],
    img: "/images/gallery/snow-removal/tractor-cleared-driveway-bluebird-day.webp",
    alt: "Driveway cleared edge to edge by a PVS tractor after a snowfall",
    href: "/winter-packages",
    cta: "See snow plans & pricing",
    ring: "hover:border-sky-300/50",
    btn: "bg-gradient-primary text-white hover:brightness-110",
  },
  {
    key: "commercial",
    eyebrow: "For businesses",
    eyebrowIcon: Building2,
    eyebrowCls: "text-cyan-300",
    title: "Commercial Snow Removal",
    pitch:
      "Lots, storefronts, plazas, and multi-unit properties plowed and salted so customers and tenants get in safely, open to close.",
    points: [
      "Seasonal contracts or per-event",
      "Lots plowed, walks shovelled & salted",
      "Certificate of insurance on request",
    ],
    img: "/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp",
    alt: "PVS plow truck clearing a commercial lot during an overnight snowfall",
    href: "/commercial-snow-removal",
    cta: "Get a commercial quote",
    ring: "hover:border-cyan-300/50",
    btn: "border border-cyan-300/40 bg-cyan-400/10 text-cyan-100 hover:bg-cyan-400/20",
  },
] as const;

export function FallWinterPromo() {
  return (
    <section className="container-max py-16 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <p className="eyebrow justify-center text-amber-300">
          <Leaf className="h-3.5 w-3.5" aria-hidden />
          This season
          <Snowflake className="h-3.5 w-3.5 text-sky-300" aria-hidden />
        </p>
        <h2 className="heading-section mt-3 text-balance">
          Fall cleanup now. <span className="text-gradient-season">Snow handled all winter.</span>
        </h2>
        <p className="mt-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          Pick what you need. Book the cleanup and a snow plan together and
          your property is covered from the last leaf to the spring thaw.
        </p>
      </div>

      <div className="mt-10 grid gap-5 lg:grid-cols-3">
        {CARDS.map((c) => (
          <article
            key={c.key}
            className={`surface-card group flex flex-col overflow-hidden ${c.ring}`}
          >
            <Link href={c.href} className="relative block aspect-[16/10]" tabIndex={-1} aria-hidden>
              <Image
                src={c.img}
                alt=""
                fill
                sizes="(max-width: 1024px) 100vw, 33vw"
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            </Link>
            <div className="flex flex-1 flex-col p-6">
              <p className={`eyebrow ${c.eyebrowCls}`}>
                <c.eyebrowIcon className="h-3.5 w-3.5" aria-hidden />
                {c.eyebrow}
              </p>
              <h3 className="mt-2 text-xl font-bold">{c.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                {c.pitch}
              </p>
              <ul className="mt-4 space-y-2 text-sm">
                {c.points.map((p) => {
                  const Icon = p.startsWith("Pembroke")
                    ? Truck
                    : p.startsWith("Petawawa")
                      ? Tractor
                      : Check;
                  return (
                    <li key={p} className="flex items-start gap-2">
                      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
                      {p}
                    </li>
                  );
                })}
              </ul>
              <Link
                href={c.href}
                className={`mt-6 inline-flex h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-semibold transition ${c.btn}`}
              >
                {c.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
              </Link>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

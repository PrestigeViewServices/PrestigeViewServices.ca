import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Droplets,
  Waves,
  Leaf,
  Scissors,
  TreeDeciduous,
  Shovel,
  Snowflake,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

/**
 * "What We Do", 8-tile grid, one tile per core service, each linking to
 * its dedicated service page. One brand, no sub-brand names.
 */
type Tile = {
  slug: string;
  name: string;
  pitch: string;
  icon: typeof Sparkles;
  iconBg: string;
  iconText: string;
};

const TILES: Tile[] = [
  {
    slug: "snow-removal",
    name: "Snow Removal",
    pitch: "Seasonal contracts that keep your driveway clear all winter.",
    icon: Snowflake,
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-300",
  },
  {
    slug: "fall-cleanup",
    name: "Fall Cleanups",
    pitch: "Every leaf cleared, lawn cut to winter height, beds put to bed.",
    icon: Leaf,
    iconBg: "bg-amber-500/15",
    iconText: "text-amber-400",
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    pitch: "Cleared and flushed before packed leaves freeze into ice dams.",
    icon: Droplets,
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-400",
  },
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    pitch: "Streak-free glass, inside and out, with frame and sill care.",
    icon: Sparkles,
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
  },
  {
    slug: "lawn-mowing",
    name: "Lawn Care & Mowing",
    pitch: "Weekly cuts, crisp edges, aeration and overseeding.",
    icon: Scissors,
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
  },
  {
    slug: "hedge-trimming",
    name: "Hedge Trimming & Shrub Care",
    pitch: "Sharp, clean lines that make the whole property look maintained.",
    icon: TreeDeciduous,
    iconBg: "bg-green-500/15",
    iconText: "text-green-400",
  },
  {
    slug: "landscaping-services",
    name: "Landscaping Projects",
    pitch: "Bed refreshes, mulch, edging, and planting. Big curb appeal, fast.",
    icon: Shovel,
    iconBg: "bg-lime-500/15",
    iconText: "text-lime-400",
  },
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    pitch: "Driveways, walkways, decks and patios, restored rather than just rinsed.",
    icon: Waves,
    iconBg: "bg-cyan-500/15",
    iconText: "text-cyan-400",
  },
];

export function ServicesOverview() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="What We Do"
        title="One crew. Every season."
        description="Eight services, one local team. Right now that means fall cleanups, gutters, and locking in your winter, all on one schedule and one easy bill."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {TILES.map((t) => {
          const Icon = t.icon;
          return (
            <Link
              key={t.slug}
              href={`/services/${t.slug}`}
              className="surface-card surface-card-hover group flex flex-col p-6"
            >
              <div
                className={cn(
                  "grid h-11 w-11 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110",
                  t.iconBg,
                  t.iconText
                )}
              >
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-base font-bold leading-tight">
                {t.name}
              </h3>
              <p className="mt-2 flex-1 text-sm text-muted-foreground leading-relaxed">
                {t.pitch}
              </p>
              <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary">
                Learn more
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </span>
            </Link>
          );
        })}
      </div>
      <p className="mt-8 text-center text-sm text-muted-foreground">
        Also available: house washing, junk removal, and property
        cleanouts.{" "}
        <Link href="/services" className="font-semibold text-primary">
          See all services →
        </Link>
      </p>
    </section>
  );
}

import Link from "next/link";
import { ArrowRight, Leaf, Sparkles, Snowflake, Check } from "lucide-react";
import { services } from "@/lib/content/services";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

/**
 * "What We Do" — replaces the old per-division overview. Same visual
 * shape (3 cards) but framed as service categories under the single
 * Prestige View Services brand, not as standalone sub-brands.
 */

type Group = {
  key: "lawn" | "exterior" | "snow";
  title: string;
  pitch: string;
  icon: typeof Leaf;
  // Internal: which service `division` slugs roll up here.
  source: ("lawnpros" | "clearview" | "snowland")[];
  // service slugs to feature on the home tile
  topServices: string[];
  iconBg: string;
  iconText: string;
  linkText: string;
};

const GROUPS: Group[] = [
  {
    key: "lawn",
    title: "Lawn Care",
    pitch:
      "Recurring lawn mowing, seasonal cleanups, and turf health for Petawawa & Pembroke homeowners.",
    icon: Leaf,
    source: ["lawnpros"],
    topServices: ["lawn-mowing", "spring-cleanup", "aeration"],
    iconBg: "bg-emerald-500/15",
    iconText: "text-emerald-400",
    linkText: "text-emerald-400 hover:text-emerald-300",
  },
  {
    key: "exterior",
    title: "Exterior Cleaning",
    pitch:
      "Streak-free windows, clean gutters, and pressure washing across the Ottawa Valley.",
    icon: Sparkles,
    source: ["clearview"],
    topServices: ["window-cleaning", "gutter-cleaning", "pressure-washing"],
    iconBg: "bg-blue-500/15",
    iconText: "text-blue-400",
    linkText: "text-blue-400 hover:text-blue-300",
  },
  {
    key: "snow",
    title: "Snow & Ice",
    pitch:
      "Residential snow removal and seasonal contracts so your driveway and walkways stay safe all winter.",
    icon: Snowflake,
    source: ["snowland"],
    topServices: ["snow-removal", "seasonal-snow-contract", "walkway-clearing"],
    iconBg: "bg-sky-500/15",
    iconText: "text-sky-400",
    linkText: "text-sky-400 hover:text-sky-300",
  },
];

function findService(slug: string) {
  return services.find((s) => s.slug === slug);
}

export function ServicesOverview() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="What We Do"
        title="One crew. Every season."
        description="Year-round property care across the Ottawa Valley — bundled into one local team, one schedule, one easy bill."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {GROUPS.map((g) => {
          const Icon = g.icon;
          return (
            <article
              key={g.key}
              className="surface-card surface-card-hover p-7 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl",
                    g.iconBg,
                    g.iconText
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-bold leading-tight">{g.title}</h3>
              </div>
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                {g.pitch}
              </p>
              <ul className="mt-5 space-y-2 flex-1">
                {g.topServices.map((slug) => {
                  const s = findService(slug);
                  if (!s) return null;
                  return (
                    <li key={slug} className="flex items-center gap-2 text-sm">
                      <Check
                        className={cn("h-4 w-4 shrink-0", g.iconText)}
                        strokeWidth={3}
                      />
                      <span>{s.name}</span>
                    </li>
                  );
                })}
              </ul>
              <Link
                href="/services"
                className={cn(
                  "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
                  g.linkText
                )}
              >
                See all {g.title.toLowerCase()} services
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

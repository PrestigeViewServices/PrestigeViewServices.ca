import type { Metadata } from "next";
import { Leaf, Sparkles, Snowflake, type LucideIcon } from "lucide-react";
import { services } from "@/lib/content/services";
import { ServiceCard } from "@/components/service-card";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = {
  title: "All Services — Lawn, Window Cleaning, Snow Removal & More",
  description:
    "Every Prestige View Services offering — lawn mowing, spring cleanups, aeration, window cleaning, gutter clearing, pressure washing, snow contracts, and more. Petawawa, Pembroke & the Ottawa Valley.",
  alternates: { canonical: "/services" },
};

type Group = {
  id: string;
  title: string;
  blurb: string;
  icon: LucideIcon;
  // Pulls from the `division` field on Service — internal taxonomy only.
  // The public-facing name is the section title above.
  source: ("lawnpros" | "clearview" | "snowland")[];
};

const GROUPS: Group[] = [
  {
    id: "lawn-care",
    title: "Lawn Care",
    blurb: "Recurring mowing, seasonal cleanups, aeration, and turf health.",
    icon: Leaf,
    source: ["lawnpros"],
  },
  {
    id: "exterior-cleaning",
    title: "Exterior Cleaning",
    blurb:
      "Streak-free windows, gutter clearing, pressure washing, and house-side touch-ups.",
    icon: Sparkles,
    source: ["clearview"],
  },
  {
    id: "snow-and-ice",
    title: "Snow & Ice",
    blurb:
      "Residential snow removal, seasonal contracts, walkway clearing — Ottawa Valley winters handled.",
    icon: Snowflake,
    source: ["snowland"],
  },
];

export default function ServicesPage() {
  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Everything PVS"
          title="All Services"
          description="One crew for every season. Bundle two or more on a recurring schedule for better rates and a single point of contact."
        />
      </section>

      <section className="container-max pb-16 space-y-16">
        {GROUPS.map((g) => {
          const list = services.filter((s) => g.source.includes(s.division));
          if (list.length === 0) return null;
          const Icon = g.icon;
          return (
            <div key={g.id} id={g.id} className="scroll-mt-24">
              <header className="flex items-start gap-3 max-w-2xl">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">
                    {g.title}
                  </h2>
                  <p className="mt-1.5 text-sm sm:text-base text-muted-foreground">
                    {g.blurb}
                  </p>
                </div>
              </header>
              <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {list.map((s) => (
                  <ServiceCard key={s.slug} service={s} />
                ))}
              </div>
            </div>
          );
        })}
      </section>

      <CtaBand />
    </>
  );
}

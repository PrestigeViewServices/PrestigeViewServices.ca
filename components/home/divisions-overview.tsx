import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { divisions } from "@/lib/content/divisions";
import { getService } from "@/lib/content/services";
import { SectionHeading } from "@/components/section-heading";
import { cn } from "@/lib/utils";

const accentBg: Record<string, string> = {
  lawn: "bg-emerald-500/15 text-emerald-400",
  clearview: "bg-blue-500/15 text-blue-400",
  snowland: "bg-sky-500/15 text-sky-400",
};

const accentText: Record<string, string> = {
  lawn: "text-emerald-400",
  clearview: "text-blue-400",
  snowland: "text-sky-400",
};

const accentLink: Record<string, string> = {
  lawn: "text-emerald-400 hover:text-emerald-300",
  clearview: "text-blue-400 hover:text-blue-300",
  snowland: "text-sky-400 hover:text-sky-300",
};

export function DivisionsOverview() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Three Crews, One Number"
        title="Our Divisions"
        description="Specialist teams for lawn, exterior, and snow — coordinated under one trusted PVS account."
      />
      <div className="mt-12 grid gap-5 md:grid-cols-3">
        {divisions.map((d) => {
          const Icon = d.icon;
          return (
            <article
              key={d.slug}
              className="surface-card surface-card-hover p-7 flex flex-col"
            >
              <div className="flex items-center gap-3">
                <div
                  className={cn(
                    "grid h-12 w-12 place-items-center rounded-xl",
                    accentBg[d.accent]
                  )}
                >
                  <Icon className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold leading-tight">
                    {d.name}
                  </h3>
                  <p
                    className={cn(
                      "text-xs uppercase tracking-wider mt-0.5",
                      accentText[d.accent]
                    )}
                  >
                    {d.tagline}
                  </p>
                </div>
              </div>
              <p className="mt-5 text-sm text-muted-foreground leading-relaxed">
                {d.description}
              </p>
              <ul className="mt-5 space-y-2 flex-1">
                {d.topServices.map((slug) => {
                  const s = getService(slug);
                  if (!s) return null;
                  return (
                    <li
                      key={slug}
                      className="flex items-center gap-2 text-sm"
                    >
                      <Check
                        className={cn("h-4 w-4 shrink-0", accentText[d.accent])}
                        strokeWidth={3}
                      />
                      <span>{s.name}</span>
                    </li>
                  );
                })}
              </ul>
              <Link
                href={`/divisions/${d.slug}`}
                className={cn(
                  "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-colors",
                  accentLink[d.accent]
                )}
              >
                View Division
                <ArrowRight className="h-4 w-4" />
              </Link>
            </article>
          );
        })}
      </div>
    </section>
  );
}

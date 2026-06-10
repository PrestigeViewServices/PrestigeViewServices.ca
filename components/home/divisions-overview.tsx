"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Check } from "lucide-react";
import { divisions } from "@/lib/content/divisions";
import { getService } from "@/lib/content/services";
import { SectionHeading } from "@/components/section-heading";
import { TiltCard } from "@/components/ui/tilt-card";
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

const accentGlow: Record<string, string> = {
  lawn: "rgba(34,197,94,0.35)",
  clearview: "rgba(59,130,246,0.35)",
  snowland: "rgba(56,189,248,0.35)",
};

const accentBorderHover: Record<string, string> = {
  lawn: "group-hover:border-emerald-400/40",
  clearview: "group-hover:border-blue-400/40",
  snowland: "group-hover:border-sky-400/40",
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
        {divisions.map((d, i) => {
          const Icon = d.icon;
          return (
            <motion.article
              key={d.slug}
              initial={{ opacity: 0, y: 28 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{
                duration: 0.45,
                delay: i * 0.08,
                ease: [0.22, 1, 0.36, 1],
              }}
              className="group"
            >
              <TiltCard
                glowColor={accentGlow[d.accent]}
                className="rounded-2xl h-full"
              >
                <div
                  className={cn(
                    "surface-card p-7 flex flex-col h-full transition-colors duration-300",
                    accentBorderHover[d.accent]
                  )}
                >
                  <div className="flex items-center gap-3">
                    <motion.div
                      whileHover={{ rotate: -6, scale: 1.1 }}
                      transition={{ type: "spring", stiffness: 300, damping: 14 }}
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-xl",
                        accentBg[d.accent]
                      )}
                    >
                      <Icon className="h-6 w-6" />
                    </motion.div>
                    <div>
                      <h3 className="text-lg font-bold leading-tight">{d.name}</h3>
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
                            className={cn(
                              "h-4 w-4 shrink-0",
                              accentText[d.accent]
                            )}
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
                      "mt-6 inline-flex items-center gap-1.5 text-sm font-semibold transition-all",
                      accentLink[d.accent]
                    )}
                  >
                    View Division
                    <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                  </Link>
                </div>
              </TiltCard>
            </motion.article>
          );
        })}
      </div>
    </section>
  );
}

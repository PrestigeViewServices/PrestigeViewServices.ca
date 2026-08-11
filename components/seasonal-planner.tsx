"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { seasonalMonths, type SeasonalMonth } from "@/lib/content/seasonal";
import { getService } from "@/lib/content/services";
import { SamImage, type SamPose } from "@/components/sam";
import { cn } from "@/lib/utils";

const SEASON_POSE: Record<SeasonalMonth["season"], SamPose> = {
  winter: "hero",
  spring: "pressure",
  summer: "mower",
  fall: "gutter",
};

const SEASON_STYLE: Record<SeasonalMonth["season"], string> = {
  winter: "border-sky-400/30 from-blue-950 via-blue-900 to-sky-950",
  spring: "border-emerald-400/25 from-emerald-950 via-teal-950 to-blue-950",
  summer: "border-yellow-400/25 from-emerald-950 via-green-900 to-teal-950",
  fall: "border-orange-400/25 from-orange-950 via-amber-950 to-blue-950",
};

export function SeasonalPlanner({ initialMonth }: { initialMonth: number }) {
  // The server resolves "now" per-request (Ottawa time) so the SSR HTML and
  // the hydrated client agree on the selected month.
  const [selected, setSelected] = useState(initialMonth);
  const month = seasonalMonths.find((m) => m.month === selected)!;

  return (
    <div>
      {/* Month picker */}
      <div
        role="tablist"
        aria-label="Pick a month"
        className="flex flex-wrap justify-center gap-2"
      >
        {seasonalMonths.map((m) => (
          <button
            key={m.month}
            role="tab"
            aria-selected={m.month === selected}
            onClick={() => setSelected(m.month)}
            className={cn(
              "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
              m.month === selected
                ? "border-primary bg-primary text-white"
                : "border-surface-border bg-surface/50 text-muted-foreground hover:border-primary/40 hover:text-foreground"
            )}
          >
            {m.name.slice(0, 3)}
          </button>
        ))}
      </div>

      {/* Month card */}
      <div
        className={cn(
          "relative mt-8 overflow-hidden rounded-3xl border bg-gradient-to-br p-6 sm:p-10",
          SEASON_STYLE[month.season]
        )}
      >
        <div className="grid items-center gap-6 lg:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-white/60">
              {month.season} · Ottawa Valley
            </p>
            <h3 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              {month.name}
            </h3>
            <p className="mt-2 max-w-xl text-base leading-relaxed text-white/80">
              {month.vibe}
            </p>

            <div className="mt-5 flex items-end gap-3 lg:hidden">
              <SamImage pose={SEASON_POSE[month.season]} size={96} className="w-20 drop-shadow-lg" />
              <p className="mb-2 flex-1 rounded-2xl rounded-bl-md border border-yellow-400/30 bg-yellow-400/10 p-3 text-sm leading-relaxed text-white/90">
                {month.samSays}
              </p>
            </div>
          </div>

          <div className="hidden lg:flex items-end gap-4 max-w-md">
            <SamImage
              pose={SEASON_POSE[month.season]}
              size={176}
              className="w-40 drop-shadow-xl"
            />
            <p className="mb-4 rounded-2xl rounded-bl-md border border-yellow-400/30 bg-yellow-400/10 p-4 text-sm leading-relaxed text-white/90">
              {month.samSays}
            </p>
          </div>
        </div>
      </div>

      {/* Tasks */}
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {month.tasks.map((t) => {
          const service = t.serviceSlug ? getService(t.serviceSlug) : undefined;
          return (
            <div key={t.label} className="surface-card flex flex-col p-5">
              <div className="flex items-start gap-2.5">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
                <h4 className="text-base font-semibold leading-snug">
                  {t.label}
                </h4>
              </div>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">
                {t.detail}
              </p>
              {service && (
                <Link
                  href={`/services/${service.slug}`}
                  className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
                >
                  {service.name}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

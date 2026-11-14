"use client";

import Link from "next/link";
import {
  ArrowRight,
  Check,
  Cloud,
  CloudDrizzle,
  CloudFog,
  CloudLightning,
  CloudRain,
  CloudSnow,
  CloudSun,
  Moon,
  Snowflake,
  Sun,
  Wind,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { SNOW_TRIGGER_CM, type TownWeather, type WeatherIcon } from "@/lib/weather";
import { PHASE_DEFS, TIMELINE } from "@/lib/snow-status-phases";
import { timeAgo, useSnowStatus, useWeather } from "./use-site-weather";

const ICONS: Record<WeatherIcon, LucideIcon> = {
  sun: Sun,
  moon: Moon,
  partly: CloudSun,
  cloud: Cloud,
  fog: CloudFog,
  drizzle: CloudDrizzle,
  rain: CloudRain,
  freezing: CloudDrizzle,
  snow: CloudSnow,
  "heavy-snow": Snowflake,
  storm: CloudLightning,
};

const STEP_TONE = {
  idle: "bg-slate-500",
  amber: "bg-amber-400",
  sky: "bg-sky-400",
  violet: "bg-violet-400",
  emerald: "bg-emerald-400",
} as const;

/**
 * "Weather & storm status" card: current conditions in Petawawa and
 * Pembroke, the next-24h snowfall against our 5 cm route trigger, and where
 * we are in the current snow event (set by the owner in the admin).
 */
export function WeatherWidget({
  id,
  className,
  showMapLink = true,
}: {
  id?: string;
  className?: string;
  showMapLink?: boolean;
}) {
  const weather = useWeather();
  const status = useSnowStatus();
  const step = status?.step ?? 0;
  const live = status?.phase === "deployed" || status?.phase === "cleanup";

  return (
    <section id={id} className={cn("container-max scroll-mt-24 py-8", className)}>
      <div className="overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-[#0A1220] via-slate-900 to-blue-950/80 shadow-2xl shadow-sky-950/30">
        <div className="grid gap-0 lg:grid-cols-[1.1fr_1fr]">
          {/* ---- Storm status ---- */}
          <div className="border-b border-sky-400/10 p-6 sm:p-8 lg:border-b-0 lg:border-r">
            <p className="eyebrow text-sky-300">Storm status</p>
            <h2 className="mt-2 flex items-center gap-2.5 text-2xl font-bold text-white sm:text-3xl">
              {live && (
                <span className="relative flex h-3 w-3 shrink-0" aria-hidden>
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                  <span className="relative inline-flex h-3 w-3 rounded-full bg-sky-400" />
                </span>
              )}
              {status ? status.headline : "Checking status…"}
            </h2>
            <p className="mt-2 text-sm leading-relaxed text-sky-100/75">
              {status?.detail ?? " "}
            </p>
            {status?.updatedAt && (
              <p className="mt-1 text-xs text-sky-200/50">
                Updated {timeAgo(status.updatedAt)}
              </p>
            )}

            {/* Timeline */}
            <ol className="mt-6 grid grid-cols-4 gap-2" aria-label="Snow event progress">
              {TIMELINE.map((phase) => {
                const def = PHASE_DEFS[phase];
                const done = step > def.step;
                const current = step === def.step;
                return (
                  <li key={phase} className="min-w-0">
                    <div
                      className={cn(
                        "h-1.5 rounded-full transition-colors",
                        done || current ? STEP_TONE[def.tone] : "bg-white/10"
                      )}
                    />
                    <p
                      className={cn(
                        "mt-2 flex items-center gap-1 text-[11px] font-semibold uppercase leading-tight tracking-wide sm:text-xs",
                        current ? "text-white" : done ? "text-sky-100/70" : "text-sky-100/35"
                      )}
                      aria-current={current ? "step" : undefined}
                    >
                      {done && <Check className="h-3 w-3 shrink-0" aria-hidden />}
                      {def.label}
                    </p>
                  </li>
                );
              })}
            </ol>

            {showMapLink && (
              <Link
                href="/live-map"
                className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-300 hover:text-sky-200"
              >
                {live ? "Watch the tractors live" : "See the live tractor map"}
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            )}
          </div>

          {/* ---- Local weather ---- */}
          <div className="p-6 sm:p-8">
            <p className="eyebrow text-sky-300">Local weather</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
              {weather === undefined &&
                [0, 1].map((i) => (
                  <div key={i} className="h-36 animate-pulse rounded-2xl bg-white/5" />
                ))}
              {weather === null && (
                <p className="text-sm text-sky-100/60 sm:col-span-2">
                  Weather is unavailable right now. Check back in a few minutes.
                </p>
              )}
              {weather?.towns.map((t) => <TownCard key={t.key} t={t} />)}
            </div>
            <p className="mt-3 text-[11px] text-sky-200/40">
              Forecast data: Open-Meteo. Snowfall is a model estimate; actual
              accumulation varies street to street.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

function TownCard({ t }: { t: TownWeather }) {
  const Icon = ICONS[t.icon];
  const snow = t.snowNext24Cm;
  const triggers = snow >= SNOW_TRIGGER_CM;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-white">{t.name}</p>
          <p className="text-xs text-sky-100/60">{t.label}</p>
        </div>
        <Icon className="h-8 w-8 shrink-0 text-sky-300" aria-hidden />
      </div>
      <p className="mt-2 text-4xl font-bold tabular-nums text-white">
        {t.tempC}°<span className="text-lg font-semibold text-sky-100/60">C</span>
      </p>
      <p className="mt-1 flex flex-wrap gap-x-3 text-xs text-sky-100/60">
        <span>
          H {t.todayHighC}° · L {t.todayLowC}°
        </span>
        <span>Feels {t.feelsLikeC}°</span>
        <span className="inline-flex items-center gap-1">
          <Wind className="h-3 w-3" aria-hidden />
          {t.windKmh} km/h
        </span>
      </p>
      <div
        className={cn(
          "mt-3 flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-medium",
          triggers
            ? "bg-amber-400/15 text-amber-200"
            : snow > 0
              ? "bg-sky-400/10 text-sky-100/80"
              : "bg-white/5 text-sky-100/50"
        )}
      >
        <Snowflake className="h-3.5 w-3.5 shrink-0" aria-hidden />
        {snow > 0 ? (
          <span>
            {snow < 1 ? "<1" : Math.round(snow)} cm next 24h
            {triggers ? " · routes likely to run" : ` · under ${SNOW_TRIGGER_CM} cm trigger`}
          </span>
        ) : (
          <span>No snow expected next 24h</span>
        )}
      </div>
    </div>
  );
}

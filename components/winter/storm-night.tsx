"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Camera,
  Pause,
  Play,
  RotateCcw,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { STORM_STEPS, type StormStep } from "@/lib/content/winter-campaign";

/**
 * "Storm Night", the self-playing walkthrough of what a PVS storm response
 * looks like from the customer's couch: a stylized Petawawa neighbourhood
 * map with the route being cleared stop by stop, and a phone mock receiving
 * the same alerts an Aurora portal account gets.
 *
 * Honesty rules: the whole thing is a SIMULATION and is labelled "Demo" on
 * the map and "Preview of your Aurora portal experience" under the phone.
 * There is no live GPS feed behind it.
 *
 * All animation is CSS transitions + SVG SMIL, no animation library, so the
 * chunk stays small. Load it through <StormNightLazy> so the JS only ships
 * once the visitor scrolls near it.
 */

type Equipment = "tractor" | "plow";

export type StormNightProps = {
  /** Compact = tighter spacing for homepage / fall-page embeds. */
  compact?: boolean;
  ctaHref?: string;
  ctaLabel?: string;
  /** Analytics source tag carried on the CTA link. */
  source?: string;
};

/** Route stops in map coordinates. Consecutive stops share an axis so the
 *  rig travels along streets, never through a block. Stop 4 = your house. */
const STOPS: { x: number; y: number }[] = [
  { x: 42, y: 296 }, // 0 staging yard
  { x: 128, y: 296 }, // 1
  { x: 128, y: 208 }, // 2
  { x: 252, y: 208 }, // 3
  { x: 252, y: 118 }, // 4 your house
  { x: 356, y: 118 }, // 5
  { x: 356, y: 52 }, // 6 route done
];

const YOUR_STOP = 4;
const AUTOPLAY_MS = 3400;

const HOUSES: { x: number; y: number }[] = [
  { x: 96, y: 258 },
  { x: 170, y: 258 },
  { x: 88, y: 172 },
  { x: 186, y: 172 },
  { x: 300, y: 170 },
  { x: 214, y: 82 },
  { x: 320, y: 82 },
  { x: 396, y: 150 },
  { x: 396, y: 254 },
  { x: 288, y: 258 },
];

export function StormNight({
  compact = false,
  ctaHref = "/winter-packages#packages",
  ctaLabel = "Lock in your spot",
  source = "storm-night",
}: StormNightProps) {
  const [equipment, setEquipment] = useState<Equipment>("tractor");
  const [twoPass, setTwoPass] = useState(true);
  const [walkway, setWalkway] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);

  const steps = useMemo(
    () =>
      STORM_STEPS.filter(
        (s) => (twoPass || !s.twoPassOnly) && (walkway || !s.walkwayOnly)
      ),
    [twoPass, walkway]
  );

  const [index, setIndex] = useState(0);
  const [playing, setPlaying] = useState(true);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    if (mq.matches) {
      setPlaying(false);
      setIndex(STORM_STEPS.length - 1);
    }
  }, []);

  // Keep the index valid when a toggle removes steps.
  useEffect(() => {
    setIndex((i) => Math.min(i, steps.length - 1));
  }, [steps.length]);

  useEffect(() => {
    if (!playing) return;
    timer.current = setInterval(() => {
      setIndex((i) => {
        if (i >= steps.length - 1) {
          setPlaying(false);
          return i;
        }
        return i + 1;
      });
    }, AUTOPLAY_MS);
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [playing, steps.length]);

  const step = steps[Math.min(index, steps.length - 1)];
  const atEnd = index >= steps.length - 1;

  const goTo = useCallback((i: number) => {
    setPlaying(false);
    setIndex(i);
  }, []);

  function replay() {
    setIndex(0);
    setPlaying(true);
  }

  // Notifications that have arrived so far, newest first.
  const arrived = steps
    .slice(0, index + 1)
    .filter((s): s is StormStep & { notification: NonNullable<StormStep["notification"]> } =>
      Boolean(s.notification)
    )
    .reverse();

  const drivewayCleared = steps
    .slice(0, index + 1)
    .some((s) => s.key === "first-pass" || s.key === "second-pass" || s.key === "done");

  const pos = STOPS[step.stop];

  return (
    <div
      className={`overflow-hidden rounded-3xl border border-sky-400/20 bg-gradient-to-br from-[#0B1526] via-[#0A1220] to-[#0C1B2E] ${
        compact ? "p-4 sm:p-6" : "p-5 sm:p-8"
      }`}
    >
      {/* ── Toggles ── */}
      <div className="flex flex-wrap items-center gap-2">
        <Segmented
          options={[
            { value: "tractor", label: "Tractor" },
            { value: "plow", label: "Plow truck" },
          ]}
          value={equipment}
          onChange={(v) => setEquipment(v as Equipment)}
          label="Equipment"
        />
        <Segmented
          options={[
            { value: "two", label: "Gold · 2 passes" },
            { value: "one", label: "Bronze · 1 pass" },
          ]}
          value={twoPass ? "two" : "one"}
          onChange={(v) => setTwoPass(v === "two")}
          label="Package view"
        />
        <button
          type="button"
          aria-pressed={walkway}
          onClick={() => setWalkway((w) => !w)}
          className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
            walkway
              ? "border-sky-400/60 bg-sky-500/20 text-sky-100"
              : "border-white/15 text-sky-100/60 hover:border-white/30 hover:text-sky-100"
          }`}
        >
          + Walkway add-on
        </button>
        <span className="ml-auto inline-flex items-center gap-1.5 rounded-full border border-amber-400/40 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-amber-200">
          Demo
        </span>
      </div>

      <div
        className={`mt-4 grid gap-5 ${compact ? "lg:grid-cols-[1.2fr_0.8fr]" : "lg:grid-cols-[1.35fr_1fr] lg:gap-8"}`}
      >
        {/* ── Map ── */}
        <div>
          <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0A1424]">
            <NeighbourhoodMap
              equipment={equipment}
              pos={pos}
              clearing={Boolean(step.clearing)}
              visited={new Set(steps.slice(0, index + 1).map((s) => s.stop))}
              drivewayCleared={drivewayCleared}
              reducedMotion={reducedMotion}
            />
            <div className="pointer-events-none absolute left-3 top-3 rounded-full border border-white/10 bg-[#0A1220]/80 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-sky-200/80 backdrop-blur">
              Petawawa · stylized route
            </div>
          </div>

          <p className="mt-3 min-h-[2.5rem] text-sm leading-relaxed text-sky-100/80">
            <span className="mr-2 rounded-md bg-sky-500/15 px-1.5 py-0.5 text-xs font-bold tabular-nums text-sky-200">
              {step.time}
            </span>
            {step.caption}
          </p>

          {/* ── Scrubber ── */}
          <div className="mt-3 flex items-center gap-2">
            <button
              type="button"
              onClick={() => (atEnd && !playing ? replay() : setPlaying((p) => !p))}
              aria-label={
                atEnd && !playing ? "Replay" : playing ? "Pause" : "Play"
              }
              className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-white/15 text-sky-100 transition-colors hover:border-white/30"
            >
              {atEnd && !playing ? (
                <RotateCcw className="h-4 w-4" aria-hidden />
              ) : playing ? (
                <Pause className="h-4 w-4" aria-hidden />
              ) : (
                <Play className="h-4 w-4" aria-hidden />
              )}
            </button>
            <div
              role="tablist"
              aria-label="Storm night steps"
              className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto pb-1"
            >
              {steps.map((s, i) => (
                <button
                  key={s.key}
                  type="button"
                  role="tab"
                  aria-selected={i === index}
                  aria-label={`Step ${i + 1}: ${s.title}`}
                  onClick={() => goTo(i)}
                  className={`shrink-0 whitespace-nowrap rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors ${
                    i === index
                      ? "border-sky-400/70 bg-sky-500/20 text-sky-100"
                      : i < index
                        ? "border-white/15 text-sky-100/70"
                        : "border-white/10 text-sky-100/40 hover:text-sky-100/70"
                  }`}
                >
                  {s.title}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Phone ── */}
        <div className="mx-auto w-full max-w-[300px]">
          <div className="overflow-hidden rounded-[2rem] border border-white/15 bg-[#070E1A] p-2 shadow-2xl">
            <div className="overflow-hidden rounded-[1.6rem] border border-white/10 bg-[#0A1220]">
              <div className="flex items-center justify-between border-b border-white/10 px-4 py-2.5">
                <div>
                  <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-sky-300">
                    Aurora portal
                  </p>
                  <p className="text-[11px] font-bold text-white">
                    Prestige View Services
                  </p>
                </div>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-sky-400/30 bg-sky-500/10 px-2 py-1 text-[8px] font-bold uppercase tracking-wider text-sky-200">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
                    <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-sky-300" />
                  </span>
                  {step.time}
                </span>
              </div>

              <div
                className={`space-y-2 overflow-y-auto p-3 ${compact ? "h-[230px]" : "h-[290px]"}`}
              >
                {arrived.length === 0 && (
                  <p className="px-2 py-6 text-center text-[11px] leading-relaxed text-sky-100/40">
                    Quiet for now. Alerts land here the moment the storm
                    crosses 3 cm.
                  </p>
                )}
                {arrived.map((s) => (
                  <div
                    key={s.key}
                    className="animate-fade-up rounded-xl border border-white/10 bg-white/[0.04] p-2.5"
                  >
                    <div className="flex items-start gap-2">
                      <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-lg border border-sky-400/30 bg-sky-500/10 text-sky-300">
                        {s.key === "first-pass" || s.key === "second-pass" ? (
                          <Camera className="h-3 w-3" aria-hidden />
                        ) : (
                          <BellRing className="h-3 w-3" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0">
                        <p className="flex items-baseline justify-between gap-2 text-[10px] font-bold text-white">
                          <span className="truncate">{s.notification.title}</span>
                          <span className="shrink-0 font-medium tabular-nums text-sky-200/60">
                            {s.time}
                          </span>
                        </p>
                        <p className="mt-0.5 text-[9px] leading-snug text-sky-100/70">
                          {s.notification.body}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <p className="mt-2.5 text-center text-[11px] text-sky-100/50">
            Preview of your Aurora portal experience
          </p>
        </div>
      </div>

      {/* ── CTA ── */}
      <div
        className={`mt-5 flex flex-col items-start justify-between gap-3 border-t border-white/10 pt-5 sm:flex-row sm:items-center ${
          atEnd ? "" : "opacity-90"
        }`}
      >
        <p className="text-sm font-semibold text-white sm:text-base">
          This is what a PVS winter looks like.
        </p>
        <Button asChild size={compact ? "md" : "lg"} className="shrink-0">
          <Link href={withSource(ctaHref, source)}>
            <Snowflake className="h-4 w-4" aria-hidden />
            {ctaLabel}
            <ArrowRight className="h-4 w-4" aria-hidden />
          </Link>
        </Button>
      </div>
    </div>
  );
}

function withSource(href: string, source: string): string {
  if (!source) return href;
  const [path, hash] = href.split("#");
  const sep = path.includes("?") ? "&" : "?";
  return `${path}${sep}src=${encodeURIComponent(source)}${hash ? `#${hash}` : ""}`;
}

function Segmented({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: string; label: string }[];
  value: string;
  onChange: (v: string) => void;
  label: string;
}) {
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className="flex items-center rounded-full border border-white/15 p-0.5"
    >
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={`rounded-full px-3 py-1 text-xs font-semibold transition-colors ${
            value === o.value
              ? "bg-sky-500/25 text-sky-100"
              : "text-sky-100/50 hover:text-sky-100"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Map
// ---------------------------------------------------------------------------

function NeighbourhoodMap({
  equipment,
  pos,
  clearing,
  visited,
  drivewayCleared,
  reducedMotion,
}: {
  equipment: Equipment;
  pos: { x: number; y: number };
  clearing: boolean;
  visited: Set<number>;
  drivewayCleared: boolean;
  reducedMotion: boolean;
}) {
  const you = STOPS[YOUR_STOP];
  return (
    <svg
      viewBox="0 0 440 340"
      role="img"
      aria-label="Animated demo map of a snow route being cleared through a Petawawa neighbourhood"
      className="block h-auto w-full"
    >
      {/* Ground */}
      <rect width="440" height="340" fill="#0A1424" />

      {/* Streets: each pair of consecutive stops travels along one of these. */}
      <g stroke="#16233A" strokeLinecap="round">
        <path d="M20 296 H200" strokeWidth="18" />
        <path d="M128 320 V186 " strokeWidth="18" />
        <path d="M104 208 H278" strokeWidth="18" />
        <path d="M252 232 V96" strokeWidth="18" />
        <path d="M228 118 H384" strokeWidth="18" />
        <path d="M356 142 V36" strokeWidth="18" />
        {/* decorative cross streets */}
        <path d="M20 172 H210" strokeWidth="14" opacity="0.7" />
        <path d="M300 296 H420" strokeWidth="14" opacity="0.7" />
        <path d="M396 296 V130" strokeWidth="14" opacity="0.7" />
      </g>
      {/* centre lines */}
      <g
        stroke="rgba(148,196,255,0.14)"
        strokeWidth="1.5"
        strokeDasharray="6 8"
      >
        <path d="M20 296 H200" />
        <path d="M128 320 V186" />
        <path d="M104 208 H278" />
        <path d="M252 232 V96" />
        <path d="M228 118 H384" />
        <path d="M356 142 V36" />
      </g>

      {/* Houses */}
      <g>
        {HOUSES.map((h, i) => (
          <House key={i} x={h.x} y={h.y} />
        ))}
      </g>

      {/* Your house + driveway */}
      <g>
        {/* driveway: snowed-in vs cleared */}
        <rect
          x={you.x - 7}
          y={you.y - 34}
          width={14}
          height={24}
          rx={2}
          fill={drivewayCleared ? "#16233A" : "rgba(226,240,255,0.85)"}
          stroke={drivewayCleared ? "rgba(125,211,252,0.5)" : "none"}
          strokeWidth="1"
          style={{ transition: "fill 0.8s ease" }}
        />
        <House x={you.x} y={you.y - 52} accent />
        {/* pin */}
        <g transform={`translate(${you.x}, ${you.y - 74})`}>
          <path
            d="M0 12 C -7 2 -7 -6 0 -6 C 7 -6 7 2 0 12 Z"
            fill="#FBBF24"
          />
          <circle cx="0" cy="-1" r="2.4" fill="#0A1424" />
        </g>
        <text
          x={you.x}
          y={you.y - 88}
          textAnchor="middle"
          fontSize="10"
          fontWeight="700"
          fill="#FDE68A"
        >
          Your house
        </text>
      </g>

      {/* Stop markers */}
      {STOPS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={i === YOUR_STOP ? 5 : 3.5}
          fill={visited.has(i) ? "#38BDF8" : "rgba(148,196,255,0.25)"}
          style={{ transition: "fill 0.5s ease" }}
        />
      ))}

      {/* Falling snow (SMIL so it needs no CSS plumbing). Hidden for
          reduced-motion users. */}
      {!reducedMotion && (
        <g fill="rgba(226,240,255,0.5)">
          {Array.from({ length: 14 }, (_, i) => {
            const x = 18 + ((i * 73) % 410);
            const dur = 6 + (i % 5) * 1.7;
            const delay = (i * 0.9) % 6;
            return (
              <circle key={i} cx={x} cy="-6" r={i % 3 === 0 ? 2 : 1.3}>
                <animate
                  attributeName="cy"
                  from="-6"
                  to="346"
                  dur={`${dur}s`}
                  begin={`${delay}s`}
                  repeatCount="indefinite"
                />
              </circle>
            );
          })}
        </g>
      )}

      {/* The rig */}
      <g
        style={{
          transform: `translate(${pos.x}px, ${pos.y}px)`,
          transition: reducedMotion
            ? undefined
            : "transform 1.8s cubic-bezier(0.45, 0, 0.25, 1)",
        }}
      >
        {/* headlight glow */}
        <circle r="16" fill="rgba(125,211,252,0.10)" />
        {equipment === "tractor" ? <TractorGlyph /> : <PlowGlyph />}
        {clearing && !reducedMotion && (
          <g fill="rgba(226,240,255,0.85)">
            {[0, 1, 2].map((i) => (
              <circle key={i} cx="8" cy="-8" r="2.5">
                <animate
                  attributeName="cy"
                  values="-6;-22"
                  dur="1.1s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="cx"
                  values="8;16"
                  dur="1.1s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="opacity"
                  values="0.9;0"
                  dur="1.1s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
                <animate
                  attributeName="r"
                  values="2;4.5"
                  dur="1.1s"
                  begin={`${i * 0.35}s`}
                  repeatCount="indefinite"
                />
              </circle>
            ))}
          </g>
        )}
      </g>
    </svg>
  );
}

function House({
  x,
  y,
  accent = false,
}: {
  x: number;
  y: number;
  accent?: boolean;
}) {
  return (
    <g transform={`translate(${x}, ${y})`}>
      <rect
        x="-9"
        y="-6"
        width="18"
        height="12"
        rx="1.5"
        fill={accent ? "#1D3A5F" : "#152238"}
        stroke={accent ? "rgba(125,211,252,0.6)" : "rgba(148,196,255,0.15)"}
        strokeWidth="1"
      />
      <path
        d="M-11 -6 L0 -14 L11 -6 Z"
        fill={accent ? "#2B5384" : "#1B2C47"}
      />
      {/* warm window */}
      <rect x="-4" y="-3" width="3.5" height="3.5" fill="rgba(251,191,36,0.7)" />
    </g>
  );
}

/** Compact tractor with an inverted blower, drawn around the origin. */
function TractorGlyph() {
  return (
    <g>
      <rect x="-11" y="-6" width="15" height="10" rx="2" fill="#38BDF8" />
      <rect x="-2" y="-11" width="8" height="8" rx="1.5" fill="#7DD3FC" />
      {/* blower */}
      <rect x="4" y="-5" width="7" height="9" rx="1" fill="#0EA5E9" />
      <circle cx="-6" cy="5" r="4" fill="#0B1526" stroke="#7DD3FC" strokeWidth="1.5" />
      <circle cx="4" cy="5" r="2.8" fill="#0B1526" stroke="#7DD3FC" strokeWidth="1.5" />
    </g>
  );
}

/** Plow truck variant with a front blade. */
function PlowGlyph() {
  return (
    <g>
      <rect x="-12" y="-6" width="17" height="9" rx="2" fill="#38BDF8" />
      <rect x="-12" y="-11" width="8" height="6" rx="1.5" fill="#7DD3FC" />
      {/* blade */}
      <path d="M6 -8 L11 -5 L11 4 L6 6 Z" fill="#FBBF24" />
      <circle cx="-7" cy="4.5" r="3" fill="#0B1526" stroke="#7DD3FC" strokeWidth="1.5" />
      <circle cx="1" cy="4.5" r="3" fill="#0B1526" stroke="#7DD3FC" strokeWidth="1.5" />
    </g>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import type { WeatherReport } from "@/lib/weather";
import type { SnowPhase } from "@/lib/snow-status-phases";

export type PublicStatus = {
  phase: SnowPhase;
  headline: string;
  detail: string;
  step: number;
  tone: "idle" | "amber" | "sky" | "violet" | "emerald";
  updatedAt: string | null;
};

const STATUS_REFRESH_MS = 2 * 60_000;
const WEATHER_REFRESH_MS = 10 * 60_000;

/**
 * Poll `load` every `everyMs` while the page is open, and refresh right
 * away when a visitor comes back to a tab that has gone stale (browsers
 * throttle timers in background tabs, so the interval alone can lag).
 */
function usePolling(load: () => void, everyMs: number) {
  const loadRef = useRef(load);
  loadRef.current = load;
  useEffect(() => {
    let last = 0;
    const run = () => {
      last = Date.now();
      loadRef.current();
    };
    const onReturn = () => {
      if (document.visibilityState === "visible" && Date.now() - last > everyMs / 2) run();
    };
    run();
    const id = setInterval(() => {
      if (document.visibilityState === "visible") run();
    }, everyMs);
    document.addEventListener("visibilitychange", onReturn);
    window.addEventListener("focus", onReturn);
    window.addEventListener("online", run);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onReturn);
      window.removeEventListener("focus", onReturn);
      window.removeEventListener("online", run);
    };
  }, [everyMs]);
}

/** Live snow event status. Refreshes every 2 minutes and on tab return. */
export function useSnowStatus(): PublicStatus | null {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  usePolling(() => {
    fetch("/api/site/snow-status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => j?.status && setStatus(j.status))
      .catch(() => {}); // keep showing the last known status
  }, STATUS_REFRESH_MS);
  return status;
}

/**
 * Current local weather. Refreshes every 10 minutes and on tab return.
 * undefined = first load in progress, null = unavailable and nothing to
 * show. A failed refresh keeps the last good report on screen.
 */
export function useWeather(): WeatherReport | null | undefined {
  const [weather, setWeather] = useState<WeatherReport | null | undefined>(undefined);
  usePolling(() => {
    fetch("/api/site/weather", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : { weather: null }))
      .then((j: { weather: WeatherReport | null }) =>
        setWeather((prev) => j.weather ?? (prev ? prev : null))
      )
      .catch(() => setWeather((prev) => (prev ? prev : null)));
  }, WEATHER_REFRESH_MS);
  return weather;
}

/** Re-render every `everyMs` so "x min ago" labels stay accurate. */
export function useNow(everyMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [everyMs]);
  return now;
}

export function timeAgo(iso: string | null, now = Date.now()): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((now - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h === 1 ? "1 hour ago" : `${h} hours ago`;
}

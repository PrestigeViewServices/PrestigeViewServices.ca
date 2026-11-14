"use client";

import { useEffect, useState } from "react";
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

/** Live snow event status. Polls every 2 minutes while the tab is open. */
export function useSnowStatus(): PublicStatus | null {
  const [status, setStatus] = useState<PublicStatus | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/site/snow-status")
        .then((r) => (r.ok ? r.json() : null))
        .then((j) => alive && j?.status && setStatus(j.status))
        .catch(() => {});
    load();
    const id = setInterval(load, STATUS_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return status;
}

/** Current local weather. undefined = loading, null = unavailable. */
export function useWeather(): WeatherReport | null | undefined {
  const [weather, setWeather] = useState<WeatherReport | null | undefined>(undefined);
  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/site/weather")
        .then((r) => (r.ok ? r.json() : { weather: null }))
        .then((j) => alive && setWeather(j.weather ?? null))
        .catch(() => alive && setWeather(null));
    load();
    const id = setInterval(load, WEATHER_REFRESH_MS);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);
  return weather;
}

export function timeAgo(iso: string | null): string {
  if (!iso) return "";
  const mins = Math.max(0, Math.round((Date.now() - Date.parse(iso)) / 60_000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const h = Math.round(mins / 60);
  return h === 1 ? "1 hour ago" : `${h} hours ago`;
}

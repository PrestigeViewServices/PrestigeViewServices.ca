/**
 * Local weather for the service area, from Open-Meteo (free, no API key,
 * Environment Canada GEM model among its sources).
 *
 * Fetched SERVER-SIDE only (app/api/site/weather) and cached for 15 minutes,
 * so visitors never hit Open-Meteo directly, the CSP stays untouched, and
 * traffic spikes during a storm cost us nothing.
 */

export type TownKey = "petawawa" | "pembroke";

export const TOWNS: { key: TownKey; name: string; lat: number; lon: number }[] = [
  { key: "petawawa", name: "Petawawa", lat: 45.8968, lon: -77.2829 },
  { key: "pembroke", name: "Pembroke", lat: 45.8263, lon: -77.1108 },
];

/** Snowfall (cm) at which seasonal contract routes run automatically. */
export const SNOW_TRIGGER_CM = 5;

export type TownWeather = {
  key: TownKey;
  name: string;
  tempC: number;
  feelsLikeC: number;
  windKmh: number;
  code: number;
  label: string;
  icon: WeatherIcon;
  isDay: boolean;
  /** Forecast snowfall over the next 24 hours, cm. */
  snowNext24Cm: number;
  todayHighC: number;
  todayLowC: number;
};

export type WeatherReport = {
  towns: TownWeather[];
  fetchedAt: string;
};

export type WeatherIcon =
  | "sun"
  | "moon"
  | "partly"
  | "cloud"
  | "fog"
  | "drizzle"
  | "rain"
  | "freezing"
  | "snow"
  | "heavy-snow"
  | "storm";

/** WMO weather interpretation codes → plain label + icon. */
export function describeCode(
  code: number,
  isDay: boolean
): { label: string; icon: WeatherIcon } {
  if (code === 0) return { label: "Clear", icon: isDay ? "sun" : "moon" };
  if (code === 1) return { label: "Mainly clear", icon: isDay ? "sun" : "moon" };
  if (code === 2) return { label: "Partly cloudy", icon: "partly" };
  if (code === 3) return { label: "Overcast", icon: "cloud" };
  if (code === 45 || code === 48) return { label: "Fog", icon: "fog" };
  if (code >= 51 && code <= 55) return { label: "Drizzle", icon: "drizzle" };
  if (code === 56 || code === 57) return { label: "Freezing drizzle", icon: "freezing" };
  if (code === 61 || code === 63) return { label: "Rain", icon: "rain" };
  if (code === 65) return { label: "Heavy rain", icon: "rain" };
  if (code === 66 || code === 67) return { label: "Freezing rain", icon: "freezing" };
  if (code === 71) return { label: "Light snow", icon: "snow" };
  if (code === 73) return { label: "Snow", icon: "snow" };
  if (code === 75) return { label: "Heavy snow", icon: "heavy-snow" };
  if (code === 77) return { label: "Snow grains", icon: "snow" };
  if (code === 80 || code === 81) return { label: "Rain showers", icon: "rain" };
  if (code === 82) return { label: "Heavy showers", icon: "rain" };
  if (code === 85) return { label: "Snow showers", icon: "snow" };
  if (code === 86) return { label: "Heavy snow showers", icon: "heavy-snow" };
  if (code >= 95) return { label: "Thunderstorm", icon: "storm" };
  return { label: "—", icon: "cloud" };
}

type OpenMeteoResponse = {
  current: {
    temperature_2m: number;
    apparent_temperature: number;
    wind_speed_10m: number;
    weather_code: number;
    is_day: number;
  };
  hourly: { time: string[]; snowfall: number[] };
  daily: { temperature_2m_max: number[]; temperature_2m_min: number[] };
};

const round1 = (n: number) => Math.round(n * 10) / 10;

async function fetchTown(t: (typeof TOWNS)[number]): Promise<TownWeather> {
  const params = new URLSearchParams({
    latitude: String(t.lat),
    longitude: String(t.lon),
    current:
      "temperature_2m,apparent_temperature,wind_speed_10m,weather_code,is_day",
    hourly: "snowfall",
    daily: "temperature_2m_max,temperature_2m_min",
    forecast_days: "2",
    timezone: "America/Toronto",
    wind_speed_unit: "kmh",
  });
  const res = await fetch(`https://api.open-meteo.com/v1/forecast?${params}`, {
    next: { revalidate: 900 },
    signal: AbortSignal.timeout(6000),
  });
  if (!res.ok) throw new Error(`Open-Meteo ${res.status}`);
  const j = (await res.json()) as OpenMeteoResponse;

  // Sum snowfall from the current hour forward, 24 hours.
  const nowHour = new Date(
    new Date().toLocaleString("en-US", { timeZone: "America/Toronto" })
  );
  nowHour.setMinutes(0, 0, 0);
  let start = j.hourly.time.findIndex((iso) => new Date(iso) >= nowHour);
  if (start < 0) start = 0;
  const snow = j.hourly.snowfall
    .slice(start, start + 24)
    .reduce((sum, v) => sum + (Number.isFinite(v) ? v : 0), 0);

  const isDay = j.current.is_day === 1;
  const { label, icon } = describeCode(j.current.weather_code, isDay);
  return {
    key: t.key,
    name: t.name,
    tempC: Math.round(j.current.temperature_2m),
    feelsLikeC: Math.round(j.current.apparent_temperature),
    windKmh: Math.round(j.current.wind_speed_10m),
    code: j.current.weather_code,
    label,
    icon,
    isDay,
    snowNext24Cm: round1(snow),
    todayHighC: Math.round(j.daily.temperature_2m_max[0]),
    todayLowC: Math.round(j.daily.temperature_2m_min[0]),
  };
}

/** Current conditions + 24h snowfall for each town. Null if the source is down. */
export async function getWeather(): Promise<WeatherReport | null> {
  try {
    const towns = await Promise.all(TOWNS.map(fetchTown));
    return { towns, fetchedAt: new Date().toISOString() };
  } catch {
    return null;
  }
}

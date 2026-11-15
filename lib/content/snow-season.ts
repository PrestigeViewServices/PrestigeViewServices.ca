/**
 * The current SnowLand season: one place to change the launch date and the
 * season name. The home page, the season banner, the sticky CTA, the
 * /winter-packages hero and the countdowns all read from here.
 *
 * Next winter: bump `number`, `launchIso`, and `launchDisplay`.
 */
export const SNOW_SEASON = {
  /** Season 1 was winter 2025-26. */
  number: 2,
  name: "SnowLand Season 2",
  /** Midnight Ottawa time (EST, UTC-5) on launch day. */
  launchIso: "2026-11-15T00:00:00-05:00",
  /** Short form for badges and banners. */
  launchDisplay: "Nov 15",
  /** Long form for body copy. */
  launchDisplayLong: "November 15",
} as const;

export function snowSeasonLaunchMs(): number {
  return new Date(SNOW_SEASON.launchIso).getTime();
}

/** True once launch day has arrived. */
export function isSnowSeasonLive(now: number = Date.now()): boolean {
  return now >= snowSeasonLaunchMs();
}

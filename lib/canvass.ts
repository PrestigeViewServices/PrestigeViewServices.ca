/**
 * Canvassing shared constants — client-safe (no Prisma imports).
 *
 * Single source of truth for towns, knock outcomes, and the status → color
 * mapping used by BOTH the rep map (/rep) and the admin Canvassing dashboard.
 * The map encodes status as an index into CANVASS_STATUSES to keep the
 * ~20k-address payload small — never reorder this array without a data
 * migration of clients (it's fine to append).
 */

export const CANVASS_TOWNS = [
  "Petawawa",
  "Pembroke",
  "Deep River",
  "Chalk River",
] as const;

export type CanvassTown = (typeof CANVASS_TOWNS)[number];

/** Map camera start per town. */
export const TOWN_CENTERS: Record<
  CanvassTown,
  { lat: number; lng: number; zoom: number }
> = {
  Petawawa: { lat: 45.8945, lng: -77.2828, zoom: 13 },
  Pembroke: { lat: 45.8266, lng: -77.1106, zoom: 13 },
  "Deep River": { lat: 46.1005, lng: -77.4891, zoom: 13.5 },
  "Chalk River": { lat: 46.0186, lng: -77.4453, zoom: 13.5 },
};

/** Index order is the wire format for the address payload — append only. */
export const CANVASS_STATUSES = [
  "NOT_VISITED",
  "NOT_HOME",
  "NOT_INTERESTED",
  "FOLLOW_UP",
  "QUOTE_GIVEN",
  "SOLD",
  "DO_NOT_KNOCK",
] as const;

export type CanvassStatusValue = (typeof CANVASS_STATUSES)[number];

export const STATUS_META: Record<
  CanvassStatusValue,
  { label: string; color: string }
> = {
  NOT_VISITED: { label: "Not visited", color: "#8a93a6" },
  NOT_HOME: { label: "Not home", color: "#f59e0b" },
  NOT_INTERESTED: { label: "Not interested", color: "#ef4444" },
  FOLLOW_UP: { label: "Follow up", color: "#a855f7" },
  QUOTE_GIVEN: { label: "Quote given", color: "#38bdf8" },
  SOLD: { label: "Sold", color: "#22c55e" },
  DO_NOT_KNOCK: { label: "Do not knock", color: "#334155" },
};

/** Outcome buttons on the knock sheet, in tap-priority order. */
export const KNOCK_OUTCOMES = [
  { value: "NOT_HOME", label: "Not home", emoji: "🚪" },
  { value: "NOT_INTERESTED", label: "Not interested", emoji: "🙅" },
  { value: "FOLLOW_UP", label: "Follow up", emoji: "🔁" },
  { value: "QUOTE_GIVEN", label: "Quote given", emoji: "💬" },
  { value: "SOLD", label: "SOLD", emoji: "✅" },
  { value: "DO_NOT_KNOCK", label: "Do not knock", emoji: "⛔" },
] as const;

export type KnockOutcomeValue = (typeof KNOCK_OUTCOMES)[number]["value"];

/**
 * Compact wire format for the address layer:
 * [id, lng, lat, statusIndex, label]
 */
export type AddressTuple = [string, number, number, number, string];

/** How often the rep app reports GPS while open (ms). */
export const PING_INTERVAL_MS = 25_000;

/** How stale a ping can be and still count as "live" on the admin map (ms). */
export const LIVE_WINDOW_MS = 3 * 60_000;

export function statusIndex(status: string): number {
  const i = (CANVASS_STATUSES as readonly string[]).indexOf(status);
  return i === -1 ? 0 : i;
}

export function fullAddressLabel(a: {
  civicNumber: string;
  street: string;
  unit?: string | null;
}): string {
  const unit = a.unit ? `Unit ${a.unit}, ` : "";
  return `${unit}${a.civicNumber} ${a.street}`;
}

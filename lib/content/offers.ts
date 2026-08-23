import type { DivisionSlug } from "./divisions";

export type Offer = {
  id: string;
  /** Set to false to hide everywhere without deleting */
  active: boolean;
  eyebrow?: string;
  headline: string;
  body: string;
  ctaLabel: string;
  /** Pre-fills /quote?offer=<id>&service=<serviceSlug> */
  ctaHref: string;
  accent: "lawn" | "clearview" | "snowland";
  /** Which division this offer belongs to, used for filtering on division pages */
  division: DivisionSlug;
  /** Show in the global session-gated modal? Only one should be true at a time. */
  showInModal?: boolean;
};

export const offers: Offer[] = [
  // No percentage discounts are advertised anywhere on the site. The 15%
  // early-bird and 15% exterior bundle were both retired 2026-08-23 at the
  // owner's request. These offers sell timing and bundling instead.
  {
    id: "fall-cleanup",
    active: true,
    eyebrow: "Booking Now",
    headline: "Fall Cleanups Are Open Across the Ottawa Valley",
    body: "Every leaf and branch cleared, the lawn cut to winter height, and the beds tidied so your property goes into the snow looking sharp and comes out of it healthy. Book before the rush and pick your week.",
    ctaLabel: "Book My Fall Cleanup",
    ctaHref: "/quote?offer=fall-cleanup&service=fall-cleanup",
    accent: "lawn",
    division: "lawnpros",
    showInModal: true,
  },
  {
    id: "gutter-fall",
    active: true,
    eyebrow: "Before the Freeze",
    headline: "Gutter Cleaning Before the First Freeze",
    body: "Packed gutters freeze solid, back up under the shingles, and turn into ice dams by January. We clear the debris, flush the downspouts, and flag anything starting to fail while it is still a cheap fix.",
    ctaLabel: "Clear My Gutters",
    ctaHref: "/quote?offer=gutter-fall&service=gutter-cleaning",
    accent: "clearview",
    division: "clearview",
  },
  {
    id: "winter-reserve",
    active: true,
    eyebrow: "Winter Routes Filling",
    headline: "Reserve Your Driveway for the Whole Winter",
    body: "Seasonal snow contracts mean you never call, never negotiate, and never shovel. Routes are capped so response times hold through a storm, and each one closes once it is full.",
    ctaLabel: "Reserve My Spot",
    ctaHref: "/quote?offer=winter-reserve&service=snow-removal",
    accent: "snowland",
    division: "snowland",
  },
];

export const activeOffers = offers.filter((o) => o.active);

export function getOffer(id: string): Offer | undefined {
  return offers.find((o) => o.id === id);
}

export function modalOffer(): Offer | null {
  return offers.find((o) => o.active && o.showInModal) ?? null;
}

export function offersForDivision(division: DivisionSlug): Offer[] {
  return activeOffers.filter((o) => o.division === division);
}

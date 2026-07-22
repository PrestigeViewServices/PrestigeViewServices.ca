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
  {
    id: "exterior15",
    active: false,
    eyebrow: "Bundle & Save",
    headline: "15% Off Window Cleaning, Pressure Washing & Gutter Cleaning",
    body: "Bundle two or more exterior cleaning services and save on every visit.",
    ctaLabel: "Claim This Offer",
    ctaHref: "/quote?offer=exterior15&service=window-cleaning",
    accent: "clearview",
    division: "clearview",
  },
  {
    id: "snow-early",
    active: true,
    eyebrow: "Winter Early Bird: 15% Off",
    headline: "15% Off Seasonal Snow Contracts Signed Before August 14",
    body: "Beat the fall rush: lock in your driveway and walkways for the whole winter at 15% off the seasonal rate. Offer ends August 14. Mention code EARLYBIRD15.",
    ctaLabel: "Lock In My Spot",
    ctaHref: "/quote?offer=snow-early&service=seasonal-snow-contract",
    accent: "snowland",
    division: "snowland",
    showInModal: true,
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

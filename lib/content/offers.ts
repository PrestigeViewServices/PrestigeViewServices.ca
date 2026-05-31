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
  /** Which division this offer belongs to — used for filtering on division pages */
  division: DivisionSlug;
  /** Show in the global session-gated modal? Only one should be true at a time. */
  showInModal?: boolean;
};

export const offers: Offer[] = [
  {
    id: "lawn50",
    active: true,
    eyebrow: "Limited Time Offer",
    headline: "50% Off Your First Month of Lawn Mowing",
    body: "Seasonal contracts filling fast — lock in your rate today.",
    ctaLabel: "Claim This Offer",
    ctaHref: "/quote?offer=lawn50&service=lawn-mowing",
    accent: "lawn",
    division: "lawnpros",
    showInModal: true,
  },
  {
    id: "exterior15",
    active: true,
    eyebrow: "Bundle & Save",
    headline: "15% Off Window Cleaning, Pressure Washing & Gutter Cleaning",
    body: "Bundle two or more ClearView services and save on every visit.",
    ctaLabel: "Claim This Offer",
    ctaHref: "/quote?offer=exterior15&service=window-cleaning",
    accent: "clearview",
    division: "clearview",
  },
  {
    id: "spring-lawn",
    active: true,
    eyebrow: "Spring Season",
    headline: "Spring Season Is Here",
    body: "Book your lawn care package before spots fill up.",
    ctaLabel: "Book Lawn Care",
    ctaHref: "/quote?offer=spring-lawn&service=spring-cleanup",
    accent: "clearview",
    division: "lawnpros",
  },
  {
    id: "snow-early",
    active: true,
    eyebrow: "Early Bird",
    headline: "Lock In Your Snow Contract Before October",
    body: "Sign your seasonal SnowLand contract early and save on the flat rate.",
    ctaLabel: "Reserve Snow Service",
    ctaHref: "/quote?offer=snow-early&service=seasonal-snow-contract",
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

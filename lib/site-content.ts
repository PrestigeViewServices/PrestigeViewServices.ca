import type { PrismaClient } from "@prisma/client";
import { getDb } from "./db";
import { offers as codeOffers, type Offer } from "./content/offers";

/**
 * Owner-editable website content — hero copy, the season banner, and the
 * seasonal offers — stored one JSON blob per key in SiteContent and edited
 * at /admin/site/content.
 *
 * The shapes and the CODE DEFAULTS live here. A missing key (fresh database,
 * DB unreachable, value never saved) falls back to the defaults, so the
 * public site can never render blank because of an editing mishap. Saving a
 * section overrides it; "Reset section" deletes the key and the code copy
 * comes back.
 */

// ---- Shapes ----------------------------------------------------------------

export type SeasonBannerContent = {
  enabled: boolean;
  /** Main line. Words wrapped in *asterisks* render in the accent colour. */
  line1: string;
  /** Small uppercase secondary line. Empty hides it. */
  line2: string;
  ctaLabel: string;
  ctaHref: string;
};

export type HeroContent = {
  /** First part of the headline, plain white. */
  headlineTop: string;
  /** Second part, rendered in the brand gradient. */
  headlineAccent: string;
  /** Supporting paragraph under the headline. */
  subtext: string;
};

export type OfferContent = {
  id: string;
  active: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  ctaLabel: string;
  ctaHref: string;
  accent: "lawn" | "clearview" | "snowland";
  showInModal: boolean;
};

export type SiteContentData = {
  seasonBanner: SeasonBannerContent;
  hero: HeroContent;
  offers: OfferContent[];
};

// ---- Code defaults ---------------------------------------------------------

export const DEFAULT_SEASON_BANNER: SeasonBannerContent = {
  enabled: true,
  line1: "Now booking *fall cleanups* & *gutter cleaning*",
  line2: "Winter snow routes fill right behind them",
  ctaLabel: "Book My Cleanup",
  ctaHref: "/quote?service=fall-cleanup",
};

export const DEFAULT_HERO: HeroContent = {
  headlineTop: "Winter Is Coming to the Ottawa Valley.",
  headlineAccent: "Your Property Will Be Ready.",
  subtext:
    "One local, insured crew to close out the season and carry you through it: fall cleanups, gutter cleaning before the freeze, and seasonal snow removal that keeps your driveway clear all winter. Free quotes in one business day.",
};

export function defaultOffers(): OfferContent[] {
  return codeOffers.map((o) => ({
    id: o.id,
    active: o.active,
    eyebrow: o.eyebrow ?? "",
    headline: o.headline,
    body: o.body,
    ctaLabel: o.ctaLabel,
    ctaHref: o.ctaHref,
    accent: o.accent,
    showInModal: Boolean(o.showInModal),
  }));
}

// ---- Read ------------------------------------------------------------------

const KEYS = ["seasonBanner", "hero", "offers"] as const;
export type SiteContentKey = (typeof KEYS)[number];

function sanitizeSeasonBanner(v: unknown): SeasonBannerContent | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.line1 !== "string") return null;
  return {
    enabled: o.enabled !== false,
    line1: String(o.line1).slice(0, 160),
    line2: String(o.line2 ?? "").slice(0, 160),
    ctaLabel: String(o.ctaLabel ?? "").slice(0, 40) || DEFAULT_SEASON_BANNER.ctaLabel,
    ctaHref: sanitizeHref(o.ctaHref) ?? DEFAULT_SEASON_BANNER.ctaHref,
  };
}

function sanitizeHero(v: unknown): HeroContent | null {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  if (typeof o.headlineTop !== "string") return null;
  return {
    headlineTop: String(o.headlineTop).slice(0, 120),
    headlineAccent: String(o.headlineAccent ?? "").slice(0, 120),
    subtext: String(o.subtext ?? "").slice(0, 600),
  };
}

function sanitizeOffers(v: unknown): OfferContent[] | null {
  if (!Array.isArray(v)) return null;
  const accents = ["lawn", "clearview", "snowland"] as const;
  const out: OfferContent[] = [];
  for (const raw of v.slice(0, 6)) {
    if (!raw || typeof raw !== "object") continue;
    const o = raw as Record<string, unknown>;
    if (typeof o.headline !== "string" || !o.headline) continue;
    out.push({
      id: String(o.id ?? "").slice(0, 60) || `offer-${out.length + 1}`,
      active: o.active !== false,
      eyebrow: String(o.eyebrow ?? "").slice(0, 60),
      headline: String(o.headline).slice(0, 140),
      body: String(o.body ?? "").slice(0, 600),
      ctaLabel: String(o.ctaLabel ?? "").slice(0, 50) || "Get a Quote",
      ctaHref: sanitizeHref(o.ctaHref) ?? "/quote",
      accent: accents.includes(o.accent as (typeof accents)[number])
        ? (o.accent as OfferContent["accent"])
        : "clearview",
      showInModal: o.showInModal === true,
    });
  }
  return out.length ? out : null;
}

/** Only same-site paths — an offer CTA must never leave the site. */
function sanitizeHref(v: unknown): string | null {
  const s = String(v ?? "").trim();
  if (!s.startsWith("/") || s.startsWith("//")) return null;
  return s.slice(0, 200);
}

/** All owner-editable content, merged over the code defaults. Never throws. */
export async function getSiteContent(
  db: PrismaClient | null = getDb()
): Promise<SiteContentData> {
  const data: SiteContentData = {
    seasonBanner: DEFAULT_SEASON_BANNER,
    hero: DEFAULT_HERO,
    offers: defaultOffers(),
  };
  if (!db) return data;
  try {
    const rows = await db.siteContent.findMany({
      where: { key: { in: [...KEYS] } },
    });
    for (const row of rows) {
      if (row.key === "seasonBanner") {
        const v = sanitizeSeasonBanner(row.value);
        if (v) data.seasonBanner = v;
      } else if (row.key === "hero") {
        const v = sanitizeHero(row.value);
        if (v) data.hero = v;
      } else if (row.key === "offers") {
        const v = sanitizeOffers(row.value);
        if (v) data.offers = v;
      }
    }
  } catch {
    // DB down → code defaults. The site always renders.
  }
  return data;
}

/** Active offers in display order (modal-featured first). */
export function activeOffersFrom(data: SiteContentData): OfferContent[] {
  return [...data.offers]
    .filter((o) => o.active)
    .sort((a, b) => Number(b.showInModal) - Number(a.showInModal));
}

/** The one offer allowed in the session promo modal, if any. */
export function modalOfferFrom(data: SiteContentData): OfferContent | null {
  return data.offers.find((o) => o.active && o.showInModal) ?? null;
}

/** OfferContent → the legacy Offer shape OfferCard renders. */
export function toOffer(o: OfferContent): Offer {
  return {
    id: o.id,
    active: o.active,
    eyebrow: o.eyebrow || undefined,
    headline: o.headline,
    body: o.body,
    ctaLabel: o.ctaLabel,
    ctaHref: o.ctaHref,
    accent: o.accent,
    division:
      o.accent === "lawn"
        ? "lawnpros"
        : o.accent === "snowland"
          ? "snowland"
          : "clearview",
    showInModal: o.showInModal,
  };
}

// ---- Write (admin only — callers gate on requireRole) ----------------------

export async function saveSiteContentKey(
  db: PrismaClient,
  key: SiteContentKey,
  value: SeasonBannerContent | HeroContent | OfferContent[]
): Promise<void> {
  await db.siteContent.upsert({
    where: { key },
    create: { key, value: value as object },
    update: { value: value as object },
  });
}

export async function resetSiteContentKey(
  db: PrismaClient,
  key: SiteContentKey
): Promise<void> {
  await db.siteContent.deleteMany({ where: { key } });
}

/** Which sections carry a stored override (for "Customized" chips). */
export async function customizedKeys(
  db: PrismaClient | null
): Promise<SiteContentKey[]> {
  if (!db) return [];
  try {
    const rows = await db.siteContent.findMany({
      where: { key: { in: [...KEYS] } },
      select: { key: true },
    });
    return rows.map((r) => r.key as SiteContentKey);
  } catch {
    return [];
  }
}

/**
 * Render *accent* markers in banner copy: words wrapped in asterisks get the
 * accent colour. Returns alternating [plain, accent, plain, ...] segments.
 */
export function splitAccents(text: string): { text: string; accent: boolean }[] {
  return text
    .split("*")
    .map((seg, i) => ({ text: seg, accent: i % 2 === 1 }))
    .filter((seg) => seg.text.length > 0);
}

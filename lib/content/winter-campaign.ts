/**
 * Winter 2026-27 campaign, single source of truth.
 *
 * Everything the winter push renders from is defined here: the public promo
 * (12.5%, ends Sept 10), the discount ladder, the Storm Night walkthrough
 * script, the equipment grid manifest, and the "Your POV" cards.
 *
 * The promo block can be overridden without a deploy from
 * /admin/site/content (stored under the SiteContent "winterPromo" key, see
 * lib/site-content.ts). Everything else is code content, edit here.
 */

// =============================================================================
// PUBLIC PROMO (config-driven, admin-overridable)
// =============================================================================

export type WinterPromoContent = {
  /** Master switch. Off = no badge, no banner, no countdown anywhere. */
  enabled: boolean;
  /** Public promo percentage, e.g. 12.5. */
  percent: number;
  /** ISO timestamp the promo ends. The countdown and the badge hide after. */
  endsAt: string;
  /** Short label on badges, e.g. "Winter contract promo". */
  label: string;
  /** Line used by the site-wide announcement bar. */
  bannerLine: string;
  ctaLabel: string;
  ctaHref: string;
  /**
   * Optional fall + snow bundle incentive line. Empty = the bundle band on
   * the fall cleanup page stays hidden. PLACEHOLDER, set real wording when a
   * bundle deal is confirmed.
   */
  bundleIncentive: string;
};

/** Code default. September 10 end date per the 2026-27 campaign brief. */
export const DEFAULT_WINTER_PROMO: WinterPromoContent = {
  enabled: true,
  percent: 12.5,
  endsAt: "2026-09-10T23:59:59-04:00",
  label: "Winter contract promo",
  bannerLine: "12.5% off Winter 2026-27 snow contracts",
  ctaLabel: "Get my winter quote",
  ctaHref: "/winter-packages",
  bundleIncentive: "",
};

/** True while the promo is switched on and the clock has not run out. */
export function promoIsLive(
  promo: WinterPromoContent,
  now: Date = new Date()
): boolean {
  if (!promo.enabled) return false;
  const ends = new Date(promo.endsAt);
  return !Number.isNaN(ends.getTime()) && ends.getTime() > now.getTime();
}

/** "September 10" style end-date label for badges. */
export function promoEndsLabel(promo: WinterPromoContent): string {
  const ends = new Date(promo.endsAt);
  if (Number.isNaN(ends.getTime())) return "";
  return ends.toLocaleDateString("en-CA", { month: "long", day: "numeric" });
}

/** "12.5%" without trailing ".0" for whole numbers. */
export function promoPercentLabel(promo: WinterPromoContent): string {
  return `${promo.percent % 1 === 0 ? promo.percent.toFixed(0) : promo.percent}%`;
}

// =============================================================================
// DISCOUNT LADDER
// =============================================================================
// Shown wherever winter pricing is discussed. The rule is stated everywhere
// the ladder renders: the best single discount applies, discounts never stack.

export type WinterDiscount = {
  key: "EARLYBIRD" | "PUBLIC" | "VETERAN";
  label: string;
  percentLabel: string;
  detail: string;
  /** True = tied to the public promo window and hidden when the promo is off. */
  promoGated?: boolean;
};

export const WINTER_DISCOUNTS: WinterDiscount[] = [
  {
    key: "EARLYBIRD",
    label: "Returning customer early bird",
    percentLabel: "15%",
    detail: "For last winter's customers who re-book before the season starts.",
  },
  {
    key: "PUBLIC",
    label: "Public promo",
    percentLabel: "12.5%",
    detail: "Open to everyone while the promo window is running.",
    promoGated: true,
  },
  {
    key: "VETERAN",
    label: "Military and veterans",
    percentLabel: "10%",
    detail: "Serving members, veterans, and military families. Always on.",
  },
];

export const DISCOUNT_RULE =
  "The best single discount applies to your quote. Discounts never stack.";

// =============================================================================
// STORM NIGHT WALKTHROUGH
// =============================================================================
// The script the interactive Storm Night component plays through. Times are
// illustrative and the component labels the whole thing as a demo, so keep
// the wording believable rather than promissory.

export type StormStep = {
  key: string;
  /** Clock label shown in the phone status bar, e.g. "11:42 PM". */
  time: string;
  /** Step title in the scrubber. */
  title: string;
  /** One-line caption under the map. */
  caption: string;
  /** Push notification that lands on the phone at this step, if any. */
  notification?: { title: string; body: string };
  /** Index of the route stop the rig sits at during this step. */
  stop: number;
  /** True while the rig is actively clearing the customer's driveway. */
  clearing?: boolean;
  /** Steps flagged twoPassOnly are skipped in the Bronze single-pass view. */
  twoPassOnly?: boolean;
  /** Steps flagged walkwayOnly are skipped unless the walkway add-on is on. */
  walkwayOnly?: boolean;
};

/**
 * Stop 4 is the customer's house. Steps walk the rig from the staging yard
 * (stop 0) along the route, clear the driveway, and come back at dawn for
 * the second pass on two-pass packages.
 */
export const STORM_STEPS: StormStep[] = [
  {
    key: "trigger",
    time: "11:42 PM",
    title: "3 cm hits",
    caption: "Snowfall crosses 3 cm on your route. Crews roll without a call.",
    notification: {
      title: "Crews dispatched",
      body: "Snowfall hit 3 cm in Petawawa. Your route is rolling.",
    },
    stop: 0,
  },
  {
    key: "en-route",
    time: "12:58 AM",
    title: "Working the route",
    caption: "The operator clears stop after stop, working toward your house.",
    stop: 2,
  },
  {
    key: "two-away",
    time: "1:36 AM",
    title: "2 stops away",
    caption: "You are next but one. Most customers sleep through this part.",
    notification: {
      title: "Almost there",
      body: "Your driveway is 2 stops away.",
    },
    stop: 3,
  },
  {
    key: "on-site",
    time: "1:52 AM",
    title: "Crew on site",
    caption: "Blower down, working your driveway edge to edge.",
    notification: { title: "Crew on site", body: "Clearing your driveway now." },
    stop: 4,
    clearing: true,
  },
  {
    key: "first-pass",
    time: "2:04 AM",
    title: "First pass done",
    caption: "Driveway open. On single-pass packages, this is the visit.",
    notification: {
      title: "First pass complete",
      body: "Your driveway is open. Logged to your service history.",
    },
    stop: 5,
  },
  {
    key: "second-pass",
    time: "6:38 AM",
    title: "Second pass",
    caption: "The storm tapered overnight, so the crew swings back before the commute.",
    notification: {
      title: "Second pass complete",
      body: "Cleared again before the morning drive. You are good to go.",
    },
    stop: 4,
    clearing: true,
    twoPassOnly: true,
  },
  {
    key: "walkway",
    time: "6:51 AM",
    title: "Walkway shoveled",
    caption: "Walkway, steps, and porch finished by hand.",
    notification: {
      title: "Walkway shoveled",
      body: "Steps and walkway cleared. One visit used from your pass pack.",
    },
    stop: 4,
    walkwayOnly: true,
  },
  {
    key: "done",
    time: "7:00 AM",
    title: "Morning",
    caption: "You walk out to an open driveway. That is the whole experience.",
    stop: 6,
  },
];

// =============================================================================
// EQUIPMENT GRID
// =============================================================================
// Real photos from /public/images/gallery/snow-removal. Swap any entry by
// dropping a new file in that folder and updating the src here (or via the
// admin photo manager for other site sections).

export type EquipmentItem = {
  src: string;
  alt: string;
  title: string;
  caption: string;
};

export const WINTER_EQUIPMENT: EquipmentItem[] = [
  {
    src: "/images/gallery/snow-removal/drone-tractor-snowblowing-driveway.webp",
    alt: "PVS tractor with inverted blower clearing a residential driveway, seen from above",
    title: "Tractors with inverted blowers",
    caption: "Purpose-built for Petawawa driveways. Edge to edge, no windrows left behind.",
  },
  {
    src: "/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp",
    alt: "PVS plow truck clearing a commercial lot at night",
    title: "Plow trucks",
    caption: "Pembroke routes and commercial lots. Big pushes, done fast.",
  },
  {
    src: "/images/gallery/snow-removal/tractors-staged-night-snowfall.webp",
    alt: "PVS tractors staged and ready during an overnight snowfall",
    title: "Staged before the storm",
    caption: "Rigs are fueled and staged when the forecast turns. 3 cm and they roll.",
  },
  {
    src: "/images/gallery/snow-removal/tractor-cab-route-tablet.webp",
    alt: "Route tablet mounted in a PVS tractor cab",
    title: "Routed by Aurora",
    caption: "The same dispatch system that powers your portal runs the cab tablet.",
  },
  {
    src: "/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp",
    alt: "PVS tractor snow-blowing a driveway at night under its headlights",
    title: "Overnight crews",
    caption: "Most storms are fought in the dark so your morning is not.",
  },
  {
    src: "/images/gallery/snow-removal/box-plow-townhouse-driveway.webp",
    alt: "Box plow clearing a townhouse driveway",
    title: "Shovel crew and walkways",
    caption: "Steps, walkways, and porches finished by hand with prepaid pass packs.",
  },
];

// =============================================================================
// "YOUR POV" CARDS
// =============================================================================

export type PovCard = {
  key: "before" | "during" | "after";
  eyebrow: string;
  title: string;
  points: string[];
};

export const POV_CARDS: PovCard[] = [
  {
    key: "before",
    eyebrow: "Before the storm",
    title: "Locked in and off your mind",
    points: [
      "One seasonal contract, signed once, covers the whole winter",
      "Your Aurora portal account is set up for you with your route spot",
      "The dispatch rule is fixed: 3 cm on your route and crews roll",
    ],
  },
  {
    key: "during",
    eyebrow: "During the storm",
    title: "Watch it handled from the couch",
    points: [
      "Crew-tracking alerts as the operator works toward your driveway",
      "A push the moment each pass is finished, overnight ones included",
      "No calls to make. The storm triggers us, not you",
    ],
  },
  {
    key: "after",
    eyebrow: "After the storm",
    title: "On the record, on installments",
    points: [
      "Every visit logged to your season-long service history in Aurora",
      "Photo proof per visit where your package includes it",
      "Contracts, invoices, and installment billing in one place",
    ],
  },
];

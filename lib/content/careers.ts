/**
 * Open roles + General Application.
 *
 * To take a role offline: set `active: false`. The page stops appearing
 * on /careers and the detail route returns 404 (so Google de-indexes it,
 * which is the correct signal for "job filled").
 *
 * `datePosted` powers the JobPosting JSON-LD on each detail page.
 * Update it whenever you re-list or refresh a role.
 */
export const CAREER_DIVISIONS = [
  "lawnpros",
  "clearview",
  "snowland",
  "company-wide",
] as const;

export type CareerDivision = (typeof CAREER_DIVISIONS)[number];

export const CAREER_TYPES = [
  "Full-time",
  "Part-time",
  "Seasonal",
  "Flexible",
] as const;

export type CareerType = (typeof CAREER_TYPES)[number];

export type Role = {
  slug: string;
  title: string;
  division: CareerDivision;
  type: CareerType;
  payRange: string;
  location: string;
  shortPitch: string;
  longPitch: string;
  responsibilities: string[];
  requirements: string[];
  niceToHave: string[];
  /** ISO date — drives JobPosting JSON-LD datePosted */
  datePosted: string;
  /** Toggle off to hide the role everywhere (returns 404 on detail page). */
  active: boolean;
};

const LOCATION_DEFAULT = "Petawawa / Pembroke / Ottawa Valley";

export const roles: Role[] = [
  {
    slug: "lawn-crew-member",
    title: "Lawn Crew Member",
    division: "lawnpros",
    type: "Seasonal",
    payRange: "$18–$22/hr",
    location: LOCATION_DEFAULT,
    shortPitch:
      "Mow, edge, and finish properties across the Valley. Seasonal start with a path to year-round work across our snow team.",
    longPitch:
      "Spend your days outdoors on a tight crew, making properties look their best. We start most lawn crew members in the spring and roll the right people into our snow team for the winter — so the work doesn't stop in October.",
    responsibilities: [
      "Operate mowers, trimmers, and blowers safely and efficiently",
      "Edge, trim, and blow-clean every visit to a finished standard",
      "Load, secure, and inspect equipment daily",
      "Represent PVS professionally on every property",
    ],
    requirements: [
      "Valid Ontario driver's license (G or G2)",
      "Reliable transportation to our Petawawa yard",
      "Physically able to work outdoors for full shifts",
      "Punctual, dependable, and takes pride in the work",
    ],
    niceToHave: [
      "Prior landscaping or trades experience",
      "Trailer towing experience",
      "Small-engine maintenance basics",
    ],
    datePosted: "2026-05-01",
    active: true,
  },
  {
    slug: "crew-lead",
    title: "Crew Lead",
    division: "company-wide",
    type: "Full-time",
    payRange: "$22–$28/hr",
    location: LOCATION_DEFAULT,
    shortPitch:
      "Lead a 2–3 person crew across lawn, exterior, and snow rotations. Own quality and customer experience on every job.",
    longPitch:
      "Crew Leads are the backbone of PVS. You'll run your crew's daily schedule, coach newer team members, and own the standard on every property. Strong Crew Leads move into Division Manager roles within 1–2 seasons.",
    responsibilities: [
      "Run daily schedule and route for a 2–3 person crew",
      "Onboard, coach, and motivate new crew members",
      "Final QC walk-through on every property before leaving",
      "Communicate proactively with the office and customers",
      "Own equipment uptime — light maintenance and end-of-day inspections",
    ],
    requirements: [
      "2+ seasons in lawn care, landscaping, or trades",
      "Valid Ontario driver's license + clean abstract",
      "Comfort leading a small team and giving feedback",
      "Reliable transportation",
    ],
    niceToHave: [
      "Experience operating skid-steers, plow trucks, or pressure washers",
      "First Aid / WHMIS",
      "Snow plowing experience",
    ],
    datePosted: "2026-04-15",
    active: true,
  },
  {
    slug: "exterior-cleaning-technician",
    title: "Exterior Cleaning Technician",
    division: "clearview",
    type: "Full-time",
    payRange: "$20–$26/hr",
    location: LOCATION_DEFAULT,
    shortPitch:
      "Window cleaning, gutter clearing, and pressure washing across residential properties — streak-free results, every job.",
    longPitch:
      "Join the ClearView crew handling windows, gutters, pressure washing, and exterior touch-ups. We train you on every system — you bring the work ethic and an eye for finish quality.",
    responsibilities: [
      "Interior + exterior window cleaning to a streak-free standard",
      "Gutter cleaning and downspout flushing",
      "Pressure washing driveways, walkways, and house exteriors",
      "Ladder and roof-edge work safely under PVS protocols",
      "Set up and tear down job sites cleanly",
    ],
    requirements: [
      "Comfortable working from ladders up to 24'",
      "Valid Ontario driver's license",
      "Reliable transportation",
      "Detail-oriented — \"streak-free\" matters",
    ],
    niceToHave: [
      "Prior window cleaning or pressure washing experience",
      "Working at Heights certification",
      "Trailer towing experience",
    ],
    datePosted: "2026-03-20",
    active: true,
  },
  {
    slug: "snow-removal-operator",
    title: "Snow Removal Operator",
    division: "snowland",
    type: "Seasonal",
    payRange: "$25–$35/hr",
    location: LOCATION_DEFAULT,
    shortPitch:
      "Plow residential routes through the night during qualifying storms. Premium seasonal pay, flexible day-job-compatible schedule.",
    longPitch:
      "SnowLand Operators run our residential plow routes from November through April. Pay scales with experience and route load. Most of our operators come from our summer crews — but we hire externally too for the right person.",
    responsibilities: [
      "Plow assigned residential routes during qualifying storms",
      "Apply salt / grit on walkways and aprons",
      "Log timestamps and notes per property",
      "Light end-of-shift truck maintenance and fueling",
    ],
    requirements: [
      "Valid Ontario driver's license — DZ an asset",
      "Snow plowing experience (residential or commercial)",
      "Available on-call during qualifying storms (overnight common)",
      "Cold-weather fit and stamina",
    ],
    niceToHave: [
      "Skid-steer or backhoe experience",
      "Mechanical aptitude for in-field troubleshooting",
      "Experience with route software",
    ],
    datePosted: "2026-09-15",
    active: true,
  },
  {
    slug: "general-application",
    title: "General Application",
    division: "company-wide",
    type: "Flexible",
    payRange: "Based on role + experience",
    location: LOCATION_DEFAULT,
    shortPitch:
      "Don't see a perfect fit? Tell us what you're great at — we keep a short list of strong candidates and reach out as roles open.",
    longPitch:
      "We always want to hear from reliable people who take pride in their work. Submit a general application and we'll keep you on file. When something opens that matches your skills, you're first call.",
    responsibilities: [
      "Tell us what you're good at and what you want to do more of",
      "Share what kind of schedule works for your life",
    ],
    requirements: [
      "Reliability and a strong work ethic",
      "Valid Ontario driver's license preferred but not required for every role",
    ],
    niceToHave: [
      "Any trades, landscaping, or service-industry background",
      "Local to the Petawawa / Pembroke area",
    ],
    datePosted: "2026-01-01",
    active: true,
  },
];

export const GENERAL_APPLICATION_SLUG = "general-application";

export function getRole(slug: string): Role | undefined {
  return roles.find((r) => r.slug === slug);
}

export function activeRoles(): Role[] {
  return roles.filter((r) => r.active);
}

export function activeRolesExcludingGeneral(): Role[] {
  return roles.filter(
    (r) => r.active && r.slug !== GENERAL_APPLICATION_SLUG
  );
}

export function generalApplication(): Role {
  const r = getRole(GENERAL_APPLICATION_SLUG);
  if (!r)
    throw new Error("General Application role missing from careers.ts");
  return r;
}

// User-facing category labels. We dropped the sub-brand naming
// (LawnPros / ClearView / SnowLand) — PVS is one brand, these are
// service categories the role rolls up to.
export const divisionLabel: Record<CareerDivision, string> = {
  lawnpros: "Lawn Care",
  clearview: "Exterior Cleaning",
  snowland: "Snow & Ice",
  "company-wide": "Company-wide",
};

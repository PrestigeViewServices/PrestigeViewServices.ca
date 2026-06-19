import type { LucideIcon } from "lucide-react";
import {
  Scissors,
  Sprout,
  Wind,
  Leaf,
  Recycle,
  Wrench,
  Sparkles,
  Droplets,
  Waves,
  Home,
  Trash2,
  PackageOpen,
  Snowflake,
  CalendarCheck,
  Footprints,
  Shovel,
} from "lucide-react";
import type { DivisionSlug } from "./divisions";

export type Service = {
  slug: string;
  name: string;
  division: DivisionSlug;
  shortDescription: string;
  features: string[];
  icon: LucideIcon;
  /** Cross-sell hints — slugs of services often purchased together */
  pairsWith?: string[];
};

export const services: Service[] = [
  // ---------------- LAWNPROS ----------------
  {
    slug: "lawn-mowing",
    name: "Lawn Mowing",
    division: "lawnpros",
    shortDescription:
      "Weekly or bi-weekly recurring mowing with crisp edges and clean cleanup.",
    features: [
      "Weekly or bi-weekly schedules",
      "Sharp-blade clean cut",
      "Edging & trimming included",
      "Blow-clean of walkways & drive",
    ],
    icon: Scissors,
    pairsWith: ["landscaping-services", "aeration", "overseeding"],
  },
  {
    slug: "landscaping-services",
    name: "Landscaping Services",
    division: "lawnpros",
    shortDescription:
      "Mulch refresh, crisp bed edges, and seasonal planting — design-light landscaping handled by the crew that already maintains your property.",
    features: [
      "Mulch top-up & fresh installations",
      "Bed & border edging",
      "Perennial, shrub & seasonal planting",
      "Free on-site estimate & design notes",
    ],
    icon: Shovel,
    pairsWith: ["lawn-mowing", "spring-cleanup", "property-maintenance"],
  },
  {
    slug: "spring-cleanup",
    name: "Spring Cleanups",
    division: "lawnpros",
    shortDescription:
      "Get your yard ready for the season — debris removal, edging, and first cut.",
    features: [
      "Winter debris & leaf removal",
      "Bed edging & cleanup",
      "First cut & blow-down",
      "Hauling included",
    ],
    icon: Sprout,
    pairsWith: ["lawn-mowing", "aeration", "gutter-cleaning"],
  },
  {
    slug: "aeration",
    name: "Lawn Aeration",
    division: "lawnpros",
    shortDescription:
      "Core aeration to relieve compaction and let your turf breathe.",
    features: [
      "Core-pull aeration",
      "Even, full-coverage passes",
      "Recommended pre-overseeding",
      "Booked seasonally",
    ],
    icon: Wind,
    pairsWith: ["overseeding", "dethatching", "lawn-mowing"],
  },
  {
    slug: "dethatching",
    name: "Dethatching",
    division: "lawnpros",
    shortDescription:
      "Remove the dead-thatch layer so your lawn can drink and grow.",
    features: [
      "Power-rake dethatching",
      "Full debris cleanup",
      "Pairs with overseeding",
      "Spring or fall service",
    ],
    icon: Leaf,
    pairsWith: ["overseeding", "aeration"],
  },
  {
    slug: "overseeding",
    name: "Overseeding",
    division: "lawnpros",
    shortDescription:
      "Thicken thin areas and bring back colour with premium seed blends.",
    features: [
      "Cold-tolerant seed blend",
      "Soil contact prep",
      "Recommended post-aeration",
      "Watering plan included",
    ],
    icon: Recycle,
    pairsWith: ["aeration", "dethatching"],
  },
  {
    slug: "property-maintenance",
    name: "Property Maintenance",
    division: "lawnpros",
    shortDescription:
      "Ongoing seasonal upkeep — one crew, one bill, every visit.",
    features: [
      "Custom recurring plan",
      "Trim, edge & cleanup",
      "Seasonal switch-overs",
      "Single point of contact",
    ],
    icon: Wrench,
    pairsWith: ["lawn-mowing", "window-cleaning", "snow-removal"],
  },

  // ---------------- CLEARVIEW ----------------
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    division: "clearview",
    shortDescription:
      "Interior & exterior streak-free window cleaning with frame & sill care.",
    features: [
      "Interior & exterior cleaning",
      "Streak-free guarantee",
      "Frame & sill wipe-down",
      "Screen cleaning available",
    ],
    icon: Sparkles,
    pairsWith: ["gutter-cleaning", "pressure-washing", "house-washing"],
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    division: "clearview",
    shortDescription:
      "Complete debris removal, downspout flush, and full inspection.",
    features: [
      "Complete debris removal",
      "Downspout flushing",
      "Gutter inspection",
      "Cleanup included",
    ],
    icon: Droplets,
    pairsWith: ["window-cleaning", "house-washing", "spring-cleanup"],
  },
  {
    slug: "pressure-washing",
    name: "Pressure Washing",
    division: "clearview",
    shortDescription:
      "Driveways, walkways, decks & patios — restored, not just rinsed.",
    features: [
      "Driveway restoration",
      "Walkway cleaning",
      "Deck & patio cleaning",
      "Eco-friendly solutions",
    ],
    icon: Waves,
    pairsWith: ["house-washing", "window-cleaning", "property-touch-ups"],
  },
  {
    slug: "house-washing",
    name: "House / Exterior Washing",
    division: "clearview",
    shortDescription:
      "Soft-wash siding, soffits, and exterior surfaces brought back to life.",
    features: [
      "Siding & soffit soft-wash",
      "Mildew & algae treatment",
      "Plant-safe cleaning",
      "Spot-rinse touch-ups",
    ],
    icon: Home,
    pairsWith: ["window-cleaning", "pressure-washing", "gutter-cleaning"],
  },
  {
    slug: "property-touch-ups",
    name: "Property Touch-Ups & Maintenance",
    division: "clearview",
    shortDescription:
      "Seasonal exterior upkeep — book standalone or add to any service.",
    features: [
      "Seasonal exterior upkeep",
      "Standalone or add-on",
      "Small repairs handled",
      "Walk-through report",
    ],
    icon: Wrench,
    pairsWith: ["window-cleaning", "gutter-cleaning", "pressure-washing"],
  },
  {
    slug: "junk-removal",
    name: "Junk Removal",
    division: "clearview",
    shortDescription:
      "Same-day appliances, furniture, and yard debris hauled responsibly.",
    features: [
      "Same-day availability",
      "Appliances & furniture",
      "Yard debris",
      "Responsible disposal",
    ],
    icon: Trash2,
    pairsWith: ["property-cleanouts", "spring-cleanup"],
  },
  {
    slug: "property-cleanouts",
    name: "Property Cleanouts",
    division: "clearview",
    shortDescription:
      "Move-out, estate, garage, and renovation cleanouts — done in one sweep.",
    features: [
      "Move-out cleanouts",
      "Estate & garage clearing",
      "Renovation debris removal",
      "Full property sweep",
    ],
    icon: PackageOpen,
    pairsWith: ["junk-removal", "pressure-washing"],
  },

  // ---------------- SNOWLAND ----------------
  {
    slug: "snow-removal",
    name: "Residential Snow Removal",
    division: "snowland",
    shortDescription:
      "Driveways cleared on-time so you can get out the door without a shovel.",
    features: [
      "Per-storm or recurring",
      "Driveway + apron clearing",
      "Salt application available",
      "Reliable response times",
    ],
    icon: Snowflake,
    pairsWith: ["seasonal-snow-contract", "walkway-clearing"],
  },
  {
    slug: "seasonal-snow-contract",
    name: "Seasonal Snow Contracts",
    division: "snowland",
    shortDescription:
      "One flat winter rate. Unlimited visits during qualifying storms.",
    features: [
      "Flat seasonal pricing",
      "Unlimited qualifying visits",
      "Priority routing",
      "Locked in before snowfall",
    ],
    icon: CalendarCheck,
    pairsWith: ["snow-removal", "walkway-clearing"],
  },
  {
    slug: "walkway-clearing",
    name: "Walkway & Path Clearing",
    division: "snowland",
    shortDescription:
      "Front walks, steps, and entries shoveled and salted to keep guests safe.",
    features: [
      "Walkways, steps & entries",
      "Shovel-finish on paths",
      "Salt / grit application",
      "Add-on to any plow visit",
    ],
    icon: Footprints,
    pairsWith: ["snow-removal", "seasonal-snow-contract"],
  },
];

export function getService(slug: string): Service | undefined {
  return services.find((s) => s.slug === slug);
}

export function servicesByDivision(division: DivisionSlug): Service[] {
  return services.filter((s) => s.division === division);
}

export type ServiceOption = {
  slug: string;
  name: string;
  division: DivisionSlug;
};

export const allServiceOptions: ServiceOption[] = services.map((s) => ({
  slug: s.slug,
  name: s.name,
  division: s.division,
}));

import type { LucideIcon } from "lucide-react";
import {
  Sparkles,
  Leaf,
  Snowflake,
  Droplets,
  Wind,
  Waves,
  Scissors,
  Trash2,
} from "lucide-react";
import type { DivisionSlug } from "./divisions";

/**
 * Categories shown on /our-work. Each one renders its own gallery page at
 * /our-work/[slug] sourced from `/public/images/gallery/[slug]/` and listed
 * in `lib/content/work-categories.ts` (this file).
 *
 * Once a category has photos, add an entry to `lib/content/gallery.ts` for
 * the ones you also want featured on the home page "Recent Work" strip.
 */
export type WorkCategoryPhoto = {
  src: string;
  alt: string;
  caption?: string;
  width: number;
  height: number;
};

export type WorkCategory = {
  slug: string;
  name: string;
  shortName: string;
  division: DivisionSlug;
  description: string;
  icon: LucideIcon;
  photos: WorkCategoryPhoto[];
};

export const workCategories: WorkCategory[] = [
  {
    slug: "window-cleaning",
    name: "Window Cleaning",
    shortName: "Windows",
    division: "clearview",
    description:
      "Streak-free interior and exterior window cleaning for homes and storefronts across Petawawa, Pembroke, and the Ottawa Valley.",
    icon: Sparkles,
    photos: [
      {
        src: "/images/gallery/window-cleaning/aw-exterior-rain.jpg",
        alt: "PVS technician cleaning A&W storefront windows on a rainy day",
        caption: "A&W exterior · Petawawa",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/aw-drive-thru.jpg",
        alt: "PVS team cleaning A&W drive-thru window",
        caption: "A&W drive-thru detail",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/interior-team-action.jpg",
        alt: "Two PVS technicians cleaning interior glass partitions on ladders",
        caption: "Interior commercial · Petawawa",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/petro-canada-storefront.jpg",
        alt: "PVS technician squeegeeing Petro-Canada storefront window",
        caption: "Petro-Canada storefront",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/star-set-jewellers.jpg",
        alt: "PVS technician cleaning Star-Set Jewellers exterior windows",
        caption: "Star-Set Jewellers · Pembroke",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/neighbours-storefront.jpg",
        alt: "PVS technician cleaning Neighbours storefront windows from a ladder",
        caption: "Neighbours storefront",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/residential-pvs-uniform.jpg",
        alt: "PVS technician in branded uniform cleaning a residential window",
        caption: "Residential exterior · Ottawa Valley",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/residential-second-story.jpg",
        alt: "PVS technician on a ladder cleaning a second-story residential window",
        caption: "Second-story residential",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/residential-extended-ladder.jpg",
        alt: "PVS technician on an extended ladder cleaning a high residential window",
        caption: "Extended-ladder work",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/pembroke-victorian-home.jpg",
        alt: "Cleaned exterior of a red brick Victorian home in Pembroke",
        caption: "Pembroke Victorian · finished",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/cape-cod-home.jpg",
        alt: "Cleaned exterior of a white Cape Cod home with garden beds",
        caption: "Cape Cod residence · finished",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/stone-residence-after.jpg",
        alt: "Streak-free residential window on a stone exterior with patio view",
        caption: "Stone residence · streak-free finish",
        width: 1200,
        height: 1600,
      },
    ],
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    shortName: "Gutters",
    division: "clearview",
    description:
      "Hand-clearing leaves, shingle grit, and debris from gutters and downspouts — keep rainwater flowing away from your foundation.",
    icon: Droplets,
    photos: Array.from({ length: 10 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        src: `/images/gallery/gutter-cleaning/gutter-job-${n}.jpg`,
        alt: `PVS gutter cleaning callout — Ottawa Valley`,
        caption: `Gutter callout · Ottawa Valley`,
        width: 1200,
        height: 1600,
      };
    }),
  },
  {
    slug: "lawn-mowing",
    name: "Lawn Mowing & Care",
    shortName: "Lawn",
    division: "lawnpros",
    description:
      "Recurring lawn mowing, edging, and seasonal cleanups for homes across Petawawa, Pembroke, and the Ottawa Valley.",
    icon: Scissors,
    photos: [
      {
        src: "/images/gallery/lawn-mowing/aerial-drone-property.jpg",
        alt: "Aerial drone view of a freshly mowed residential property",
        caption: "Aerial · drone capture",
        width: 1600,
        height: 1200,
      },
      ...Array.from({ length: 9 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        return {
          src: `/images/gallery/lawn-mowing/lawn-job-${n}.jpg`,
          alt: `PVS LawnPros crew on a residential lawn — Ottawa Valley`,
          caption: `Lawn job · Ottawa Valley`,
          width: 1600,
          height: 1200,
        };
      }),
    ],
  },
  {
    slug: "snow-removal",
    name: "Snow Removal & Plowing",
    shortName: "Snow",
    division: "snowland",
    description:
      "Residential and commercial snow plowing, walkway clearing, and seasonal contracts to keep your property safe all winter.",
    icon: Snowflake,
    photos: Array.from({ length: 14 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        src: `/images/gallery/snow-removal/snow-job-${n}.jpg`,
        alt: `PVS SnowLand crew clearing a property after a snowfall — Ottawa Valley`,
        caption: `Winter callout · Ottawa Valley`,
        width: 1600,
        height: 1200,
      };
    }),
  },
  {
    slug: "pressure-washing",
    name: "Pressure & Soft Washing",
    shortName: "Pressure Wash",
    division: "clearview",
    description:
      "Exterior siding, soffit, deck, and driveway cleaning — bring your property's finish back to brand-new.",
    icon: Waves,
    photos: Array.from({ length: 2 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        src: `/images/gallery/pressure-washing/pressure-job-${n}.jpg`,
        alt: `PVS technician soft-washing exterior siding and soffit`,
        caption: `Exterior wash · Ottawa Valley`,
        width: 1200,
        height: 1600,
      };
    }),
  },
  {
    slug: "junk-removal",
    name: "Junk & Debris Removal",
    shortName: "Junk Removal",
    division: "clearview",
    description:
      "Single-item pickups, full property cleanouts, and post-project debris hauls — loaded, strapped, and disposed of responsibly.",
    icon: Trash2,
    photos: Array.from({ length: 5 }, (_, i) => {
      const n = String(i + 1).padStart(2, "0");
      return {
        src: `/images/gallery/junk-removal/junk-job-${n}.jpg`,
        alt: `PVS trailer loaded with junk and debris ready for disposal`,
        caption: `Loaded & ready for disposal`,
        width: 1600,
        height: 1200,
      };
    }),
  },
  // Add more categories here as photos come in.
];

export function getWorkCategory(slug: string): WorkCategory | undefined {
  return workCategories.find((c) => c.slug === slug);
}

export const populatedWorkCategories = (): WorkCategory[] =>
  workCategories.filter((c) => c.photos.length > 0);

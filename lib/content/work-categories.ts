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
  TreeDeciduous,
  Home,
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
        src: "/images/gallery/window-cleaning/ladder-squeegee-cottage-upper-window.webp",
        alt: "Technician on an extension ladder squeegeeing an upper window of a wood-sided cottage in the Ottawa Valley",
        caption: "Cottage glass · upper storey",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/window-cleaning/ladder-second-storey-window-cleaning.webp",
        alt: "PVS crew member on an extension ladder cleaning a second-storey window of a wood-sided Ottawa Valley home",
        caption: "Second storey · no problem",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/squeegee-exterior-window-bungalow.webp",
        alt: "Crew member squeegeeing an exterior window of a bungalow in Petawawa",
        caption: "Squeegee finish · streak-free",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/timber-home-streakfree.jpg",
        alt: "Large timber-frame home with streak-free windows after professional exterior window cleaning in the Ottawa Valley",
        caption: "Timber home · streak-free finish",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/commercial-glass-tower.jpg",
        alt: "Floor-to-ceiling commercial windows cleaned streak-free by Prestige View Services in Pembroke",
        caption: "Commercial glass · Pembroke",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/residential-dormer.jpg",
        alt: "Crisp dormer window on white siding after residential window cleaning in Petawawa",
        caption: "Residential dormer · Petawawa",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/residential-home-exterior.jpg",
        alt: "Residential home with clean, streak-free exterior windows in the Ottawa Valley",
        caption: "Residential exterior · Ottawa Valley",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/storefront-squeegee.jpg",
        alt: "Prestige View Services technician squeegeeing a storefront window in Petawawa",
        caption: "Storefront detail · Petawawa",
        width: 900,
        height: 1600,
      },
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
      {
        src: "/images/gallery/window-cleaning/skylight-debris-before.jpg",
        alt: "Skylight surrounded by leaves and debris before a PVS cleaning",
        caption: "Skylight · before",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/skylight-clean-after.jpg",
        alt: "Same skylight crystal clear after a PVS window cleaning service",
        caption: "Skylight · after",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/skylight-roof-crew.jpg",
        alt: "PVS technician on the roof during a skylight cleaning job",
        caption: "Skylight · crew on roof",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/skylight-shadow-clean.jpg",
        alt: "Clean skylight reflecting roofline and sky after PVS cleaning",
        caption: "Skylight · finished",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/storefront-squeegee-action.jpg",
        alt: "PVS technician squeegeeing a commercial storefront window from the inside",
        caption: "Storefront squeegee · in action",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/window-cleaning/modern-dark-frame-01.jpg",
        alt: "Modern home with dark-framed windows reflecting sky after PVS exterior cleaning",
        caption: "Modern dark frame · sky reflection",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/modern-dark-frame-02.jpg",
        alt: "Crisp dark-framed residential windows after a PVS window cleaning visit",
        caption: "Modern dark frame · streak-free",
        width: 1600,
        height: 1200,
      },
      {
        src: "/images/gallery/window-cleaning/residential-bay-window.jpg",
        alt: "Brick residential home with large bay window cleaned by PVS in the Ottawa Valley",
        caption: "Brick bay window · residential",
        width: 1600,
        height: 1200,
      },
    ],
  },
  {
    slug: "gutter-cleaning",
    name: "Gutter Cleaning",
    shortName: "Gutters",
    division: "clearview",
    description:
      "Hand-clearing leaves, shingle grit, and debris from gutters and downspouts, keep rainwater flowing away from your foundation.",
    icon: Droplets,
    photos: [
      {
        src: "/images/gallery/gutter-cleaning/gutter-debris-before.jpg",
        alt: "Residential gutter packed with leaves and shingle grit before a Prestige View Services gutter cleaning in the Ottawa Valley",
        caption: "Clogged gutter · before",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/gutter-cleaning/gutter-clean-after.jpg",
        alt: "Spotless gutter and downspout flowing freely after a Prestige View Services gutter cleaning in the Ottawa Valley",
        caption: "Cleared & flowing · after",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/gutter-cleaning/gutter-clean-run.jpg",
        alt: "Long residential gutter run cleared of leaves and debris in Petawawa",
        caption: "Full run cleared · Petawawa",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/gutter-cleaning/crew-ladder-gutters.jpg",
        alt: "Prestige View Services crew on ladders clearing residential gutters in Petawawa",
        caption: "PVS crew on site",
        width: 1200,
        height: 1600,
      },
      {
        src: "/images/gallery/gutter-cleaning/gutter-hand-clearing.jpg",
        alt: "Technician hand-clearing leaves and debris from a residential gutter in the Ottawa Valley",
        caption: "Hand-clearing debris",
        width: 1200,
        height: 1600,
      },
      ...Array.from({ length: 14 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        return {
          src: `/images/gallery/gutter-cleaning/gutter-job-${n}.jpg`,
          alt: `Residential gutter cleaning callout by Prestige View Services in the Ottawa Valley`,
          caption: `Gutter callout · Ottawa Valley`,
          width: 1200,
          height: 1600,
        };
      }),
    ],
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
        src: "/images/gallery/lawn-mowing/pvs-crew-fertilizer-spreader-modern-home.webp",
        alt: "PVS lawn care crew in branded shirts running a fertilizer spreader at a modern Petawawa home",
        caption: "Turf program · PVS crew",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/lawn-mowing/mow-stripes-backyard-brick-home.webp",
        alt: "Fresh mow stripes across a manicured backyard of a brick home in the Ottawa Valley",
        caption: "Backyard stripes · weekly plan",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/lawn-mowing/fresh-mow-stripes-front-lawn.webp",
        alt: "Freshly mowed front lawn with crisp mowing stripes in Pembroke Ontario",
        caption: "Fresh stripes · weekly cut",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/lawn-mowing/striped-backyard-evergreens-deep-river.webp",
        alt: "Striped freshly mowed backyard framed by mature evergreens near Deep River",
        caption: "Backyard stripes · Deep River",
        width: 1201,
        height: 1600,
      },
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
          alt: `PVS lawn care crew mowing a residential lawn, Ottawa Valley`,
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
    photos: [
      {
        src: "/images/gallery/snow-removal/tractor-cleared-estate-driveway-winter.webp",
        alt: "PVS tractor beside a freshly cleared estate driveway on a sunny winter day near Pembroke",
        caption: "Estate driveway · cleared & open",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/drone-tractor-snowblowing-driveway.webp",
        alt: "Aerial drone view of a PVS tractor snow-blowing a long residential driveway in Petawawa",
        caption: "Drone view · mid-storm clearing",
        width: 1440,
        height: 981,
      },
      {
        src: "/images/gallery/snow-removal/aerial-tractor-plowing-snowy-street.webp",
        alt: "Aerial view of a tractor plowing a snowbound residential street in the Ottawa Valley",
        caption: "Route clearing · Ottawa Valley",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp",
        alt: "John Deere tractor snow-blowing a driveway at night with headlights on in Pembroke",
        caption: "Night shift · storm response",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/snow-removal/tractor-sunny-cleared-driveway.webp",
        alt: "PVS tractor beside a freshly cleared residential driveway on a sunny winter day in Petawawa",
        caption: "Bluebird morning · driveway open",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/tractor-blade-clearing-driveway-blue-sky.webp",
        alt: "Tractor with front blade clearing a residential driveway under a blue winter sky in the Ottawa Valley",
        caption: "Blade work · clean pass",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/tractors-staged-night-snowfall.webp",
        alt: "Two PVS tractors with snowblowers staged at night in falling snow, ready for the storm",
        caption: "Staged & ready · storm night",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/box-plow-townhouse-driveway.webp",
        alt: "Tractor with box plow clearing a townhouse driveway after a snowfall in Pembroke",
        caption: "Townhouse route · cleared",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/night-snow-plume-tractor.webp",
        alt: "Tractor throwing an arc of snow during a night clearing run in the Ottawa Valley",
        caption: "Snow plume · night run",
        width: 1081,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/tractor-night-street-snowblowing.webp",
        alt: "PVS tractor snow-blowing along a residential street at night in Petawawa",
        caption: "Street pass · after dark",
        width: 1081,
        height: 1920,
      },
      {
        src: "/images/gallery/snow-removal/snowy-ranch-home-blue-sky.webp",
        alt: "Snow-covered ranch home with a cleared driveway under a blue winter sky near Deep River",
        caption: "After the storm · all clear",
        width: 1441,
        height: 1920,
      },
      ...Array.from({ length: 14 }, (_, i) => {
        const n = String(i + 1).padStart(2, "0");
        return {
          src: `/images/gallery/snow-removal/snow-job-${n}.jpg`,
          alt: `PVS snow removal crew clearing a property after a snowfall, Ottawa Valley`,
          caption: `Winter callout · Ottawa Valley`,
          width: 1600,
          height: 1200,
        };
      }),
    ],
  },
  {
    slug: "pressure-washing",
    name: "Pressure & Soft Washing",
    shortName: "Pressure Wash",
    division: "clearview",
    description:
      "Exterior siding, soffit, deck, and driveway cleaning, bring your property's finish back to brand-new.",
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
      "Single-item pickups, full property cleanouts, and post-project debris hauls, loaded, strapped, and disposed of responsibly.",
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
  {
    slug: "hedge-trimming",
    name: "Hedge Trimming & Shrub Care",
    shortName: "Hedges",
    division: "lawnpros",
    description:
      "Crisp hedge lines, healthy shrubs, and total cleanup across Petawawa, Pembroke, and the Ottawa Valley.",
    icon: TreeDeciduous,
    photos: [
      {
        src: "/images/gallery/hedge-trimming/pole-trimmer-tall-cedar-hedge.webp",
        alt: "Crew member trimming a tall cedar hedge with a pole trimmer in the Ottawa Valley",
        caption: "Tall cedars · pole trimmer work",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/hedge-trimming/cedar-hedge-squared-sunrise-petawawa.webp",
        alt: "Freshly squared cedar hedge at sunrise with clippings collected on tarps in the Ottawa Valley",
        caption: "Cedar hedge · squared & cleaned",
        width: 1600,
        height: 1201,
      },
      {
        src: "/images/gallery/hedge-trimming/shrub-pruning-crew-ottawa-valley.webp",
        alt: "PVS crew member pruning a large shrub beside a home in the Ottawa Valley",
        caption: "Shrub shaping · Ottawa Valley",
        width: 900,
        height: 1600,
      },
      {
        src: "/images/gallery/hedge-trimming/hedge-trimming-cleanup-crew-pembroke.webp",
        alt: "Crew member loading fresh cedar trimmings into a bin beside a tall hedge near Pembroke",
        caption: "Full cleanup · every clipping hauled",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/hedge-trimming/trimmed-shrubs-ottawa-valley-view.webp",
        alt: "Hilltop view over freshly trimmed shrubs to the Ottawa Valley treeline",
        caption: "Trimmed & tidy · Valley view",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/hedge-trimming/ladder-shaping-towering-cedar-hedge.webp",
        alt: "PVS crew member on a ladder shaping a towering cedar hedge under a blue sky",
        caption: "Towering cedars · shaped by hand",
        width: 1441,
        height: 1920,
      },
    ],
  },
  {
    slug: "landscaping",
    name: "Landscaping Projects",
    shortName: "Landscaping",
    division: "lawnpros",
    description:
      "Garden bed refreshes, edging, planting, and small hardscape repairs that transform curb appeal in a day or two.",
    icon: Leaf,
    photos: [
      {
        src: "/images/gallery/landscaping/stone-estate-manicured-lawn-gardens.webp",
        alt: "Manicured lawn and fresh garden beds at a stone estate home on the water in the Ottawa Valley",
        caption: "Estate grounds · full care",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/landscaping/beige-two-storey-manicured-property.webp",
        alt: "Beige two-storey home with manicured lawn and landscaped beds under blue sky near Pembroke",
        caption: "Curb appeal · complete",
        width: 1920,
        height: 1440,
      },
      {
        src: "/images/gallery/landscaping/trimmed-hedge-cleared-yard-ottawa-valley.webp",
        alt: "Neatly trimmed hedge line and cleared green space after a landscaping refresh in the Ottawa Valley",
        caption: "Cleared & defined · after",
        width: 1600,
        height: 1201,
      },
      {
        src: "/images/gallery/landscaping/hillside-garden-refresh-laurentian-valley.webp",
        alt: "Tidied hillside garden with fresh grading and pines on a Laurentian Valley property",
        caption: "Hillside garden refresh",
        width: 1600,
        height: 1201,
      },
      {
        src: "/images/gallery/landscaping/backyard-cleared-rock-border-after.webp",
        alt: "Backyard cleared and finished with a rock border after brush removal, Ottawa Valley",
        caption: "Backyard reclaim · after",
        width: 1201,
        height: 1600,
      },
    ],
  },
  {
    slug: "house-washing",
    name: "House & Soft Washing",
    shortName: "House Wash",
    division: "clearview",
    description:
      "Low-pressure soft washing that lifts algae and grime off siding, soffits, and fascia without damaging the finish.",
    icon: Home,
    photos: [
      {
        src: "/images/gallery/house-washing/soft-wash-siding-crew-petawawa.webp",
        alt: "PVS crew member in branded shirt soft-washing white siding of a Petawawa home",
        caption: "Soft wash in progress",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/house-washing/white-siding-clean-after-wash-pembroke.webp",
        alt: "Gleaming white siding and soffit after an exterior house wash near Pembroke",
        caption: "After · bright again",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/house-washing/siding-soffit-clean-after-ottawa-valley.webp",
        alt: "Clean siding corner and soffits after a soft wash on an Ottawa Valley home",
        caption: "Siding & soffits · finished",
        width: 1201,
        height: 1600,
      },
      {
        src: "/images/gallery/house-washing/suds-soft-wash-siding-action.webp",
        alt: "Crew member scrubbing white siding with an extension brush, soap suds running down the wall",
        caption: "Suds down · scrub in progress",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/house-washing/rinsing-soffit-eaves-pressure-wand.webp",
        alt: "Pressure wand rinsing soffit and eaves on a white-sided home in the Ottawa Valley",
        caption: "Soffits & eaves · rinsed",
        width: 1441,
        height: 1920,
      },
      {
        src: "/images/gallery/house-washing/half-cleaned-siding-soft-wash-progress.webp",
        alt: "Half-cleaned wall showing the before and after difference during a soft wash near Petawawa",
        caption: "Half done · see the difference",
        width: 1081,
        height: 1920,
      },
      {
        src: "/images/gallery/house-washing/soft-wash-brush-scrubbing-siding.webp",
        alt: "Technician scrubbing dirty siding with a soft-wash brush on an Ottawa Valley home",
        caption: "Brush detail · walkways & decks too",
        width: 1081,
        height: 1920,
      },
    ],
  },
  // Add more categories here as photos come in.
];

export function getWorkCategory(slug: string): WorkCategory | undefined {
  return workCategories.find((c) => c.slug === slug);
}

export const populatedWorkCategories = (): WorkCategory[] =>
  workCategories.filter((c) => c.photos.length > 0);

/**
 * Many service slugs don't have a dedicated photo gallery yet. We alias them
 * to the closest-matching populated category so every service detail page can
 * still display real PVS work. The alias is a soft mapping for UI only, the
 * /our-work pages are still driven off the real `slug` field.
 */
const SERVICE_GALLERY_ALIAS: Record<string, string> = {
  "landscaping-services": "landscaping",
  "spring-cleanup": "lawn-mowing",
  "fall-cleanup": "lawn-mowing",
  aeration: "lawn-mowing",
  dethatching: "lawn-mowing",
  overseeding: "lawn-mowing",
  "property-maintenance": "lawn-mowing",
  "property-touch-ups": "pressure-washing",
  "property-cleanouts": "junk-removal",
  "seasonal-snow-contract": "snow-removal",
  "walkway-clearing": "snow-removal",
};

/**
 * Resolve a service slug to the gallery used on its service detail page. Falls
 * back to an aliased category when the service doesn't have its own photos.
 */
export function getGalleryForService(slug: string): WorkCategory | undefined {
  const direct = getWorkCategory(slug);
  if (direct && direct.photos.length > 0) return direct;
  const alias = SERVICE_GALLERY_ALIAS[slug];
  if (alias) return getWorkCategory(alias);
  return undefined;
}

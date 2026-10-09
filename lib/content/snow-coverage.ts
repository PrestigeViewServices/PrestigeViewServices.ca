/**
 * Snow coverage by town, single source of truth.
 *
 * Equipment is assigned per town, not per package: every Pembroke route
 * runs on plow trucks, every Petawawa route runs on tractors only. Every
 * page that talks about winter service (home, /fall-winter,
 * /winter-packages, the snow service + town pages, /commercial-snow-removal)
 * reads from here, so changing a town's equipment is a one-line edit.
 */

export type SnowTown = {
  slug: "pembroke" | "petawawa";
  name: string;
  /** Short equipment label, e.g. for badges. */
  equipment: string;
  headline: string;
  body: string;
  points: string[];
  img: string;
  alt: string;
};

export const SNOW_TOWNS: SnowTown[] = [
  {
    slug: "pembroke",
    name: "Pembroke",
    equipment: "Plow trucks",
    headline: "Pembroke routes run on plow trucks",
    body: "Pembroke driveways and lots are cleared with our plow trucks. Trucks cover ground fast between stops, push heavy, wet river snow without stalling, and handle the bigger commercial lots on the same run.",
    points: [
      "Truck-mounted plows on every Pembroke route",
      "Fast between stops, so the whole run is open sooner",
      "City windrow at the end of the driveway cleared every visit",
    ],
    img: "/images/gallery/snow-removal/pvs-truck-commercial-lot-night.webp",
    alt: "PVS plow truck clearing a Pembroke lot during an overnight snowfall",
  },
  {
    slug: "petawawa",
    name: "Petawawa",
    equipment: "Tractors only",
    headline: "Petawawa routes run on tractors only",
    body: "Every Petawawa driveway is cleared by tractor with a snowblower, never a truck. Blowers throw snow clear of the driveway instead of piling it into banks, so your lawn edges, mailbox, and sightlines stay intact all winter.",
    points: [
      "Tractor-mounted snowblowers on every Petawawa route",
      "Snow thrown clear, not banked across your lawn",
      "Tight passes on narrow and garrison-style driveways",
    ],
    img: "/images/gallery/snow-removal/tractor-snowblowing-sunrise-residential.webp",
    alt: "PVS tractor snow-blowing a Petawawa driveway at sunrise",
  },
];

export function snowTown(slug: string): SnowTown | undefined {
  return SNOW_TOWNS.find((t) => t.slug === slug);
}

/** One-sentence summary for FAQs and meta descriptions. */
export const SNOW_EQUIPMENT_SUMMARY =
  "Pembroke routes are cleared with plow trucks, and Petawawa routes are cleared with tractors only.";

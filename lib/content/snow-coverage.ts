/**
 * Snow coverage by town, single source of truth.
 *
 * Every route in both towns runs on tractors. PVS does not use plow trucks.
 * Every page that talks about winter service (home, /fall-winter,
 * /winter-packages, /live-map, the snow service + town pages) reads from
 * here, so changing a town's equipment is a one-line edit.
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
    equipment: "Tractors",
    headline: "Pembroke routes run on tractors",
    body: "Pembroke driveways are cleared by tractor, the same as Petawawa. Tractors handle the heavy, wet river snow Pembroke gets without stalling, and clear tight driveways cleanly.",
    points: [
      "Tractors on every Pembroke route",
      "Built for heavy, wet river snow",
      "City windrow at the end of the driveway cleared every visit",
    ],
    img: "/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp",
    alt: "PVS tractor clearing a Pembroke driveway at night during a snowfall",
  },
  {
    slug: "petawawa",
    name: "Petawawa",
    equipment: "Tractors only",
    headline: "Petawawa routes run on tractors only",
    body: "Every Petawawa driveway is cleared by tractor with a snowblower. Blowers throw snow clear of the driveway instead of piling it into banks, so your lawn edges, mailbox, and sightlines stay intact all winter.",
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
  "Every route in Pembroke and Petawawa is cleared by tractor. We do not run plow trucks.";

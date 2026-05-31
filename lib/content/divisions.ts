import type { LucideIcon } from "lucide-react";
import { Leaf, Sparkles, Snowflake } from "lucide-react";

export type DivisionSlug = "lawnpros" | "clearview" | "snowland";

export type Division = {
  slug: DivisionSlug;
  name: string;          // "PVS LawnPros"
  shortName: string;     // "LawnPros"
  tagline: string;
  description: string;
  longDescription: string;
  accent: "lawn" | "clearview" | "snowland";
  icon: LucideIcon;
  topServices: string[]; // service slugs to feature on home
};

export const divisions: Division[] = [
  {
    slug: "lawnpros",
    name: "PVS LawnPros",
    shortName: "LawnPros",
    tagline: "Lawn Care, Modernized",
    description:
      "Recurring lawn mowing, seasonal cleanups, and turf health programs for Petawawa & Pembroke homeowners.",
    longDescription:
      "From your weekly mow to spring revival and fall recovery, PVS LawnPros keeps your lawn the best-looking one on the block — on a schedule you don't have to think about.",
    accent: "lawn",
    icon: Leaf,
    topServices: ["lawn-mowing", "spring-cleanup", "aeration"],
  },
  {
    slug: "clearview",
    name: "PVS ClearView",
    shortName: "ClearView",
    tagline: "Window Care, Modernized",
    description:
      "Streak-free window cleaning, gutter clearing, pressure washing, and exterior touch-ups across the Ottawa Valley.",
    longDescription:
      "Brighter windows. Clean gutters. A pressure-washed driveway that looks brand new. ClearView is your exterior crew, scheduled and insured.",
    accent: "clearview",
    icon: Sparkles,
    topServices: ["window-cleaning", "gutter-cleaning", "pressure-washing"],
  },
  {
    slug: "snowland",
    name: "PVS SnowLand",
    shortName: "SnowLand",
    tagline: "Snow & Ice, Handled",
    description:
      "Residential snow removal and seasonal contracts so your driveway and walkways stay safe all winter.",
    longDescription:
      "Reliable plowing, shovel-cleared walkways, and seasonal pricing built for Ottawa Valley winters. Sleep in. We've got it.",
    accent: "snowland",
    icon: Snowflake,
    topServices: ["snow-removal", "seasonal-snow-contract", "walkway-clearing"],
  },
];

export function getDivision(slug: DivisionSlug): Division {
  const d = divisions.find((x) => x.slug === slug);
  if (!d) throw new Error(`Unknown division: ${slug}`);
  return d;
}

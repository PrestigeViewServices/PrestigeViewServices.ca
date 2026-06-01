/**
 * Local service-area landing pages. Each entry renders at
 * /service-areas/[slug] with a tailored H1, copy, and JSON-LD that mentions
 * the town by name. This is the single biggest local-SEO surface — Google
 * uses these pages to match "<service> + <city>" queries.
 *
 * Keep the order roughly by population / lead value (Petawawa first since
 * that's where PVS is based).
 */
export type ServiceArea = {
  slug: string;
  name: string;
  region: "ON";
  /** Short marketing tagline used as the H1 subline. */
  tagline: string;
  /** 1–2 sentence intro for the hero. Mention the town + the Valley. */
  intro: string;
  /** Why locals pick PVS here — 3 short bullets. */
  whyHere: string[];
  /** Notable nearby neighbourhoods / landmarks — adds long-tail keywords. */
  neighbourhoods: string[];
  /** Highlight 3–5 services most relevant to this town (service slugs). */
  topServices: string[];
  /** Approximate driving distance from Petawawa HQ — used in copy. */
  distanceFromHqKm: number;
  /** Approximate latitude/longitude for LocalBusiness JSON-LD. */
  geo: { lat: number; lng: number };
};

export const serviceAreas: ServiceArea[] = [
  {
    slug: "petawawa",
    name: "Petawawa",
    region: "ON",
    tagline: "Year-Round Property Care in Petawawa",
    intro:
      "Prestige View Services is based right here in Petawawa, looking after homes from Black Bay to Civic Centre Road. Same-day quotes, same-week service.",
    whyHere: [
      "Local crew that knows every street from Petawawa Point to Doran Road",
      "Recurring lawn, window, and snow plans built for CFB family schedules",
      "Fully insured, with photo updates after every visit",
    ],
    neighbourhoods: [
      "Civic Centre",
      "Black Bay",
      "Garrison Petawawa",
      "Doran Road",
      "Old Highway 17",
      "Petawawa Point",
    ],
    topServices: [
      "lawn-mowing",
      "window-cleaning",
      "snow-removal",
      "gutter-cleaning",
      "spring-cleanup",
    ],
    distanceFromHqKm: 0,
    geo: { lat: 45.8956, lng: -77.2814 },
  },
  {
    slug: "pembroke",
    name: "Pembroke",
    region: "ON",
    tagline: "Trusted Property Care for Pembroke Homes",
    intro:
      "From downtown Pembroke heritage homes to the new builds along Pembroke Street West, PVS is the year-round property care team Pembroke families call first.",
    whyHere: [
      "Specialists in historic Pembroke window and gutter restorations",
      "Recurring lawn + snow contracts with locked-in seasonal pricing",
      "Crews insured for both residential and small commercial",
    ],
    neighbourhoods: [
      "Downtown Pembroke",
      "Pembroke West",
      "Riverside Park",
      "Pembroke Heights",
      "Algonquin College area",
    ],
    topServices: [
      "window-cleaning",
      "gutter-cleaning",
      "lawn-mowing",
      "pressure-washing",
      "house-washing",
    ],
    distanceFromHqKm: 16,
    geo: { lat: 45.8266, lng: -77.1106 },
  },
  {
    slug: "deep-river",
    name: "Deep River",
    region: "ON",
    tagline: "Deep River Property Care That Shows Up",
    intro:
      "Deep River homeowners trust PVS for the unglamorous work that keeps a home looking sharp — lawns mowed, gutters clear, walkways shoveled before sunrise.",
    whyHere: [
      "Reliable Deep River routes, even up Chalk River way",
      "Storm-response snow contracts for waterfront and ridge properties",
      "Exterior wash + window care that handles river-air buildup",
    ],
    neighbourhoods: [
      "Algonquin Park gateway",
      "Riverside Drive",
      "Holm Park",
      "Doran Road",
    ],
    topServices: [
      "lawn-mowing",
      "snow-removal",
      "gutter-cleaning",
      "window-cleaning",
      "pressure-washing",
    ],
    distanceFromHqKm: 50,
    geo: { lat: 46.1004, lng: -77.4979 },
  },
  {
    slug: "chalk-river",
    name: "Chalk River",
    region: "ON",
    tagline: "Chalk River Lawn, Snow & Exterior Care",
    intro:
      "Whether you're on Plant Road or off the highway, PVS covers Chalk River with the same routing as our Deep River runs — reliable, year-round.",
    whyHere: [
      "Bundled Chalk River + Deep River routes — better pricing on recurring plans",
      "Snow contracts built for the colder valley nights",
      "Window + gutter care for cottage and year-round properties",
    ],
    neighbourhoods: ["Plant Road", "Highway 17 corridor", "Manitou Lake"],
    topServices: [
      "snow-removal",
      "lawn-mowing",
      "gutter-cleaning",
      "window-cleaning",
    ],
    distanceFromHqKm: 35,
    geo: { lat: 46.0167, lng: -77.4467 },
  },
  {
    slug: "cobden",
    name: "Cobden",
    region: "ON",
    tagline: "Cobden Property Care, From Lawn to Snow",
    intro:
      "Cobden homes along Muskrat Lake and County Road 8 get the same dialled-in service we run for Petawawa — recurring care that just shows up.",
    whyHere: [
      "Recurring Cobden lawn + snow contracts",
      "Lakefront gutter and exterior wash specialists",
      "Same-day quotes, fully insured",
    ],
    neighbourhoods: [
      "Muskrat Lake",
      "County Road 8",
      "Astrolabe Park",
      "Cobden downtown",
    ],
    topServices: [
      "lawn-mowing",
      "snow-removal",
      "gutter-cleaning",
      "pressure-washing",
    ],
    distanceFromHqKm: 35,
    geo: { lat: 45.6256, lng: -76.8853 },
  },
  {
    slug: "renfrew",
    name: "Renfrew",
    region: "ON",
    tagline: "Renfrew Lawn, Snow & Window Cleaning",
    intro:
      "From Stewart Park to Plaunt Street, Renfrew families count on PVS for steady, reliable property care — no missed weeks, no surprise bills.",
    whyHere: [
      "Flat-rate seasonal snow contracts for Renfrew driveways",
      "Recurring lawn plans with edging and full cleanup",
      "Window + gutter care from heritage to new-build homes",
    ],
    neighbourhoods: [
      "Stewart Park",
      "Plaunt Street",
      "Hall Avenue",
      "Renfrew downtown",
    ],
    topServices: [
      "snow-removal",
      "lawn-mowing",
      "window-cleaning",
      "gutter-cleaning",
    ],
    distanceFromHqKm: 65,
    geo: { lat: 45.4733, lng: -76.6822 },
  },
  {
    slug: "arnprior",
    name: "Arnprior",
    region: "ON",
    tagline: "Arnprior Property Care, Year-Round",
    intro:
      "Arnprior homes from Madawaska Boulevard to Daniel Street get full-service property care from PVS — lawn, exterior, and snow on a schedule you don't have to manage.",
    whyHere: [
      "Recurring lawn + snow built for Arnprior commuter schedules",
      "Soft-wash exterior + window care for waterfront homes",
      "Bundled gutter and pressure washing pricing",
    ],
    neighbourhoods: [
      "Madawaska Boulevard",
      "Daniel Street",
      "Robert Simpson Park",
      "Arnprior downtown",
    ],
    topServices: [
      "lawn-mowing",
      "snow-removal",
      "window-cleaning",
      "pressure-washing",
      "house-washing",
    ],
    distanceFromHqKm: 95,
    geo: { lat: 45.4332, lng: -76.3463 },
  },
  {
    slug: "eganville",
    name: "Eganville",
    region: "ON",
    tagline: "Eganville Lawn, Snow & Gutter Care",
    intro:
      "Eganville and the surrounding Bonnechere River homes — PVS handles the lawns, gutters, and snow that keep small-town homes looking their best.",
    whyHere: [
      "Recurring Eganville lawn + snow routes",
      "Bonnechere riverfront gutter and exterior wash specialists",
      "Free quotes within one business day",
    ],
    neighbourhoods: [
      "Bonnechere River",
      "Eganville Heritage District",
      "Highway 41 corridor",
    ],
    topServices: [
      "lawn-mowing",
      "snow-removal",
      "gutter-cleaning",
      "window-cleaning",
    ],
    distanceFromHqKm: 55,
    geo: { lat: 45.5388, lng: -77.0997 },
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return serviceAreas.find((a) => a.slug === slug);
}

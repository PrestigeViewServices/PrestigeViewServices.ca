/**
 * Local service-area landing pages. Each entry renders at
 * /service-areas/[slug] with a tailored H1, copy, and JSON-LD that mentions
 * the town by name. This is the single biggest local-SEO surface, Google
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
  /** Why locals pick PVS here, 3 short bullets. */
  whyHere: string[];
  /** Notable nearby neighbourhoods / landmarks, adds long-tail keywords. */
  neighbourhoods: string[];
  /** Highlight 3–5 services most relevant to this town (service slugs). */
  topServices: string[];
  /** Approximate driving distance from Petawawa HQ, used in copy. */
  distanceFromHqKm: number;
  /** Approximate latitude/longitude for LocalBusiness JSON-LD. */
  geo: { lat: number; lng: number };
  /**
   * Unique local-texture paragraphs rendered on the town hub. Housing
   * styles, landmarks, how the town actually uses us. Anti-doorway-page
   * content: never reuse a paragraph between towns.
   */
  localNotes?: string[];
  /** 1-3 town-specific FAQs (also emitted as FAQPage JSON-LD). */
  faqs?: { q: string; a: string }[];
  /**
   * Snow-removal availability. "active" = full snow coverage (Petawawa only),
   * "expanding" = launching this season, reservations open (Pembroke).
   * Undefined = snow is not offered in this town, snow pages and links are
   * suppressed everywhere for it.
   */
  snowStatus?: "active" | "expanding";
};

/** Service slugs that belong to the snow division. Kept here (not imported
 * from services.ts) to avoid a circular content dependency. */
export const SNOW_SERVICE_SLUGS = [
  "snow-removal",
  "seasonal-snow-contract",
  "walkway-clearing",
] as const;

export function isSnowService(slug: string): boolean {
  return (SNOW_SERVICE_SLUGS as readonly string[]).includes(slug);
}

/** Whether a service/area combination page should exist at all. */
export function serviceOfferedInArea(
  serviceSlug: string,
  area: ServiceArea
): boolean {
  if (!isSnowService(serviceSlug)) return true;
  return area.snowStatus !== undefined;
}

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
    snowStatus: "active",
    localNotes: [
      "Petawawa is our home base, and it shows in the routing: most streets in town see a PVS truck weekly. We are veteran operated and built around the Garrison Petawawa community, which is why serving members, veterans, and military families get 10% off every service we offer.",
      "We know the housing here because we work on all of it: PMQs and newer builds around the base, family homes in Civic Centre and along Doran Road, and the bigger riverfront lots out toward Black Bay and Petawawa Point. Sandy soil means lawns dry out fast in July, so we adjust cut heights through the season instead of scalping turf on a fixed setting.",
      "Posting season is real in this town. If you are moving in, moving out, or heading on deployment, we handle move-out cleanups, set up recurring care while you are away, and send photo updates after every visit so you can see the property from wherever you are posted.",
    ],
    faqs: [
      {
        q: "Do you offer a military discount in Petawawa?",
        a: "Yes, it is one of the things we are known for. Serving members, veterans, military families, and first responders get 10% off every service. It can't be combined with other offers above 10%, we always apply whichever discount saves you more. Just mention your service when you request your quote.",
      },
      {
        q: "Can you look after my property while I'm deployed or on course?",
        a: "That is one of the most common requests we get in Petawawa. We set up recurring lawn, window, and snow care, send photo updates after each visit, and bill one predictable amount so the home front runs itself while you're away.",
      },
    ],
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
      "Recurring lawn care with locked-in seasonal pricing",
      "Snow removal launching in Pembroke this season, reservations open now",
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
    snowStatus: "expanding",
    localNotes: [
      "Pembroke has some of the best housing stock in the Valley, and some of the most demanding. The older brick homes downtown and around the heritage district have tall original windows, deep soffits, and gutters that sit under mature maples. That combination keeps our crews busy: window detail work in spring, and gutter cleaning that actually matters in fall because those trees drop everything.",
      "West-end subdivisions off Pembroke Street West are a different job entirely: newer vinyl siding that shows algae on the shaded side within a few seasons, bigger driveways worth pressure washing, and families who want the lawn handled on a set weekly rhythm. Same crew, different toolkit.",
      "We also look after small commercial fronts downtown and rental properties around the Algonquin College campus, where owners want one insured contact for glass, gutters, and exterior washing instead of three phone numbers. And this winter, Pembroke joins our snow routes: seasonal snow removal is expanding here from our Petawawa base, and reservations are open now.",
    ],
    faqs: [
      {
        q: "Can you clean the original windows on older Pembroke homes?",
        a: "Yes. Tall heritage windows with wood frames and storm panes get hand detailing, not just a fast squeegee pass. We are careful with old glazing and always dry the frames so paint and putty stay put.",
      },
      {
        q: "How often should gutters be cleaned under Pembroke's mature trees?",
        a: "Twice a year minimum, spring and late fall. Homes directly under big maples on streets like Renfrew or Mackay often need a third mid-fall visit because the gutters fill before the leaves finish dropping.",
      },
    ],
  },
  {
    slug: "laurentian-valley",
    name: "Laurentian Valley",
    region: "ON",
    tagline: "Property Care Built for Laurentian Valley Acreages",
    intro:
      "Laurentian Valley wraps around Pembroke with country lots, newer subdivisions, and hobby farms. PVS covers all of it: big lawns, long driveways, and exteriors that face real weather.",
    whyHere: [
      "Acreage mowing with the right equipment, not a homeowner mower on a big lot",
      "Hedge and exterior care sized for country properties",
      "On the same daily routes as Pembroke, no rural call-out premium",
    ],
    neighbourhoods: [
      "Alice",
      "Pleasant Valley",
      "Forest Lea",
      "Golf Course Road",
      "B-Line Road",
      "Highway 41 south",
    ],
    topServices: [
      "lawn-mowing",
      "hedge-trimming",
      "gutter-cleaning",
      "house-washing",
      "spring-cleanup",
    ],
    distanceFromHqKm: 13,
    geo: { lat: 45.7734, lng: -77.2036 },
    localNotes: [
      "Laurentian Valley is township living: half-acre-and-up lots, newer builds off Forest Lea and Golf Course Road, and working properties out toward Alice and Pleasant Valley. The lawns are bigger, the hedgerows are longer, and the driveways do not quit. We size the equipment to match, so a property that takes a homeowner all Saturday takes our crew an hour.",
      "Because the township wraps right around Pembroke, your address is already on our daily routes. That means acreage service at in-town frequency: weekly mowing that actually holds a schedule, and gutter or window visits bundled onto the same runs.",
      "Wind and open exposure are the local quirks. Siding on the weather side greens up faster than in town, and open lots collect a season's worth of debris by April. Recurring plans here usually pair a spring house wash with a proper spring cleanup for exactly those reasons.",
    ],
    faqs: [
      {
        q: "Do you mow large rural lots in Laurentian Valley?",
        a: "Yes, acreage is our normal here. Commercial mowers and a crew mean multi-acre lawns get cut, trimmed, and blown clean in a single visit, on a weekly or bi-weekly schedule.",
      },
      {
        q: "Is there an extra charge for rural addresses in the township?",
        a: "No. Laurentian Valley sits on the same daily routes as Pembroke, so pricing works the same as in town: by the size of the job, not the drive to get there.",
      },
    ],
  },
  {
    slug: "deep-river",
    name: "Deep River",
    region: "ON",
    tagline: "Deep River Property Care That Shows Up",
    intro:
      "Deep River homeowners trust PVS for the unglamorous work that keeps a home looking sharp, lawns mowed, gutters clear, glass spotless.",
    whyHere: [
      "Reliable Deep River routes, even up Chalk River way",
      "Gutter care built for the town's tall pines and treed lots",
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
      "gutter-cleaning",
      "window-cleaning",
      "pressure-washing",
      "spring-cleanup",
    ],
    distanceFromHqKm: 50,
    geo: { lat: 46.1004, lng: -77.4979 },
    localNotes: [
      "Deep River sits right on the Ottawa River, and riverside living leaves a signature on a house: a fine film on the windows from river air, gutters that work overtime under the town's tall pines, and siding that weathers fast on the water-facing side. Our service calendar here is built around exactly those three things.",
      "A lot of our Deep River customers commute to CNL and want property care that runs without supervision: lawn crews that come while you are at work, gutter and window visits handled on route day, and a photo after the visit instead of a conversation you do not have time for.",
      "From Riverside Drive down to Holm Park, the properties here are established and treed, which we love. It also means spring cleanups are a real event: needles, cones, and a winter's worth of branches, gone in one visit.",
    ],
    faqs: [
      {
        q: "Do you run regular service routes up to Deep River?",
        a: "Yes. Deep River is a scheduled weekly route, not an occasional detour, so recurring lawn, gutter, and window customers get the same steady rhythm as our Petawawa base.",
      },
      {
        q: "Why do my windows film up so fast near the river?",
        a: "Moisture off the river carries fine mineral and organic residue that dries onto glass, especially on the water-facing side. A spring and fall professional clean keeps it from etching in, and most riverside customers here run exactly that schedule.",
      },
    ],
  },
  {
    slug: "chalk-river",
    name: "Chalk River",
    region: "ON",
    tagline: "Chalk River Lawn & Exterior Care",
    intro:
      "Whether you're on Plant Road or off the highway, PVS covers Chalk River with the same routing as our Deep River runs, reliable, year-round.",
    whyHere: [
      "Bundled Chalk River + Deep River routes, better pricing on recurring plans",
      "Acreage lawn care built for long rural lots",
      "Window + gutter care for cottage and year-round properties",
    ],
    neighbourhoods: ["Plant Road", "Highway 17 corridor", "Manitou Lake"],
    topServices: [
      "lawn-mowing",
      "gutter-cleaning",
      "window-cleaning",
      "pressure-washing",
    ],
    distanceFromHqKm: 35,
    geo: { lat: 46.0167, lng: -77.4467 },
    localNotes: [
      "Chalk River properties run bigger and more rural than most of our service area: long driveways off the Highway 17 corridor, deep lots backing onto bush, and a mix of year-round homes and cottages out toward Manitou Lake. That changes the work. Lawn and exterior care here is about the right equipment and route timing, not a quick in-town pass.",
      "Because our Chalk River visits ride on the same routes as Deep River, recurring customers get better pricing than a one-off call-out would suggest. Lawn, gutter, and window visits get bundled onto the same runs, which is how a rural address gets in-town service costs.",
      "For plant workers on rotation, we keep scheduling simple: the work happens on route day whether you are home or not, and the invoice and photos land in your inbox.",
    ],
    faqs: [
      {
        q: "Can you handle a large rural property in Chalk River?",
        a: "Yes, big lots are normal here. Commercial mowers and a full crew mean multi-acre lawns, long hedgerows, and deep gutters get handled in a single scheduled visit.",
      },
      {
        q: "Do you charge extra to come out to Chalk River?",
        a: "No call-out premium. Chalk River rides on our Deep River routes, so recurring lawn, gutter, and window services are priced the same way as anywhere else on the run.",
      },
    ],
  },
  {
    slug: "cobden",
    name: "Cobden",
    region: "ON",
    tagline: "Cobden Property Care, Lawn to Gutters",
    intro:
      "Cobden homes along Muskrat Lake and County Road 8 get the same dialled-in service we run for Petawawa, recurring care that just shows up.",
    whyHere: [
      "Recurring Cobden lawn care plans",
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
      "gutter-cleaning",
      "pressure-washing",
      "window-cleaning",
    ],
    distanceFromHqKm: 35,
    geo: { lat: 45.6256, lng: -76.8853 },
  },
  {
    slug: "renfrew",
    name: "Renfrew",
    region: "ON",
    tagline: "Renfrew Lawn & Window Cleaning",
    intro:
      "From Stewart Park to Plaunt Street, Renfrew families count on PVS for steady, reliable property care, no missed weeks, no surprise bills.",
    whyHere: [
      "Recurring lawn plans with edging and full cleanup",
      "Window + gutter care from heritage to new-build homes",
      "Scheduled weekly Renfrew routes, not occasional detours",
    ],
    neighbourhoods: [
      "Stewart Park",
      "Plaunt Street",
      "Hall Avenue",
      "Renfrew downtown",
    ],
    topServices: [
      "lawn-mowing",
      "window-cleaning",
      "gutter-cleaning",
      "house-washing",
    ],
    distanceFromHqKm: 65,
    geo: { lat: 45.4733, lng: -76.6822 },
    localNotes: [
      "Renfrew rewards a crew that can handle both ends of the housing spectrum. The century homes around Plaunt Street and the downtown core have steep rooflines, original eaves, and gutters that were not designed for maple keys. The newer streets up toward Hall Avenue are all about recurring lawn care that survives a commuter's schedule.",
      "Steel roofs are common here, and they shed onto siding and splash grime up the lower walls all winter. A spring soft wash clears that tide line, which is why Renfrew books more house washing off the winter than any other town we serve.",
      "We run Renfrew as a scheduled route, not an occasional detour, so recurring customers get the same steady weekly rhythm as our Petawawa base. From Stewart Park to O'Brien Road, the truck is already in town.",
    ],
    faqs: [
      {
        q: "Do you actually service Renfrew every week?",
        a: "Yes. Renfrew is a scheduled route with recurring lawn, window, and gutter customers, so weekly service holds all season. It is not a we-will-come-if-enough-people-call arrangement.",
      },
      {
        q: "Can you get the winter grime off my lower siding in spring?",
        a: "That is a Renfrew classic. Steel roofs shed all winter and splash a grey tide line up the bottom courses. A spring soft wash takes it off completely and gets the house ready to be looked at again.",
      },
    ],
  },
  {
    slug: "arnprior",
    name: "Arnprior",
    region: "ON",
    tagline: "Arnprior Property Care, Year-Round",
    intro:
      "Arnprior homes from Madawaska Boulevard to Daniel Street get full-service property care from PVS, lawn and exterior on a schedule you don't have to manage.",
    whyHere: [
      "Recurring lawn care built for Arnprior commuter schedules",
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
      "window-cleaning",
      "pressure-washing",
      "house-washing",
      "gutter-cleaning",
    ],
    distanceFromHqKm: 95,
    geo: { lat: 45.4332, lng: -76.3463 },
  },
  {
    slug: "eganville",
    name: "Eganville",
    region: "ON",
    tagline: "Eganville Lawn & Gutter Care",
    intro:
      "Eganville and the surrounding Bonnechere River homes, PVS handles the lawns, gutters, and windows that keep small-town homes looking their best.",
    whyHere: [
      "Recurring Eganville lawn care routes",
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
      "gutter-cleaning",
      "window-cleaning",
      "house-washing",
    ],
    distanceFromHqKm: 55,
    geo: { lat: 45.5388, lng: -77.0997 },
  },
];

export function getServiceArea(slug: string): ServiceArea | undefined {
  return serviceAreas.find((a) => a.slug === slug);
}

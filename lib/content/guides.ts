/**
 * Tips & Guides: the informational content hub. Each guide targets a real
 * question Ottawa Valley homeowners type into Google, answers it properly,
 * and links back to the matching service pages. This captures top-of-funnel
 * search intent the service pages can't.
 *
 * Rules: no internal division names, no em dashes, no published prices.
 * Heroes reuse real gallery photos (already SEO-named + optimized).
 */

export type GuideSection = {
  heading?: string;
  paragraphs: string[];
};

export type Guide = {
  slug: string;
  title: string;
  /** Meta description + card blurb, 140-160 chars. */
  description: string;
  category: string;
  datePublished: string;
  dateModified: string;
  readMinutes: number;
  hero: { src: string; alt: string };
  intro: string[];
  sections: GuideSection[];
  faqs: { q: string; a: string }[];
  /** Service slugs to surface as "book it" cards at the bottom. */
  relatedServices: string[];
};

export const guides: Guide[] = [
  {
    slug: "when-to-clean-gutters-ottawa-valley",
    title: "When Should You Clean Your Gutters in the Ottawa Valley?",
    description:
      "Spring, fall, or both? How pine needles, maples, and Valley winters set the gutter cleaning schedule for Petawawa and Pembroke homes.",
    category: "Gutters",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 5,
    hero: {
      src: "/images/gallery/gutter-cleaning/gutter-packed-debris-before-cleaning.webp",
      alt: "Gutter packed with compacted leaves and debris before cleaning",
    },
    intro: [
      "Every fall we get the same call: water pouring over the front step in the first cold rain, from a gutter that looked fine all summer. Gutters fail quietly, then all at once. The fix is a schedule, not a reaction.",
      "Here is how we time gutter cleaning across Petawawa, Pembroke, and the wider Valley, and how to tell which schedule your own house needs.",
    ],
    sections: [
      {
        heading: "The short answer: twice a year for most homes",
        paragraphs: [
          "For the average Valley home, clean gutters in late spring after the seed pods and early debris drop, and again in late fall after the leaves finish. The fall clean is the one you cannot skip: whatever sits in the trough over winter freezes into an ice dam anchor and holds meltwater against your fascia until April.",
          "New builds with no mature trees nearby can sometimes stretch to one thorough fall visit. If you can see green sprouting from the trough in summer, you are already past due.",
        ],
      },
      {
        heading: "Under pines? Plan for three visits",
        paragraphs: [
          "Streets around Black Bay, Petawawa Point, and the older cottage roads carry heavy pine cover, and needles behave nothing like leaves. They mat into a dense felt that traps water, packs into downspout elbows, and will not flush out with a hose.",
          "Heavy-cover homes do best with spring, mid-summer, and late-fall visits. It sounds like a lot until you price one fascia and soffit repair against a year of cleanings.",
        ],
      },
      {
        heading: "The signs you are already overflowing",
        paragraphs: [
          "Watch for water sheeting over the gutter edge in rain, staining or black streaks on the fascia board, mosquito activity near the roofline, and mulch splashed out of beds below the eaves. In winter, long icicles on one section usually mean a blocked run behind them.",
          "Overflow never stays a gutter problem. It becomes a foundation problem, a basement problem, and a landscaping problem, in that order.",
        ],
      },
      {
        heading: "What a proper cleaning includes",
        paragraphs: [
          "A real gutter service is hand cleaning of every run, a full downspout flush to ground level, debris hauled away rather than dropped in the beds, and photos of anything worth watching: loose hangers, separating seams, low spots that pond.",
          "Those photo checks matter. Most of the expensive gutter failures we see started as a ten-dollar hanger that nobody spotted for three years.",
        ],
      },
    ],
    faqs: [
      {
        q: "Can I skip fall cleaning if my gutters have guards?",
        a: "Guards cut down the big debris but fine material still gets through, and needles sit on top and block flow anyway. Guarded systems need less frequent cleaning, not zero cleaning, and the downspouts still need a flush.",
      },
      {
        q: "Is it too late to clean gutters once it snows?",
        a: "Once the troughs freeze, cleaning has to wait for a thaw. That is why we push the last clean into late fall after the leaves finish but before the deep freeze. If you missed the window, book the first thaw week and watch the icicles in the meantime.",
      },
    ],
    relatedServices: ["gutter-cleaning", "window-cleaning"],
  },
  {
    slug: "petawawa-lawn-care-calendar",
    title: "The Petawawa Lawn Care Calendar: Sandy Soil, Month by Month",
    description:
      "Petawawa lawns grow on sand, which changes everything: cut heights, watering, feeding, and timing. A month-by-month plan from the crew that mows them.",
    category: "Lawn Care",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 6,
    hero: {
      src: "/images/gallery/lawn-mowing/fresh-mow-stripes-front-lawn.webp",
      alt: "Freshly mowed front lawn with clean stripes in Petawawa",
    },
    intro: [
      "Most lawn advice online is written for clay or loam. Petawawa sits on sand, and sandy soil drains fast, starves fast, and burns fast. Follow generic advice here and you get the classic July brown-out.",
      "This is the calendar our mowing crews actually run, adapted for homeowners who want to do some or all of it themselves.",
    ],
    sections: [
      {
        heading: "April and May: wake it up gently",
        paragraphs: [
          "Wait until the lawn firms up before the first cut. Raking too early on soft ground tears crowns out by the roots. Once it is dry, do a spring cleanup: rake out the winter debris and matted patches, and overseed thin areas so weeds do not claim them first.",
          "The first cuts can be a touch shorter to clear winter growth, but do not scalp. Sandy soil warms quickly and the lawn will move fast by mid-May.",
        ],
      },
      {
        heading: "June: set the height and leave it alone",
        paragraphs: [
          "From June on, raise the deck. Three inches minimum, and we run higher through heat waves. Tall grass shades its own roots, and on sand that shade is the difference between green and crispy.",
          "Sharp blades matter more than people think: a clean cut heals in hours, a frayed tear browns at the tip and stresses the plant. If your lawn looks whitish two days after mowing, the blade is dull.",
        ],
      },
      {
        heading: "July and August: water deep, not often",
        paragraphs: [
          "Sand cannot hold a daily sprinkle, it drains straight through. Water deeply once or twice a week, early morning, so moisture actually reaches the root zone and the roots chase it downward.",
          "Skip fertilizing in peak heat. Feeding a heat-stressed lawn on sand pushes growth the roots cannot support. If the lawn browns despite good habits, it is usually dormancy, not death, and it greens up with the late-August rains.",
        ],
      },
      {
        heading: "September: the most important month",
        paragraphs: [
          "Fall is when Valley lawns are built. Aerate to open up the soil, overseed into the holes, and feed with a fall fertilizer. Cool nights plus warm soil is the best germination window of the year, far better than spring.",
          "Keep mowing until growth stops, and drop the height slightly for the final cut so the lawn goes into winter without long matted blades that invite snow mould.",
        ],
      },
      {
        heading: "October: last cut and cleanup",
        paragraphs: [
          "Mulch light leaf cover back into the lawn, but do not let heavy wet leaves sit through winter, they smother turf and leave dead patches. A final fall cleanup, gutters included, closes out the season properly.",
        ],
      },
    ],
    faqs: [
      {
        q: "Why does my Petawawa lawn brown out every July?",
        a: "Sandy soil drains fast and short-cut grass has no shade for its own roots. Raise the cut height through the heat, keep mower blades sharp, and water deeply once or twice a week instead of a little every day.",
      },
      {
        q: "When is the best time to overseed in the Ottawa Valley?",
        a: "Late August through September. The soil is still warm, the nights are cool, and fall rains do the watering for you. Spring overseeding works but fights weed pressure and summer heat.",
      },
    ],
    relatedServices: ["lawn-mowing", "landscaping-services", "hedge-trimming"],
  },
  {
    slug: "pressure-washing-vs-soft-washing",
    title: "Pressure Washing vs Soft Washing: Which Does Your Home Need?",
    description:
      "High pressure restores driveways. Low pressure saves siding. How to tell which method your surface needs, and what happens when you get it backwards.",
    category: "Exterior Cleaning",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 5,
    hero: {
      src: "/images/gallery/house-washing/half-cleaned-siding-soft-wash-progress.webp",
      alt: "Half-cleaned siding showing the before and after of a soft wash",
    },
    intro: [
      "The rental-store pressure washer has ruined more siding in the Valley than any hailstorm. The machine is not the problem, the method is: different surfaces need completely different pressure, and the wrong choice does permanent damage.",
      "Here is the split we use on every job, and how to tell which side of it your project lands on.",
    ],
    sections: [
      {
        heading: "Pressure washing: for the hard stuff",
        paragraphs: [
          "Concrete, interlock, stone, and asphalt want real pressure. Driveways around Petawawa collect base-traffic grit, winter salt, and baked-in grime that only a surface cleaner and high pressure will lift. Done right, concrete comes back close to its poured colour.",
          "Even here, technique matters: consistent passes with an even wand distance, or you leave zebra striping that shows for months. Interlock also usually wants its joint sand topped up afterwards.",
        ],
      },
      {
        heading: "Soft washing: for everything on the house",
        paragraphs: [
          "Siding, soffits, fascia, and roofs get cleaned with low pressure and the right cleaning solution. The solution does the work, killing the algae and mildew at the root, and a gentle rinse carries it away. The green film that creeps up shaded north walls is a living organism, and blasting it with pressure just spreads spores while forcing water behind the cladding.",
          "High pressure on vinyl siding voids most manufacturer warranties for exactly that reason: it drives water into the wall assembly where it cannot dry.",
        ],
      },
      {
        heading: "The quick decision test",
        paragraphs: [
          "Can you walk on it? Pressure wash it. Does it shed rain into a wall or attic? Soft wash it. Decks split the difference: wood wants low to medium pressure with the grain, composite wants manufacturer-spec settings, and both want cleaning before any staining or sealing project.",
          "When one property needs both, driveway plus siding is the most common Valley combo, doing them in one visit means the driveway rinse cleans up the house wash runoff too.",
        ],
      },
    ],
    faqs: [
      {
        q: "Will soft washing hurt my plants and garden beds?",
        a: "A professional soft wash pre-wets and rinses the landscaping around the work area and uses plant-safe dilution rates. Beds directly under the work get covered or rinsed continuously during the job.",
      },
      {
        q: "How often should a home exterior be washed in the Ottawa Valley?",
        a: "Most homes look their best on a two-year siding wash cycle, with shaded or tree-covered walls sometimes needing an annual pass. Driveways are typically every one to two years depending on tree cover and winter salt.",
      },
    ],
    relatedServices: ["pressure-washing", "house-washing", "window-cleaning"],
  },
  {
    slug: "prepare-driveway-ottawa-valley-winter",
    title: "How to Get Your Driveway Ready for an Ottawa Valley Winter",
    description:
      "Stake early, fix the surface, plan the snow. A pre-winter checklist for Petawawa and Pembroke driveways, from the crew that plows them at 4 a.m.",
    category: "Snow & Winter",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 5,
    hero: {
      src: "/images/gallery/snow-removal/drone-tractor-snowblowing-driveway.webp",
      alt: "Tractor with snowblower clearing a residential driveway from above",
    },
    intro: [
      "Valley winters do not ease in. The first real storm usually lands before half the town has found the snow shovel, and everything about winter driveway care gets harder once the ground freezes.",
      "This is the checklist we walk through with our own seasonal customers every fall, and most of it applies whether you clear your own snow or not.",
    ],
    sections: [
      {
        heading: "Fix the surface while you still can",
        paragraphs: [
          "Cracks that go into winter wet come out of winter wider, freeze-thaw is relentless here. Seal asphalt cracks and top up interlock joint sand in the fall. A pressure wash first helps sealers and patch products actually bond.",
          "Mark any lifted slab edges or heaved pavers now: under snow, they become the thing a shovel, a plow blade, or a toe finds first.",
        ],
      },
      {
        heading: "Stake the edges before freeze-up",
        paragraphs: [
          "Driveway markers go in before the ground freezes, full stop. Whoever clears your snow, staked edges are the difference between a clean pass in a whiteout and a spring spent repairing lawn edges and finding gravel in the grass.",
          "Stake the driveway mouth, both sides of the run, and anything invisible under snow: curbs, bed borders, the septic cap, the water shutoff.",
        ],
      },
      {
        heading: "Think about the windrow now",
        paragraphs: [
          "The ridge the city plow leaves across your apron is the heaviest, wettest snow you will move all winter, and it always arrives right before you need to leave. Decide in the fall who deals with it: you at 6 a.m., or a service whose route includes ridge clearing.",
          "If you are shovelling yourself, keep a spot on each side of the mouth to throw snow early in the season. Driveways that push all their snow to one side run out of room by February.",
        ],
      },
      {
        heading: "If you want it handled, book before the routes fill",
        paragraphs: [
          "Seasonal snow routes are capped: a machine can only clear so many driveways through a storm, so operators stop selling when the route is full, not when demand stops. In our coverage area that usually happens well before the first snowfall.",
          "Early birds also get the best rates and the best route positions. If a seasonal contract is the plan, late summer and early fall is the window.",
        ],
      },
    ],
    faqs: [
      {
        q: "When should I book seasonal snow removal in Petawawa or Pembroke?",
        a: "Before the end of September for the best selection and pricing. Routes are capped for storm performance and typically fill weeks before the first snow, especially in newly opened coverage areas.",
      },
      {
        q: "What melts ice without wrecking my concrete and plants?",
        a: "Plain rock salt stops working in deep cold and is hard on concrete and bed edges. Look for calcium or magnesium chloride blends for cold performance, use sand for traction, and sweep leftover product off the driveway when the surface is dry.",
      },
    ],
    relatedServices: ["snow-removal", "pressure-washing"],
  },
  {
    slug: "why-windows-streak-and-how-pros-clean-them",
    title: "Why Your Windows Streak (and How the Pros Get Glass Clear)",
    description:
      "Streaks, hard-water spots, and cloudy glass have different causes and different fixes. What actually works on Ottawa Valley windows.",
    category: "Windows",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 4,
    hero: {
      src: "/images/gallery/window-cleaning/heritage-home-bay-window-clean.webp",
      alt: "Heritage home bay window with freshly cleaned glass",
    },
    intro: [
      "Everyone has cleaned a window, stepped back, and watched the sun reveal a smeared mess. Streaks are not bad luck. They are one of three specific problems, and each has a specific fix.",
    ],
    sections: [
      {
        heading: "Problem one: dirty water, dirty tools",
        paragraphs: [
          "Paper towel and glass spray move dirt around and leave lint and residue behind. The professional method is simpler than the retail aisle suggests: a soft scrubber, a small amount of pure soap in clean water, and a proper squeegee wiped dry between strokes.",
          "Streaks that show up in direct sun are almost always residue from an over-soaped mix or a dirty squeegee rubber.",
        ],
      },
      {
        heading: "Problem two: hard-water spotting",
        paragraphs: [
          "Those white rings that will not wipe off are minerals baked onto the glass, usually from sprinklers hitting the windows all summer. Around here, sprinkler spotting is the most common window complaint on newer builds.",
          "Light spotting responds to specialty mineral removers. Heavy, years-old spotting can etch permanently, which is why moving the sprinkler arc off the glass is worth doing today.",
        ],
      },
      {
        heading: "Problem three: fog between the panes",
        paragraphs: [
          "If the glass looks cloudy but both surfaces feel clean, the seal on the insulated unit has failed and moisture is trapped inside. No cleaning fixes that, the sealed unit needs replacing. The glass swaps out without replacing the whole frame in most cases.",
          "Catching seal failure early matters less for the fix and more for the heating bill: a failed unit has lost its insulating gas.",
        ],
      },
      {
        heading: "What a professional visit adds",
        paragraphs: [
          "Beyond the glass itself: frames and sills wiped, screens washed rather than dusted, tracks vacuumed, and second-storey glass done safely from ladders or water-fed poles. Twice a year, after spring pollen and after fall grime, keeps most Valley homes bright year-round.",
        ],
      },
    ],
    faqs: [
      {
        q: "How often should windows be cleaned in the Ottawa Valley?",
        a: "Twice a year suits most homes: late spring after the pollen drop, and fall before the storm windows go on or winter closes in. Homes near gravel roads or under heavy tree cover often add a mid-summer exterior pass.",
      },
      {
        q: "Can hard-water spots be removed from glass?",
        a: "Fresh mineral spotting comes off with specialty removers and careful polishing. Spotting that has baked on across multiple seasons can permanently etch the glass, so treat it early and redirect any sprinkler that hits the windows.",
      },
    ],
    relatedServices: ["window-cleaning", "house-washing"],
  },
  {
    slug: "posting-season-curb-appeal-checklist",
    title: "The Posting Season Curb Appeal Checklist for Petawawa Homes",
    description:
      "Selling during posting season? The exterior jobs that change listing photos the most, in the order to do them, on a posting-season timeline.",
    category: "Curb Appeal",
    datePublished: "2026-08-11",
    dateModified: "2026-08-11",
    readMinutes: 5,
    hero: {
      src: "/images/gallery/landscaping/beige-two-storey-manicured-property.webp",
      alt: "Two-storey home with manicured lawn and refreshed garden beds",
    },
    intro: [
      "Posting season compresses a house sale into weeks. The houses that show well in the first listing photos are the ones that move, and almost everything buyers see in those photos is outside.",
      "This is the order of operations we run for pre-listing properties across Petawawa, built for a timeline where the movers are already booked.",
    ],
    sections: [
      {
        heading: "Week one: wash everything",
        paragraphs: [
          "Start with the wet work so everything after stays clean. A soft wash takes the algae film off the siding, a pressure wash brings the driveway and walkway back to true colour, and a window clean makes every interior photo brighter for free.",
          "Washing first also reveals what actually needs repair versus what was just dirty, which saves money on the touch-up list.",
        ],
      },
      {
        heading: "Week two: edges and lines",
        paragraphs: [
          "Buyers read crisp lines as a maintained house. Fresh-cut bed edges, squared hedges, and a striped lawn photograph better than almost any upgrade at this price point.",
          "Trim hedges below window lines, clear anything touching the siding, and cut back growth over walkways so the approach to the front door is open in photos and showings.",
        ],
      },
      {
        heading: "Week three: mulch and colour",
        paragraphs: [
          "A mulch top-up is the highest-impact hour in landscaping: every bed instantly looks intentional. Add a few flats of seasonal colour near the entrance, and repair the small stuff buyers notice up close, wobbly pavers, a leaning post, a sagging gutter run.",
          "Skip big planting projects before a sale. Buyers cannot see a garden's second year, and the money photographs better as mulch, edging, and repairs.",
        ],
      },
      {
        heading: "Listing week and after",
        paragraphs: [
          "Book a final mow and blow-clean for the day before photos. If the house sits on the market into a second month, keep the mowing on a schedule: an overgrown lawn under a for-sale sign tells buyers a story you do not want told.",
          "Moving out of the area? Recurring care can keep the property showing well after you have already left for the new posting, with photo updates after each visit.",
        ],
      },
    ],
    faqs: [
      {
        q: "How far ahead should I book exterior work before listing?",
        a: "Two to three weeks ahead of your photo date is comfortable. Posting season is our busiest window, so washing, landscaping, and mowing slots book up fastest between May and July.",
      },
      {
        q: "What exterior project changes listing photos the most?",
        a: "For most homes it is the combination of a washed exterior and fresh bed edges with new mulch. Both photograph dramatically and cost far less than interior renovations buyers may not value.",
      },
    ],
    relatedServices: [
      "landscaping-services",
      "house-washing",
      "pressure-washing",
      "lawn-mowing",
    ],
  },
];

export function getGuide(slug: string): Guide | undefined {
  return guides.find((g) => g.slug === slug);
}

/** Other guides for the "keep reading" block, current one excluded. */
export function otherGuides(slug: string, limit = 3): Guide[] {
  return guides.filter((g) => g.slug !== slug).slice(0, limit);
}

/**
 * Long-form sales copy for the core service pages. Services without an
 * entry here fall back to the compact template layout, so extra services
 * (junk removal, cleanouts, etc.) keep working unchanged.
 *
 * Tone: direct, warm, local. No internal division names. No em dashes.
 */

export type ServiceCopy = {
  /** 2-3 benefit-led intro paragraphs rendered under the hero. */
  intro: string[];
  /** "Why homeowners book this" cards. */
  benefits: { title: string; body: string }[];
  /** "How it works" steps, rendered in order. */
  process: { title: string; body: string }[];
  /** Short cross-sell line rendered above the related-services grid. */
  crossSellNote?: string;
};

export const serviceCopy: Record<string, ServiceCopy> = {
  "window-cleaning": {
    intro: [
      "There is a difference between windows that got wiped and windows that got cleaned. You notice it the first sunny morning after we leave: no film, no streaks, no drips dried into the corners. Just glass you forget is there.",
      "Our crews clean inside and out, by hand, with professional squeegees and pure water where the job calls for it. Frames and sills get wiped down as part of the visit, not as an upsell. Screens can be cleaned at the same time, and second-storey glass is never a problem.",
      "Most Petawawa and Pembroke customers put us on a spring and fall schedule so the house stays bright year-round. One visit is all it takes to see why.",
    ],
    benefits: [
      {
        title: "Streak-free, guaranteed",
        body: "If you spot a streak after we leave, we come back and fix it. That simple.",
      },
      {
        title: "Frames, sills and tracks included",
        body: "Real window cleaning covers the whole window, not just the glass in the middle.",
      },
      {
        title: "Safe at any height",
        body: "Ladders, water-fed poles, and proper training mean two-storey homes get the same finish as bungalows.",
      },
      {
        title: "More light, better views",
        body: "Clean glass genuinely brightens rooms. It is the fastest home refresh there is.",
      },
    ],
    process: [
      {
        title: "Quick quote",
        body: "Tell us your address and roughly how many windows. We quote within one business day, usually from a satellite view without needing a site visit.",
      },
      {
        title: "We show up on time",
        body: "You get a confirmation ahead of the visit. The crew arrives in PVS gear, walks the property with you if you are home, and gets to work.",
      },
      {
        title: "Glass, frames, sills, screens",
        body: "Exterior first, interior if booked, screens rinsed and re-seated. We leave the floors and gardens exactly as we found them.",
      },
      {
        title: "Walk-around finish",
        body: "We check every pane in the light before we call it done. Anything not perfect gets redone on the spot.",
      },
    ],
    crossSellNote:
      "Customers also book: gutter cleaning, house washing, and pressure washing on the same visit.",
  },

  "gutter-cleaning": {
    intro: [
      "Clogged gutters do quiet, expensive damage: water backing under shingles, staining siding, pooling against the foundation, and turning into ice dams by January. Cleaning them twice a year is the cheapest roof insurance you can buy.",
      "We scoop and bag every handful of debris, flush the downspouts until they run clear, and look over the whole system while we are up there. If a hanger is loose or a seam is starting to drip, you hear about it with a photo, not a surprise bill.",
      "Homes under mature trees in Pembroke and along the treed streets of Petawawa fill gutters faster than you would think. A spring and fall visit keeps everything moving.",
    ],
    benefits: [
      {
        title: "Full debris removal",
        body: "Everything comes out by hand and goes into bags, not onto your lawn or flower beds.",
      },
      {
        title: "Downspouts flushed and tested",
        body: "A clean trough with a plugged downspout is still a clogged system. We flush until water runs free.",
      },
      {
        title: "Eyes on your roofline",
        body: "Loose hangers, failing seams, shingle wear: we photograph what we see so small fixes stay small.",
      },
      {
        title: "Ice dam prevention",
        body: "Fall cleaning is the single best defence against winter ice damming in the Valley.",
      },
    ],
    process: [
      {
        title: "Free quote from your address",
        body: "Storey count and roofline length set the price. No site visit needed for most homes.",
      },
      {
        title: "Hand-cleaned, top to bottom",
        body: "We work off ladders with stand-offs that protect your gutters, scooping every run.",
      },
      {
        title: "Flush and inspect",
        body: "Downspouts get flushed, the system gets a once-over, and problem spots get photographed.",
      },
      {
        title: "Clean site, quick report",
        body: "Debris leaves with us. You get a short summary and any photos worth seeing.",
      },
    ],
    crossSellNote:
      "Customers also book: window cleaning and house washing while the crew is already on site.",
  },

  "pressure-washing": {
    intro: [
      "Years of grime come off a driveway in an afternoon. Pressure washing is the most satisfying service we offer: concrete goes from grey-black back to its real colour, walkways stop being slippery, and the whole front of the property suddenly looks cared for.",
      "The skill is in knowing how much pressure each surface can take. Concrete wants power. Interlock wants a lighter pass so the joint sand stays put. Wood decks want low pressure and the right cleaner. Our crews match the method to the material so nothing gets etched, stripped, or gouged.",
      "If you are prepping for a sale, hosting a summer event, or just tired of the green film on the patio, this is the fastest curb-appeal win in the Ottawa Valley.",
    ],
    benefits: [
      {
        title: "Driveways restored",
        body: "Oil spots, tire marks, moss and winter grime lift off. The colour underneath will surprise you.",
      },
      {
        title: "Right pressure, right surface",
        body: "Concrete, interlock, wood and composite each get the correct nozzle, pressure and cleaner.",
      },
      {
        title: "Safer footing",
        body: "Algae film on walkways and steps is a slip hazard. Washing it off protects the people you love.",
      },
      {
        title: "Eco-friendly cleaners",
        body: "Biodegradable solutions, and we rinse plantings before and after every job.",
      },
    ],
    process: [
      {
        title: "Quote by surface",
        body: "Tell us what needs washing: driveway, walkway, patio, deck, steps. We price by area, in writing.",
      },
      {
        title: "Prep and protect",
        body: "Furniture moved, plants rinsed, outlets and fixtures covered before the first pass.",
      },
      {
        title: "Wash and detail",
        body: "Even, overlapping passes with edges and corners done by hand where the machine cannot reach.",
      },
      {
        title: "Final rinse and reset",
        body: "Everything rinsed clean and put back. All that is left is the before-and-after difference.",
      },
    ],
    crossSellNote:
      "Customers also book: house washing and window cleaning to finish the whole exterior in one go.",
  },

  "house-washing": {
    intro: [
      "That green shadow creeping up your north-facing siding is algae, and it does not rinse off with a garden hose. Left alone it spreads, stains, and slowly eats at the finish. Soft washing takes it off completely and keeps it off for seasons, not weeks.",
      "Soft washing is the opposite of blasting. We apply a plant-safe cleaning solution at low pressure, let it do the work, and rinse the siding clean. Vinyl, aluminum, wood and stucco all come back bright without forcing water behind the cladding, which is precisely what high pressure on siding gets wrong.",
      "One visit typically covers siding, soffits, and fascia. Pair it with window cleaning and the whole house looks five years newer by supper time.",
    ],
    benefits: [
      {
        title: "Algae and mildew, gone",
        body: "The cleaning solution kills growth at the root instead of smearing it around, so results last.",
      },
      {
        title: "Gentle on siding",
        body: "Low pressure means no water driven behind cladding, no stripped finish, no loose trim.",
      },
      {
        title: "Plant-safe process",
        body: "Gardens and shrubs get rinsed before and after, and our cleaners are biodegradable.",
      },
      {
        title: "Whole-exterior refresh",
        body: "Siding, soffits and fascia in one visit. It is the biggest visual change per dollar we offer.",
      },
    ],
    process: [
      {
        title: "Walk-around quote",
        body: "Storey count and siding type set the price. Photos by text are enough for most quotes.",
      },
      {
        title: "Pre-rinse and prep",
        body: "Plants watered down, windows and fixtures checked, solution mixed for your siding type.",
      },
      {
        title: "Soft wash application",
        body: "Applied bottom-up for even coverage, dwell time respected, then rinsed top-down.",
      },
      {
        title: "Inspection with you",
        body: "We walk the house together at the end. Any missed spot gets treated before we pack up.",
      },
    ],
    crossSellNote:
      "Customers also book: window cleaning and gutter cleaning on the same visit for a complete exterior reset.",
  },

  "lawn-mowing": {
    intro: [
      "A great lawn is not about one heroic weekend. It is about showing up every week with sharp blades, crisp edges, and a crew that treats your yard like the front lawn of their own place. That is the service: you stop thinking about the lawn, and it starts looking better than it ever did.",
      "Every PVS mowing visit includes the full routine: cut at the right height for the season, string-trim around every obstacle, hard-edge the walks and drive, and blow every surface clean before we roll to the next stop. Weekly or bi-weekly, your choice, on a route schedule you can set your watch to.",
      "We also handle the bigger seasonal jobs that keep turf healthy in the Valley's climate: spring cleanups after the snow lets go, core aeration when the ground is compacted, overseeding to thicken thin spots, and dethatching when the lawn needs to breathe.",
    ],
    benefits: [
      {
        title: "The full routine, every visit",
        body: "Mow, trim, edge, blow. No skipped corners, no clippings on the driveway.",
      },
      {
        title: "Sharp blades, healthy grass",
        body: "Dull blades tear grass and brown the tips. We sharpen constantly so cuts heal clean.",
      },
      {
        title: "A schedule that holds",
        body: "Same crew, same day, all season. Rain delays get made up within 48 hours with a heads-up text.",
      },
      {
        title: "Season-long turf care",
        body: "Spring cleanup, aeration, overseeding and fall recovery available on the same account.",
      },
    ],
    process: [
      {
        title: "Pick your rhythm",
        body: "Weekly or bi-weekly. We recommend weekly through the fast-growth months of May and June.",
      },
      {
        title: "We build the route",
        body: "Your yard joins a route in your neighbourhood, which is how we keep pricing sharp.",
      },
      {
        title: "Cut, trim, edge, clean",
        body: "The full routine every visit, with the cut height adjusted through the season.",
      },
      {
        title: "Season bookends",
        body: "Optional spring cleanup to start the year and a fall cut-down to finish it.",
      },
    ],
    crossSellNote:
      "Customers also book: hedge trimming and landscaping refreshes, since the crew is already on your street.",
  },

  "hedge-trimming": {
    intro: [
      "Nothing says a property is looked after like a sharp hedge line. It is the pinstripe suit of curb appeal: crisp, level, and impossible to fake with a quick once-over. Our crews cut clean faces and square tops that hold their shape for months, then haul away every clipping.",
      "Good trimming is also plant care. Cedars, lilacs, spireas and junipers each want different timing and a different depth of cut, and cutting the wrong amount at the wrong time is how hedges thin out and die back. We time the work to the plant, so your hedge gets thicker and greener every year instead of slowly hollowing out.",
      "Whether it is a knee-high border, a privacy wall of cedars, or shrubs that have not been touched in five years, we bring the trimmers, the ladders, the tarps, and the eye for a straight line. You keep the compliments.",
    ],
    benefits: [
      {
        title: "Lines you can sight down",
        body: "Level tops and flat faces, checked by eye and by line. The difference is obvious from the street.",
      },
      {
        title: "Healthier plants",
        body: "Cuts timed to each species' growth cycle, so hedges thicken instead of thinning out.",
      },
      {
        title: "Total cleanup",
        body: "Tarps down before we start, every clipping raked, bagged, and hauled away when we finish.",
      },
      {
        title: "Overgrowth rescue",
        body: "Years-overgrown shrubs brought back in stages that the plant can actually survive.",
      },
    ],
    process: [
      {
        title: "Photo quote",
        body: "Text us a couple of photos of the hedge or shrubs and we will quote it within one business day.",
      },
      {
        title: "Timed to the plant",
        body: "We book the visit for the window that suits the species, usually late spring or mid-summer for cedars.",
      },
      {
        title: "Trim, shape, square",
        body: "Faces first, then tops, with lines checked as we go. Shrubs get shaped and deadwood pruned out.",
      },
      {
        title: "Rake, bag, gone",
        body: "The lawn under the hedge looks better than before we arrived. Clippings leave with us.",
      },
    ],
    crossSellNote:
      "Customers also book: lawn care, window cleaning, and gutter cleaning. One crew, one visit, one bill.",
  },

  "landscaping-services": {
    intro: [
      "Big curb appeal does not need a big contractor. Most yards are one solid weekend of skilled work away from looking completely different: beds re-edged and mulched, tired plants swapped for ones that thrive here, a heaved paver path re-set flat. That is exactly the size of job we love.",
      "We are already on your street mowing lawns and cleaning windows, which makes us the easy call for the projects that are too big for a Saturday but too small for a design-build firm. Garden bed refreshes, mulch top-ups, crisp bed edging, seasonal planting, sod patches, and small interlock repairs, quoted fast and done tidy.",
      "Every project gets a real crew, a real cleanup, and a finished look you can see from the road. No months-long waitlist, no drawings you did not ask for, no surprise extras on the invoice.",
    ],
    benefits: [
      {
        title: "Right-sized projects",
        body: "Bed refreshes, mulching, edging, planting, sod patches, and small paver and walkway repairs.",
      },
      {
        title: "Fast, honest quotes",
        body: "Photos or a 15-minute walk-around are enough. Written quote within a business day or two.",
      },
      {
        title: "Tidy crews",
        body: "Tarps for spoil, magnetic sweep for hardware, and a blow-down before we leave. Tidy is the brand.",
      },
      {
        title: "Plants that fit the Valley",
        body: "We plant what actually survives zone 4 winters and Garrison-area sandy soil, not what looked good in a catalogue.",
      },
    ],
    process: [
      {
        title: "Show us the space",
        body: "Photos by text or a quick site visit. Tell us the look you want and the budget you have in mind.",
      },
      {
        title: "Simple written scope",
        body: "One page: what we will do, what it costs, when we can start. No design fees.",
      },
      {
        title: "One clean build day",
        body: "Most refreshes finish in a day or two. Edges cut, fabric and mulch down, plants in, area swept.",
      },
      {
        title: "Easy upkeep after",
        body: "Add the beds to your lawn plan and the crew keeps edges crisp and weeds down all season.",
      },
    ],
    crossSellNote:
      "Customers also book: lawn care, hedge trimming, and window cleaning. We are probably on your street already.",
  },

  "fall-cleanup": {
    intro: [
      "Fall in the Valley is beautiful for about three weeks, and then it is all on your lawn. A proper fall cleanup clears every leaf and branch, cuts the grass down to winter height, and tidies the beds so the property goes into the snow looking sharp and comes out of it healthy.",
      "This is prevention as much as appearance. A leaf mat left over winter smothers turf and breeds snow mould, and overgrown grass mats flat under the first heavy snowfall. One thorough visit in late fall saves your lawn weeks of recovery in April.",
      "We launch fall cleanups this autumn across all our routes, and they pair naturally with a fall gutter cleaning and your seasonal snow contract: one visit, one crew, and the whole property is winterized.",
    ],
    benefits: [
      {
        title: "Every leaf, gone",
        body: "Raked, tarped, and hauled away, from the lawn, the beds, and the corners the wind stacks them in.",
      },
      {
        title: "Winter-height final cut",
        body: "The last mow of the year at the height that prevents matting and snow mould.",
      },
      {
        title: "Beds put to bed",
        body: "Perennials cut back, annuals cleared, and beds tidied so spring starts clean.",
      },
      {
        title: "One-stop winterizing",
        body: "Add gutter cleaning and snow-contract staking to the same visit and be done with fall in an afternoon.",
      },
    ],
    process: [
      {
        title: "Book your window",
        body: "Reserve in September or early October. We schedule cleanups after the main leaf drop for your street.",
      },
      {
        title: "Clear and cut",
        body: "Leaves and debris off every surface, then the final cut at winter height with crisp edges.",
      },
      {
        title: "Beds and haul-away",
        body: "Cut-backs done, everything loaded and hauled. No curb bags for you to wrestle.",
      },
      {
        title: "Winter-ready walkthrough",
        body: "We leave the property staked (if you have a snow contract) and photo-documented.",
      },
    ],
    crossSellNote:
      "Customers also book: fall gutter cleaning and seasonal snow contracts on the same account.",
  },

  "snow-removal": {
    intro: [
      "Valley winters do not negotiate. When 30 centimetres lands overnight, you either dig for an hour before work or you watch a PVS tractor clear the driveway from your kitchen window with a coffee in hand. We know which morning we would pick.",
      "Our seasonal contracts cover your driveway, apron and walkways for the whole winter at one flat rate: unlimited visits during qualifying snowfalls, priority routing for contract customers, and salt available for ice days. Tractor-mounted snowblowers mean clean, tight passes that do not bury your lawn or mailbox.",
      "Contracts are capped per route so the machine is never too far away mid-storm. Routes fill up before the first flake flies, and early birds get the best rate of the year: sign before August 14 and take 15 percent off with code EARLYBIRD15.",
    ],
    benefits: [
      {
        title: "One flat rate, all winter",
        body: "No per-storm math, no invoices in February. One price covers every qualifying snowfall.",
      },
      {
        title: "Cleared before you need out",
        body: "Routes run through the storm and after it, prioritized so driveways are open for the morning commute.",
      },
      {
        title: "Tractor-blower precision",
        body: "Snow gets thrown where it belongs, not piled into windrows across your lawn or the end of the drive.",
      },
      {
        title: "Walkways and salt available",
        body: "Add shovelled steps and walkways or ice-day salting to any contract.",
      },
    ],
    process: [
      {
        title: "Lock in your spot",
        body: "Request a quote with your address and driveway type. Before August 14, code EARLYBIRD15 takes 15 percent off.",
      },
      {
        title: "Stakes go in before freeze-up",
        body: "We mark your driveway edges in the fall so the operator knows your property in a whiteout.",
      },
      {
        title: "We watch the sky",
        body: "Qualifying snowfall triggers your route automatically. No calling, no booking, no apps to check.",
      },
      {
        title: "Cleared until spring",
        body: "Storm after storm, the driveway is open. Stakes come out with the thaw.",
      },
    ],
    crossSellNote:
      "Customers also book: walkway clearing as an add-on, and summer lawn care on the same account.",
  },
};

export function getServiceCopy(slug: string): ServiceCopy | undefined {
  return serviceCopy[slug];
}

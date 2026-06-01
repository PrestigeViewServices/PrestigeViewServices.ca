/**
 * FAQ items grouped by surface. Each item renders both as visible accordion
 * content AND as FAQPage JSON-LD so Google can show rich snippets in search
 * results. Keep questions short, scannable, and locally-flavoured.
 */
export type FaqItem = {
  q: string;
  a: string;
};

export const homeFaqs: FaqItem[] = [
  {
    q: "What areas of the Ottawa Valley does Prestige View Services cover?",
    a: "We're based in Petawawa and run regular crews across Pembroke, Deep River, Chalk River, Cobden, Renfrew, Arnprior, and Eganville. If your address is in the Valley, give us a call — we'll let you know the next available visit.",
  },
  {
    q: "Do you offer recurring lawn or snow plans, or just one-off jobs?",
    a: "Both. Most Petawawa and Pembroke customers go with a recurring plan (weekly or bi-weekly mowing in summer, seasonal snow contracts in winter) for the better pricing and locked-in slot. One-off jobs are welcome too.",
  },
  {
    q: "How fast can I get a quote?",
    a: "Free quotes are returned within one business day, often the same day. Use the Get a Free Quote button or call (613) 334-5858.",
  },
  {
    q: "Are you insured?",
    a: "Yes — every PVS crew is fully insured for both residential and small commercial work across the Ottawa Valley.",
  },
  {
    q: "Can I bundle multiple services?",
    a: "Yes, and you should. Bundling window cleaning, gutter cleaning, and pressure washing on the same visit saves on the trip charge. Snow contracts can roll over to lawn care in spring on a single account.",
  },
  {
    q: "How do I pay?",
    a: "We accept e-transfer, credit card, and cheque. Recurring customers are invoiced after each visit; one-off jobs are paid on completion.",
  },
];

export const serviceFaqs: Record<string, FaqItem[]> = {
  "window-cleaning": [
    {
      q: "How often should I have my windows cleaned in Petawawa or Pembroke?",
      a: "Twice a year is the sweet spot — once in spring after pollen drops and once in fall after the leaves come down. Homes near gravel roads or with mature trees often benefit from quarterly cleaning.",
    },
    {
      q: "Do you clean both inside and outside?",
      a: "Yes. Interior + exterior is the default booking. Exterior-only is available if you'd rather handle the inside yourself.",
    },
    {
      q: "What's the streak-free guarantee?",
      a: "If you see a streak after we leave, call within 48 hours and we come back at no charge. Simple.",
    },
  ],
  "lawn-mowing": [
    {
      q: "Weekly or bi-weekly — which should I pick?",
      a: "Weekly is better for healthy turf and crisp lines. Bi-weekly is fine for slower-growing lawns or drier July weeks. Most Petawawa & Pembroke customers run weekly May–June and switch to bi-weekly July–August.",
    },
    {
      q: "Do you do edging and cleanup?",
      a: "Always — every visit includes string-trim, hard-edge, and a blow-clean of walkways and the drive. No extra charge.",
    },
    {
      q: "What happens if it rains on my scheduled day?",
      a: "We reschedule to the next clear day on your route — usually within 24–48 hours. You'll get a heads-up text.",
    },
  ],
  "snow-removal": [
    {
      q: "How do seasonal snow contracts work in the Ottawa Valley?",
      a: "One flat winter rate covers unlimited qualifying storms from November through April. Your driveway gets priority routing so you're cleared before you need to leave for work.",
    },
    {
      q: "How early do you clear driveways?",
      a: "Our standard windows are pre-7am clearings during weekday storms so you're out the door on time. After-hours storms are cleared as soon as the route opens up.",
    },
    {
      q: "Do you salt or sand?",
      a: "Salt application is available as an add-on on every visit. For walkways and steps, we include grit on icy days by default.",
    },
  ],
  "gutter-cleaning": [
    {
      q: "When should I clean my gutters in Pembroke / Petawawa?",
      a: "Late October or early November (after most leaves drop) is the biggest one. A second clean in early spring catches winter debris before the first heavy rain.",
    },
    {
      q: "Do you hand-clean or just blow them out?",
      a: "Hand-cleaned, downspouts flushed, and we leave you a quick visual inspection of any gutter that needs re-securing.",
    },
    {
      q: "Do you do gutter guards or repairs?",
      a: "Yes — minor re-fastening is included. Larger repairs or guard installs are quoted separately.",
    },
  ],
  "pressure-washing": [
    {
      q: "Pressure or soft wash — what's the difference?",
      a: "Pressure for hard surfaces (driveway, walkway, patio). Soft wash for siding, soffits, and decks where high pressure would damage the finish. We pick the right one per surface.",
    },
    {
      q: "Is the cleaner safe for plants and pets?",
      a: "Yes — we use eco-friendly, biodegradable solutions and rinse plantings thoroughly before and after.",
    },
  ],
  "spring-cleanup": [
    {
      q: "When's the best time for a spring cleanup in the Ottawa Valley?",
      a: "As soon as the ground has thawed and most of the snow is gone — usually mid-April to early May in Petawawa and Pembroke. Earlier is better since it sets up a healthier first mow.",
    },
    {
      q: "What's included in a spring cleanup?",
      a: "Winter debris and leaf removal, bed edging and cleanup, a first cut, blow-down of walkways and the drive, and full hauling. We leave the property ready for the mowing season.",
    },
    {
      q: "Do I need a spring cleanup if I already have a lawn-mowing plan?",
      a: "Usually yes for the first visit — the winter mess is more than a regular mow can handle. After that, your recurring lawn plan takes over.",
    },
  ],
  "aeration": [
    {
      q: "When should I aerate my lawn?",
      a: "Spring or fall, when the lawn is actively growing. Fall is often best in the Ottawa Valley — the lawn recovers fast and aeration sets up healthier turf for next year.",
    },
    {
      q: "How often do I need to aerate?",
      a: "Once a year for most lawns. High-traffic yards (kids, pets, heavy clay soils) benefit from twice a year.",
    },
    {
      q: "Should I overseed after aerating?",
      a: "If your lawn has thin spots, yes — the aeration holes are perfect for seed-to-soil contact. We usually book both on the same visit.",
    },
  ],
  "dethatching": [
    {
      q: "What's thatch and why does it matter?",
      a: "Thatch is the dead-grass layer that builds up between your soil and the green blades. A thick layer blocks water, air, and nutrients. Dethatching opens the lawn back up.",
    },
    {
      q: "When should I dethatch?",
      a: "Early spring (before the first big push of growth) or early fall. Avoid mid-summer heat.",
    },
  ],
  "overseeding": [
    {
      q: "What's overseeding?",
      a: "Spreading new seed over an existing lawn to thicken thin spots, repair damage, and improve colour. Best done after aeration so the seed reaches soil.",
    },
    {
      q: "How long until I see new grass?",
      a: "7–14 days for germination, full coverage in about 4–6 weeks. Watering matters — we leave you a simple plan.",
    },
  ],
  "property-maintenance": [
    {
      q: "What's a property maintenance plan?",
      a: "One recurring schedule that bundles your mow, edge, cleanup, and seasonal switch-overs (e.g. spring cleanup to mowing to snow contract) under one account and one bill.",
    },
    {
      q: "Can I add window cleaning or pressure washing to it?",
      a: "Yes — most Petawawa and Pembroke customers add a spring window-and-gutter package plus a mid-summer pressure wash. We coordinate so trips and pricing both work in your favour.",
    },
  ],
  "house-washing": [
    {
      q: "What's the difference between house washing and pressure washing?",
      a: "House washing is a soft-wash technique that uses low pressure plus a cleaning solution — safe for siding, soffits, and stucco. Pressure washing uses high pressure for hard surfaces like driveways and patios.",
    },
    {
      q: "Will it damage my siding or plants?",
      a: "No — soft wash is specifically designed for siding. We pre-rinse plantings, use plant-safe cleaners, and rinse again after.",
    },
    {
      q: "How often should I wash my home exterior?",
      a: "Every 1–3 years for most Ottawa Valley homes. Wooded lots and homes near gravel roads benefit from yearly washes.",
    },
  ],
  "property-touch-ups": [
    {
      q: "What counts as a property touch-up?",
      a: "Small exterior fixes that aren't worth booking a tradesman for — re-seating a loose downspout, replacing a worn weatherstrip, touching up paint, re-fastening trim. Goes on the same visit as a window or gutter clean.",
    },
    {
      q: "How do I know if my touch-up qualifies?",
      a: "Send a photo via the contact form and we'll confirm before booking. Anything bigger we'll refer to a trusted local trade.",
    },
  ],
  "junk-removal": [
    {
      q: "Can I get same-day junk removal in Petawawa or Pembroke?",
      a: "Often yes — same-day depends on the route, but next-day is almost always possible. Send photos via the contact form for the fastest quote.",
    },
    {
      q: "What can you take?",
      a: "Appliances, furniture, yard debris, renovation waste, and most household items. We don't take hazardous waste, paint, or anything regulated for disposal.",
    },
    {
      q: "Where does the junk go?",
      a: "Donation-eligible items go to local charities. Recyclable materials go to the appropriate depot. The rest goes to the transfer station — we keep landfill volume as low as we can.",
    },
  ],
  "property-cleanouts": [
    {
      q: "How long does a property cleanout take?",
      a: "Most single-family cleanouts (garage, basement, estate) are done in a day. Larger or multi-trip jobs are quoted by the volume.",
    },
    {
      q: "Do you sort items before disposal?",
      a: "Yes — donations and recycling are separated and routed before anything heads to the transfer station. Itemized receipt available on request.",
    },
  ],
  "seasonal-snow-contract": [
    {
      q: "What's covered under a seasonal snow contract?",
      a: "Unlimited qualifying storms from November through April for one flat winter rate. Driveway clearing, priority routing, and walkway clearing on every visit if added.",
    },
    {
      q: "When should I sign up?",
      a: "Before the first snowfall — usually September or October in the Ottawa Valley. Routes fill up fast and signing late means we may not have a slot.",
    },
    {
      q: "What if it's a mild winter?",
      a: "The flat rate is the trade-off for guaranteed service in heavy years. Most Petawawa and Pembroke winters land in our favour for the customer — but the peace of mind is the real value.",
    },
  ],
  "walkway-clearing": [
    {
      q: "Do I need walkway clearing if I already have a snow contract?",
      a: "It's an add-on. Plowing handles the drive; walkway clearing covers steps, front walks, and entries — usually shoveled and salted on the same visit.",
    },
    {
      q: "Do you salt or sand?",
      a: "Grit on icy days is included with walkway clearing. Full salt application is available as an add-on for the driveway too.",
    },
  ],
};

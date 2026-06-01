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
};

/**
 * The Ottawa Valley Property Calendar: what a Valley property actually needs
 * month by month. Powers the interactive /seasonal-planner page.
 *
 * Rules: no internal division names, no em dashes, no published prices.
 * Task serviceSlug values must exist in lib/content/services.ts (they render
 * as links to the matching service page); tasks without a slug are DIY tips.
 */

export type SeasonalTask = {
  label: string;
  detail: string;
  /** Optional service page this task links to. */
  serviceSlug?: string;
};

export type SeasonalMonth = {
  /** 1-12 */
  month: number;
  name: string;
  season: "winter" | "spring" | "summer" | "fall";
  /** Short, fun one-liner describing what the Valley is doing this month. */
  vibe: string;
  /** Sam's one-liner for the month. */
  samSays: string;
  tasks: SeasonalTask[];
};

export const seasonalMonths: SeasonalMonth[] = [
  {
    month: 1,
    name: "January",
    season: "winter",
    vibe: "Deep freeze. The Valley is quiet, the driveways are not.",
    samSays:
      "Squeak-squeak snow means deep cold. Keep the ice melt by the door, not in the shed.",
    tasks: [
      {
        label: "Watch the rooflines",
        detail:
          "Long icicles over one gutter run usually mean a blockage or an ice dam forming behind them. Note the spot now, deal with it at the first thaw.",
      },
      {
        label: "Keep vents and meters clear",
        detail:
          "After each storm, check that furnace exhausts, dryer vents, and the gas meter are not buried in thrown snow.",
      },
      {
        label: "Storm-by-storm clearing",
        detail:
          "Mid-season snow help is possible when routes have room. If shovelling is wearing thin, ask about a partial-season spot.",
        serviceSlug: "snow-removal",
      },
    ],
  },
  {
    month: 2,
    name: "February",
    season: "winter",
    vibe: "Statistically the snowiest stretch. The banks are taller than the kids.",
    samSays:
      "February is when a snow contract pays for itself. Also when I drink the most hot chocolate.",
    tasks: [
      {
        label: "Manage the melt path",
        detail:
          "On thaw days, chip channels through banked snow so meltwater runs away from the foundation instead of pooling at the door.",
      },
      {
        label: "Mind the deck load",
        detail:
          "Heavy wet snow stacks up fast on decks and flat roofs. Clearing a deck after each big dump beats one heroic shovel session in March.",
      },
      {
        label: "Book spring work early",
        detail:
          "Spring cleanup and window cleaning calendars start filling in February. Booking now gets the early-April slots.",
        serviceSlug: "spring-cleanup",
      },
    ],
  },
  {
    month: 3,
    name: "March",
    season: "spring",
    vibe: "The big melt. Everything winter hid is suddenly visible, and damp.",
    samSays:
      "The snow leaves, the sand stays. March is basically the Valley taking off its boots.",
    tasks: [
      {
        label: "Walk the property",
        detail:
          "Do a lap as the snow retreats: winter-killed turf, heaved pavers, bent downspouts, plow damage at the lawn edge. A photo list now makes April painless.",
      },
      {
        label: "Redirect the meltwater",
        detail:
          "Make sure downspout extensions are back on and pointing away from the foundation before the April rains double the volume.",
      },
      {
        label: "First gutter check",
        detail:
          "Gutters that went into winter full are now thawing into a soggy mess. An early clean protects the fascia during melt season.",
        serviceSlug: "gutter-cleaning",
      },
    ],
  },
  {
    month: 4,
    name: "April",
    season: "spring",
    vibe: "Cleanup month. The Valley wakes up hungry.",
    samSays:
      "Rake gently, mow patiently, and never trust an April forecast more than three days out.",
    tasks: [
      {
        label: "Spring cleanup",
        detail:
          "Rake out matted winter debris, clear the beds, and cut back last year's growth so the lawn and gardens can actually breathe.",
        serviceSlug: "spring-cleanup",
      },
      {
        label: "First cut, done right",
        detail:
          "Wait until the ground firms up, then take the first mow slightly shorter to clear winter growth. Sandy Petawawa lawns move fast from here.",
        serviceSlug: "lawn-mowing",
      },
      {
        label: "Pressure wash the winter off",
        detail:
          "Driveways and walkways are wearing five months of sand and salt. One wash brings the hardscape back to its real colour.",
        serviceSlug: "pressure-washing",
      },
    ],
  },
  {
    month: 5,
    name: "May",
    season: "spring",
    vibe: "Everything blooms, everything pollens. Windows go yellow overnight.",
    samSays:
      "Pollen season is my busiest squeegee month. The glass never stood a chance.",
    tasks: [
      {
        label: "Post-pollen window clean",
        detail:
          "Once the first big pollen drop settles, a full window clean keeps the glass bright into summer. Frames, sills, and screens included.",
        serviceSlug: "window-cleaning",
      },
      {
        label: "Mulch and edge the beds",
        detail:
          "Fresh mulch and a crisp bed edge is the highest-impact curb appeal hour of the year, and it holds moisture for the dry months coming.",
        serviceSlug: "landscaping-services",
      },
      {
        label: "Set the mowing schedule",
        detail:
          "Growth peaks now. Weekly cuts with sharp blades set up the lawn to survive July, and a recurring slot locks your route day.",
        serviceSlug: "lawn-mowing",
      },
    ],
  },
  {
    month: 6,
    name: "June",
    season: "summer",
    vibe: "Peak growing season. Hedges gain an inch a week and act like it.",
    samSays:
      "First hedge trim of the year goes after the spring flush. Cedar rules the Valley, and cedar likes a schedule.",
    tasks: [
      {
        label: "First hedge trim",
        detail:
          "Cedars get their first shaping after the spring growth flush. Cut now and the hedge holds its line most of the summer.",
        serviceSlug: "hedge-trimming",
      },
      {
        label: "Soft wash the siding",
        detail:
          "Warm, humid weather is when algae blooms on shaded walls. A June soft wash keeps the green film from getting established.",
        serviceSlug: "house-washing",
      },
      {
        label: "Raise the mower deck",
        detail:
          "Start stepping the cut height up before the heat arrives. Tall grass shades its own roots, which matters enormously on sand.",
      },
    ],
  },
  {
    month: 7,
    name: "July",
    season: "summer",
    vibe: "Heat on sand. The month that separates the green lawns from the crispy ones.",
    samSays:
      "Water deep, mow tall, and park the fertilizer. July lawns want shade and patience, not snacks.",
    tasks: [
      {
        label: "Water deeply, less often",
        detail:
          "Sandy soil drains straight through a daily sprinkle. One or two deep, early-morning waterings a week reaches the roots and trains them downward.",
      },
      {
        label: "Hold the cut height",
        detail:
          "Three inches minimum through the heat. If the lawn browns anyway it is usually dormancy, not death, and it returns with the August rains.",
        serviceSlug: "lawn-mowing",
      },
      {
        label: "Mid-summer gutter check under pines",
        detail:
          "Heavy pine cover around Black Bay and the Point drops needles all summer. A mid-season clean keeps the downspouts moving.",
        serviceSlug: "gutter-cleaning",
      },
    ],
  },
  {
    month: 8,
    name: "August",
    season: "summer",
    vibe: "Late summer. Smart Valley homeowners are already thinking about snow.",
    samSays:
      "The early bird gets the snow route. The late bird gets a shovel. Book the winter before the winter books you.",
    tasks: [
      {
        label: "Reserve your snow pass",
        detail:
          "Seasonal snow routes are capped and fill well before the first flake. Early reservations get the best rates and route positions.",
        serviceSlug: "snow-removal",
      },
      {
        label: "Plan fall lawn repair",
        detail:
          "Late August through September is the best germination window of the year. Line up aeration and overseeding now for the cool nights ahead.",
        serviceSlug: "aeration",
      },
      {
        label: "Second hedge touch-up",
        detail:
          "A light mid-summer pass restores razor lines and lets cuts heal well before winter.",
        serviceSlug: "hedge-trimming",
      },
    ],
  },
  {
    month: 9,
    name: "September",
    season: "fall",
    vibe: "The most important lawn month of the year. Fall builds next summer's yard.",
    samSays:
      "Spring lawns are made in September. That is the whole secret. Tell no one.",
    tasks: [
      {
        label: "Aerate and overseed",
        detail:
          "Open the soil, seed into the holes, and let warm soil plus cool nights do the work. Nothing you do in spring comes close.",
        serviceSlug: "overseeding",
      },
      {
        label: "Fall feeding",
        detail:
          "A fall fertilizer builds root reserves for winter and gives the first green-up of spring a head start.",
      },
      {
        label: "Book the fall gutter clean",
        detail:
          "Get on the list for after the leaves finish. The fall clean is the one that cannot be skipped in the Valley.",
        serviceSlug: "gutter-cleaning",
      },
    ],
  },
  {
    month: 10,
    name: "October",
    season: "fall",
    vibe: "Leaves down, temperature dropping, the last comfortable work window.",
    samSays:
      "October is the closing shift. Do the boring jobs now and February-you will send October-you a thank-you card.",
    tasks: [
      {
        label: "Fall cleanup",
        detail:
          "Heavy wet leaves left on turf smother it by spring. Clear the lawn and beds, and mulch the light layers back in as free feeding.",
        serviceSlug: "fall-cleanup",
      },
      {
        label: "Final mow, slightly lower",
        detail:
          "Drop the height a notch for the last cut so the lawn goes into winter without long matted blades that invite snow mould.",
        serviceSlug: "lawn-mowing",
      },
      {
        label: "Last call: exterior washing",
        detail:
          "Washing season ends with the frost. A fall window and siding clean means you look at bright glass all winter.",
        serviceSlug: "window-cleaning",
      },
    ],
  },
  {
    month: 11,
    name: "November",
    season: "fall",
    vibe: "Freeze-up. The ground closes for the season, ready or not.",
    samSays:
      "Stakes in before the ground freezes. A staked driveway in a whiteout is worth its weight in hot chocolate.",
    tasks: [
      {
        label: "Stake the driveway",
        detail:
          "Markers go in before freeze-up: the mouth, both edges, and anything invisible under snow like curbs, bed borders, and the water shutoff.",
      },
      {
        label: "Final gutter clean",
        detail:
          "After the last leaves and before the deep freeze: whatever stays in the trough now is frozen in place until March.",
        serviceSlug: "gutter-cleaning",
      },
      {
        label: "Confirm the winter plan",
        detail:
          "Snow contracts are finalized, stakes are placed, and routes lock in. If you are on the fence, this is the last comfortable exit.",
        serviceSlug: "snow-removal",
      },
    ],
  },
  {
    month: 12,
    name: "December",
    season: "winter",
    vibe: "Winter operations begin. Storm routes run while the town sleeps.",
    samSays:
      "First real storm always lands the week everyone is busiest. Funny how that works. Stay cozy, we have got the driveway.",
    tasks: [
      {
        label: "Ice management basics",
        detail:
          "Plain rock salt quits in deep cold. Keep a chloride blend for cold snaps and sand for traction, and sweep leftovers off dry concrete.",
      },
      {
        label: "Clear snow off gas and dryer vents",
        detail:
          "After every storm, a thirty-second check of vents and meters is the cheapest safety habit of the winter.",
      },
      {
        label: "Storm-response clearing",
        detail:
          "Driveways on contract clear automatically through each storm, with a cleanup pass behind the city plow.",
        serviceSlug: "snow-removal",
      },
    ],
  },
];

export function getMonth(month: number): SeasonalMonth {
  return seasonalMonths.find((m) => m.month === month) ?? seasonalMonths[0];
}

/**
 * Unique copy for the town × service combination pages, keyed
 * "<serviceSlug>/<areaSlug>". Every entry is written from scratch for that
 * exact pairing: the anti-doorway-page layer. Combos without an entry fall
 * back to the compact template.
 *
 * Rules: no internal division names, no em dashes, no paragraph reuse
 * between entries. Petawawa entries lead with the military angle.
 */

export type LocalCopy = {
  /** 2 unique intro paragraphs for this service-in-town page. */
  intro: string[];
  /** 1-2 town-specific FAQs, also emitted as FAQPage JSON-LD. */
  faqs?: { q: string; a: string }[];
};

export const localCopy: Record<string, LocalCopy> = {
  // ---------------- WINDOW CLEANING ----------------
  "window-cleaning/petawawa": {
    intro: [
      "Petawawa is our home town, and window cleaning here comes with the discount we are proudest of: serving members, veterans, and military families save on every visit. From PMQs near the base to the big riverfront panes out at Black Bay, the crew that shows up is the same one your neighbours already know.",
      "Base-area homes deal with a specific kind of grime: dust off the training areas and hard water spotting from sprinklers. We clean glass, frames, sills, and screens by hand, so the film actually comes off instead of moving around.",
    ],
    faqs: [
      {
        q: "Do military families get a discount on window cleaning in Petawawa?",
        a: "Yes. Serving members, veterans, military families, and first responders save 10% on window cleaning and every other PVS service. Mention your connection to the Garrison when you book.",
      },
      {
        q: "Can you clean my windows while I'm away on tasking?",
        a: "Absolutely. Exterior cleans don't need anyone home, we send photos when the job is done, and billing is handled by e-transfer or card on file.",
      },
    ],
  },
  "window-cleaning/pembroke": {
    intro: [
      "Pembroke's older homes have the best windows in the Valley and the hardest ones to keep clean: tall double-hungs, storm panes, and wood frames that deserve better than a rushed squeegee. Our crews hand-detail heritage glass downtown and around the older streets, and switch to water-fed poles for the two-storey vinyl builds out west.",
      "Spring pollen off the mature maples and fall grime are the two big window events in Pembroke. Most customers here book exactly those two visits and stay bright all year.",
    ],
    faqs: [
      {
        q: "Can you handle storm windows and older frames in Pembroke?",
        a: "Yes. We remove and clean storm panes where they are designed to come out, hand-wash the primary glass, and dry the frames so old paint and glazing stay intact.",
      },
    ],
  },
  "window-cleaning/laurentian-valley": {
    intro: [
      "Big township lots mean big windows: picture windows facing the fields, patio walls onto the deck, and dormers you have not been able to reach since the house was built. Our Laurentian Valley window routes run right alongside the Pembroke ones, so acreage homes get the same scheduled service as town addresses.",
      "Open exposure is the local challenge. Wind-driven dust and pollen film windows faster out here than in town, especially on the weather side. A spring and fall clean keeps the view worth the property taxes.",
    ],
    faqs: [
      {
        q: "Do you charge more for window cleaning on rural Laurentian Valley properties?",
        a: "No. Pricing is by window count and height, not by address. The township rides on our daily Pembroke routes, so there is no rural surcharge.",
      },
    ],
  },
  "window-cleaning/deep-river": {
    intro: [
      "Windows in Deep River fight the river. Moist air off the Ottawa carries fine residue that dries onto glass, and homes along Riverside Drive and near the waterfront show it within weeks of a DIY clean. Professional tools and pure-water rinsing get the film off and keep it off longer.",
      "We route Deep River weekly through the season, so spring and fall window packages line up with gutter visits. One crew, one stop, the whole exterior handled while you are at work.",
    ],
    faqs: [
      {
        q: "Why do river-facing windows in Deep River get dirty so fast?",
        a: "Humidity off the river carries minerals and organics that settle on glass and dry into a haze. It is worst on water-facing panes. Professional cleaning removes it fully, which slows how fast it rebuilds.",
      },
    ],
  },
  "window-cleaning/chalk-river": {
    intro: [
      "Chalk River window cleaning rides our Deep River routes, which means rural addresses off the Highway 17 corridor get scheduled service instead of a some-week-maybe visit. Year-round homes and cottages toward Manitou Lake both make the run.",
      "Treed lots are beautiful and terrible for glass: pollen in June, sap flecks in high summer, and spider webbing in every corner by fall. We clean glass, frames, sills, and screens so the whole window looks new, not just the middle of it.",
    ],
    faqs: [
      {
        q: "Do you clean cottage windows near Chalk River seasonally?",
        a: "Yes. Plenty of Manitou Lake area cottages book an opening clean in spring and a closing clean in fall, timed with our regular Chalk River runs.",
      },
    ],
  },
  "window-cleaning/renfrew": {
    intro: [
      "Renfrew's century homes around Plaunt Street and the downtown core carry original glass that rewards careful hands: wavy panes, wood muntins, and frames that need drying, not drowning. Our crews detail them properly, then handle the town's newer builds with modern water-fed equipment on the same route day.",
      "Because Renfrew is a scheduled weekly route for us, window packages here are easy to pair with gutter cleaning, and most customers book both for the same visit.",
    ],
    faqs: [
      {
        q: "Is Renfrew too far for regular window cleaning service?",
        a: "Not at all. Renfrew is one of our standing weekly routes, so recurring spring and fall window cleaning holds a schedule just like it does in Petawawa.",
      },
    ],
  },

  // ---------------- GUTTER CLEANING ----------------
  "gutter-cleaning/petawawa": {
    intro: [
      "Gutter cleaning in Petawawa comes with our military and veteran discount, and with a crew that knows the town's rooflines street by street. The tall pines around Black Bay and Petawawa Point drop needles all season long, which pack into gutters tighter than leaves ever do.",
      "For families juggling postings and deployments, we make this the easiest chore to hand off: no one needs to be home, debris leaves with us, and you get photos of the clean troughs and any spots worth watching.",
    ],
    faqs: [
      {
        q: "How often do Petawawa homes near the pines need gutter cleaning?",
        a: "Homes under pine cover around Black Bay and the Point usually need spring and fall visits, and heavy-cover properties benefit from a third. Needles compact and hold water worse than leaves, so they can't wait for spring.",
      },
      {
        q: "Does the military discount apply to gutter cleaning?",
        a: "Yes. The discount applies to every PVS service, gutter cleaning included. Mention your service when you request the quote.",
      },
    ],
  },
  "gutter-cleaning/pembroke": {
    intro: [
      "If your Pembroke street has those gorgeous mature maples, your gutters are working harder than almost any in the Valley. Older brick homes downtown carry deep eaves and original troughs that fill fast and overflow onto fascia and foundation plantings when they do.",
      "We hand-clean every run, flush the downspouts, and photograph anything that needs attention, which on older Pembroke homes is often a seam or a hanger that a ten-dollar fix keeps from becoming a fascia repair.",
    ],
    faqs: [
      {
        q: "My Pembroke home overflows at one corner every rain. Can you fix that?",
        a: "Usually the culprit is a packed downspout elbow or a low spot in the run. We flush the system, find the blockage, and re-fasten or re-slope where the fix is minor. Bigger repairs get flagged with photos first.",
      },
    ],
  },
  "gutter-cleaning/laurentian-valley": {
    intro: [
      "Township homes carry long gutter runs, and long runs hide problems: one plugged elbow can back water up thirty feet of trough before you spot it from the ground. Our Laurentian Valley visits cover the full system on homes, garages, and outbuildings in one stop.",
      "Fall out here is the main event. Open-country wind strips the trees fast and fills gutters in a weekend, so we time township routes for after the big drop, then check downspouts are running clear before freeze-up.",
    ],
    faqs: [
      {
        q: "Can you do the gutters on my shop or barn as well?",
        a: "Yes. Outbuildings are normal work in Laurentian Valley. We quote the house and any garages, shops, or barns together, and clean them in the same visit.",
      },
    ],
  },
  "gutter-cleaning/deep-river": {
    intro: [
      "Deep River's tall pines are relentless: needles year-round, cones in the fall, and gutters that can be full again six weeks after a clean. Add the freeze-thaw swings coming off the river and clogged troughs turn into ice dams faster here than almost anywhere on our routes.",
      "Our crews scoop by hand, flush every downspout, and check hangers while they are up there. For heavily treed properties around Holm Park we recommend spring, mid-fall, and late-fall visits, and we will tell you honestly if your home only needs two.",
    ],
    faqs: [
      {
        q: "When should Deep River gutters be cleaned before winter?",
        a: "Late fall, after the needles and leaves have mostly finished dropping and before the first hard freeze. A clear system going into winter is the best ice-dam prevention there is.",
      },
    ],
  },
  "gutter-cleaning/chalk-river": {
    intro: [
      "Bush lots around Chalk River mean gutters catch everything: leaves, needles, keys, and the odd tennis ball. Because our visits ride the Deep River route, rural homes here get scheduled spring and fall cleans instead of waiting for a crew to be in the area.",
      "Metal roofs are common on Chalk River homes and cottages, and they shed into gutters at speed. We re-seat what the snow slides knock loose and make sure the troughs are ready to drink the spring melt.",
    ],
    faqs: [
      {
        q: "Do you service seasonal cottages near Chalk River?",
        a: "Yes. Cottage owners book a spring clean at opening and a late-fall clean at closing, and we coordinate access so you don't need to make a special trip out.",
      },
    ],
  },
  "gutter-cleaning/renfrew": {
    intro: [
      "The century homes around Renfrew's core have steep roofs, high eaves, and gutters that have seen a hundred springs. They need a crew with proper ladders and stand-offs, not a homeowner balancing on the porch roof. That is us, in town on a scheduled weekly route.",
      "We clean every run by hand, flush the downspouts, and send photos of anything age is catching up with, so a loose hanger gets fixed for pocket change instead of pulling a run of trough off the fascia in a thaw.",
    ],
    faqs: [
      {
        q: "Can you reach the high gutters on my two-and-a-half-storey Renfrew home?",
        a: "Yes. Tall century homes are standard work for us. We carry the ladder heights for high Victorian eaves and use stand-offs so the gutters themselves never take our weight.",
      },
    ],
  },
  // ---------------- PRESSURE WASHING ----------------
  "pressure-washing/petawawa": {
    intro: [
      "Petawawa driveways earn their grime: sand and grit from base traffic, winter salt, and hot summers that bake it all in. A pressure wash brings concrete and interlock back to their real colour in an afternoon, and the military and veteran discount applies here like everywhere else at PVS.",
      "We wash a lot of PMQ and rental move-outs in this town. If you are posting out and the driveway, walkway, and patio need to look like inspection day, one visit handles it.",
    ],
    faqs: [
      {
        q: "Can you pressure wash before a posting-season move-out in Petawawa?",
        a: "Yes, and July is our busiest month for exactly that. Book a week or two ahead of your out-clearance date and the driveway, walks, and patio will show like new.",
      },
    ],
  },
  "pressure-washing/pembroke": {
    intro: [
      "Pembroke's older neighbourhoods hide beautiful hardscape under years of buildup: brick walkways, concrete steps, and stone porches that come back to life under the right pressure and the right technique. The west end's bigger modern driveways are a straight power job. We do both, correctly.",
      "Moss loves the shaded north sides of Pembroke's mature streets. It is slippery on stairs and destructive in mortar joints, and washing it off each spring is cheaper than repointing later.",
    ],
    faqs: [
      {
        q: "Will pressure washing damage the mortar on my older Pembroke walkway?",
        a: "Not the way we do it. Aged mortar and brick get lower pressure, wider fan tips, and more dwell time with the cleaner, which lifts the grime without chewing the joints.",
      },
    ],
  },
  "pressure-washing/laurentian-valley": {
    intro: [
      "Township properties collect what the country throws at them: pollen film on siding, algae on the shaded fence line, and driveways streaked with gravel dust. Our crews arrive with water on board, so rural Laurentian Valley homes on wells don't have to donate their water supply for the wash.",
      "Decks, walkways, patio slabs, and the concrete apron in front of the shop all clean up in the same visit. The before-and-after out here is dramatic because the buildup had acreage to work with.",
    ],
    faqs: [
      {
        q: "I'm on a well. Does pressure washing use my water?",
        a: "We can bring our own. For rural Laurentian Valley jobs, our tank supplies the machine, so your well and pressure system are untouched.",
      },
    ],
  },
  "pressure-washing/deep-river": {
    intro: [
      "Shade and river humidity make Deep River a moss and algae town. Driveways under the pines grow a green film that turns slick every rain, and decks facing the water darken a shade a year. Pressure washing resets all of it.",
      "We match pressure to surface: full power for concrete, gentler passes for interlock and wood, and the right biodegradable cleaner for each. Riverside Drive properties get their view path back without a single gouged deck board.",
    ],
    faqs: [
      {
        q: "How often do shaded Deep River driveways need washing?",
        a: "Most stay clean for two seasons after a proper wash. Deeply shaded drives under pine cover may want an annual rinse of the green film before it thickens.",
      },
    ],
  },
  "pressure-washing/chalk-river": {
    intro: [
      "Long rural driveways, big parking pads, and the kind of equipment-yard concrete that works for a living: Chalk River pressure washing is honest work and satisfying to watch. We ride the Deep River route, so the machine is nearby more often than you would guess.",
      "Cottage decks and docks toward Manitou Lake get careful low-pressure treatment with cleaners that are safe over water. The grey washes off; the wood stays whole.",
    ],
    faqs: [
      {
        q: "Can you wash my deck without stripping the stain?",
        a: "If the stain is sound, yes: low pressure and the right cleaner brighten the wood without cutting through the finish. If the stain is already failing, we will show you before we wash so there are no surprises.",
      },
    ],
  },
  "pressure-washing/renfrew": {
    intro: [
      "Renfrew's hundred-year-old concrete and stone take a practiced hand: enough pressure to lift a century of grime, not so much that the aggregate opens up. Front steps, walkways, and porch decks around the heritage streets are the jobs we get asked about most here.",
      "Newer driveways up the hill are simpler: winter salt film and tire marks gone in a pass, curb appeal back before supper. Both kinds of job ride the same weekly Renfrew route.",
    ],
    faqs: [
      {
        q: "Can old concrete steps in Renfrew handle pressure washing?",
        a: "Yes, with adjusted technique. Aged concrete gets moderate pressure and wider tips. Where the surface is already spalling we lean on cleaners instead of force and tell you what we found.",
      },
    ],
  },

  // ---------------- HOUSE WASHING ----------------
  "house-washing/petawawa": {
    intro: [
      "A soft wash is the fastest way to make a Petawawa home look years newer, and with our military and veteran discount it costs less here than most people expect. Algae shows up hard on the shaded sides of the newer builds around town, and the base area's sandy dust films onto siding by mid-summer.",
      "Low pressure and a plant-safe cleaning solution take siding, soffits, and fascia back to bright without driving water behind the cladding. Most homes are done in a morning.",
    ],
    faqs: [
      {
        q: "Is house washing safe for the vinyl siding on newer Petawawa builds?",
        a: "Yes, soft washing was designed for exactly that. Low pressure plus the right cleaner kills the algae and rinses clean, with no water forced behind the vinyl and no stripped finish.",
      },
    ],
  },
  "house-washing/pembroke": {
    intro: [
      "Pembroke homes wear their north side badly: green algae film creeping up the shaded face while the street side stays presentable. Our soft wash treats the whole exterior, brick and vinyl alike, so the house matches itself again.",
      "For the heritage homes downtown, we adjust cleaners for painted wood trim and old brick, and rinse gently around original glazing. The grime leaves; the character stays.",
    ],
    faqs: [
      {
        q: "Can you soft wash older painted wood homes in Pembroke?",
        a: "Yes, with a milder mix and more rinse care than vinyl gets. Sound paint comes through clean. If paint is already flaking, washing will loosen it further, and we will walk the house with you first and say so.",
      },
    ],
  },
  "house-washing/laurentian-valley": {
    intro: [
      "Open township exposure means Laurentian Valley siding takes weather from every direction: field dust in summer, algae on the sheltered side, and the general dulling that makes a ten-year-old house look twenty. A soft wash brings the whole envelope back in one visit.",
      "We are set up for rural properties: our own water when the well matters, long-reach equipment for the tall gables on newer builds, and time in the schedule for the garage and shop to get washed while we are there.",
    ],
    faqs: [
      {
        q: "Can you wash my house and outbuildings in the same visit?",
        a: "Yes, and it is the efficient way to do it. House, garage, and shop get quoted together and washed in sequence, one setup, one visit, one bill.",
      },
    ],
  },
  "house-washing/deep-river": {
    intro: [
      "River humidity feeds algae, and Deep River homes know it: the green creep starts low on the shaded side and climbs a little every season. Soft washing kills the growth at the root rather than smearing it, which is why our washes here stay clean for seasons instead of weeks.",
      "Pines add their own layer of sap flecks and pollen. Siding, soffits, and fascia all get treated and rinsed, and the difference on a white or light-coloured house is startling.",
    ],
    faqs: [
      {
        q: "How long does a soft wash last in Deep River's climate?",
        a: "Two to four seasons for most homes. Heavily shaded, river-facing walls sit at the shorter end. Because the treatment kills growth rather than just rinsing it, rebuilds start from zero.",
      },
    ],
  },
  "house-washing/chalk-river": {
    intro: [
      "Homes tucked into the bush around Chalk River live in the shade, and shade means algae, moss on the north roofline, and siding that dulls green before it dulls grey. Our soft wash routes through with the Deep River runs and resets the whole exterior.",
      "Cottages get the same treatment on a schedule that suits the seasons: a spring wash so the place opens bright, and everything sound and clean before closing in the fall.",
    ],
    faqs: [
      {
        q: "Is the cleaning solution safe for the trees and bush close to my house?",
        a: "Yes. We pre-rinse surrounding plantings, use biodegradable cleaners, and rinse everything down again after. Tight tree lines around Chalk River homes are normal working conditions for us.",
      },
    ],
  },
  "house-washing/renfrew": {
    intro: [
      "Renfrew has both ends of the washing spectrum: century brick and painted wood downtown that want a careful, adjusted wash, and newer vinyl up the hill that wants the standard soft-wash reset. Our crews carry mixes for both on the same truck.",
      "The town's steel roofs shed onto siding and splash grime up the lower walls all winter. A spring soft wash clears the tide line and gets the house ready to be looked at again.",
    ],
    faqs: [
      {
        q: "Can you get the winter splash staining off my lower siding?",
        a: "Yes. That grey-brown tide line along the bottom courses is standard winter fallout and comes off fully with the soft-wash treatment.",
      },
    ],
  },
  // ---------------- LAWN MOWING ----------------
  "lawn-mowing/petawawa": {
    intro: [
      "Petawawa lawns grow on sand, and sandy soil is unforgiving: cut too short in July and the lawn browns in a week. Our crews run higher summer cut heights and sharp blades, which is most of the secret to the good-looking lawns on our routes. The military and veteran discount applies, and half our mowing customers here use it.",
      "For families mid-deployment or between postings, weekly mowing is the chore that most needs to disappear. It shows up on route day, the edges get trimmed, the walks get blown clean, and the photo lands in your inbox.",
    ],
    faqs: [
      {
        q: "Why does my Petawawa lawn brown out every July?",
        a: "Sandy soil drains fast and short-cut grass has no shade for its own roots. We raise cut heights through the heat, keep blades sharp so tips heal instead of fraying, and your lawn holds colour longer. Watering deeply and less often helps too.",
      },
      {
        q: "Can you keep mowing while we're away on leave or tasking?",
        a: "That is precisely what recurring service is for. The crew comes on schedule whether anyone is home or not, and photo updates show the yard is handled.",
      },
    ],
  },
  "lawn-mowing/pembroke": {
    intro: [
      "Pembroke's older streets shade their lawns under big maples, and shaded turf wants a different cut than the sun-blasted new subdivisions out west: higher, less often, with sharp blades that don't tear the thinner grass. Our crews run both kinds of lawn on the same route and adjust as they go.",
      "Every visit is the full routine: cut, string-trim around the trees and beds these older properties always have, hard-edge the walks, and blow everything clean, including the sidewalk out front, because in Pembroke people notice.",
    ],
    faqs: [
      {
        q: "Can grass actually grow well under Pembroke's big maples?",
        a: "It can hold its own with the right care: taller cuts, overseeding with shade-tolerant blends in fall, and accepting that deep-shade patches may want mulch or groundcover instead. We will tell you which fight is winnable.",
      },
    ],
  },
  "lawn-mowing/laurentian-valley": {
    intro: [
      "Acreage mowing is its own trade. A township lawn that swallows a Saturday on a residential mower takes our commercial equipment about an hour, cut in clean stripes with the trim work done properly around fence lines, gardens, and outbuildings.",
      "Laurentian Valley routes run daily alongside Pembroke, so big lots hold a real weekly schedule. The price reflects the acreage, not the address.",
    ],
    faqs: [
      {
        q: "How much does it cost to mow a multi-acre lawn in Laurentian Valley?",
        a: "It depends on cut area and trim complexity, not just acreage. Send your address and we quote from satellite imagery within a business day, usually without needing a site visit.",
      },
    ],
  },
  "lawn-mowing/deep-river": {
    intro: [
      "Deep River lawns grow under pines and along the river, which means needles on the turf, roots near the surface, and shade patterns that change block by block. Our crews mow around all of it weekly, with cut heights set for the town's mix of sun and shadow.",
      "Most customers here are commuters, so the service is built to run without you: same crew, same day, gates closed behind us, clippings and needles off the walks before we roll.",
    ],
    faqs: [
      {
        q: "Do pine needles hurt my Deep River lawn?",
        a: "A light scatter is harmless, but thick needle mats smother grass and acidify the surface layer. Our spring cleanups clear the winter accumulation, and weekly mowing mulches the light summer drop.",
      },
    ],
  },
  "lawn-mowing/chalk-river": {
    intro: [
      "Chalk River lawns range from village lots to clearings carved out of the bush, and the bush edge always wants its ground back. Weekly or bi-weekly mowing with proper trim work is what keeps the clearing looking intentional.",
      "We route Chalk River with Deep River, so rural addresses hold a real schedule. Long grass around septic beds, fire pits, and outbuildings gets the string trimmer, not a shrug.",
    ],
    faqs: [
      {
        q: "Can you handle the rough edges where my lawn meets the bush?",
        a: "Yes. The mow line gets pushed right to the edge and the transition gets trimmed, which is what keeps the bush from creeping into the yard a foot a year.",
      },
    ],
  },
  "lawn-mowing/renfrew": {
    intro: [
      "Renfrew is a commuter town, and the lawns show who got home too late to mow. Our weekly route takes that off the list: cut, trimmed, edged, and blown clean while you are still on Highway 17. The older streets get careful trim work around gardens; the newer ones get their stripes.",
      "Spring cleanups matter here because the town's mature trees drop a real winter's worth of debris. Most customers start the season with one, then let the weekly rhythm carry through to the fall cut-down.",
    ],
    faqs: [
      {
        q: "Do you offer bi-weekly mowing in Renfrew?",
        a: "Yes. Weekly suits the fast growth of May and June, and plenty of Renfrew customers drop to bi-weekly through the drier stretch of high summer. You can switch mid-season with a text.",
      },
    ],
  },

  // ---------------- HEDGE TRIMMING ----------------
  "hedge-trimming/petawawa": {
    intro: [
      "Petawawa properties love their cedar privacy hedges, and nothing sharpens a property line like a freshly squared one. Our crews cut level tops and clean faces on everything from PMQ-height borders to the tall walls around Black Bay yards, with the military and veteran discount applied to the invoice.",
      "Timing matters more than people think: cedars here want late spring or mid-summer cuts so the growth heals before winter. We book the visit for the plant's calendar, not just ours.",
    ],
    faqs: [
      {
        q: "When should cedar hedges in Petawawa be trimmed?",
        a: "Late spring after the first growth flush, with an optional mid-summer touch-up for razor lines. Avoid hard cuts in late fall, since fresh cuts heading into a Valley winter invite browning.",
      },
    ],
  },
  "hedge-trimming/pembroke": {
    intro: [
      "Pembroke's established gardens carry decades-old lilacs, spireas, and foundation shrubs that deserve pruning, not shearing. We shape them for flower and form, and we square the cedar hedges that line the older streets until you can sight down them like a rifle barrel.",
      "Overgrown is our specialty here. A shrub line that has eaten the front walk comes back over a staged season or two, cut in stages the plants can survive.",
    ],
    faqs: [
      {
        q: "My Pembroke lilacs are huge and barely bloom. Can you fix them?",
        a: "Usually, yes. Old lilacs respond to renewal pruning: removing a third of the oldest stems at the base each year for three years. Blooms return as younger wood takes over. It is a rescue we do a lot in Pembroke.",
      },
    ],
  },
  "hedge-trimming/laurentian-valley": {
    intro: [
      "Township hedgerows are measured in tens of metres, not steps. Windbreak cedars, laneway hedges, and the big foundation plantings around country homes all need equipment and stamina that a Saturday with hand shears cannot supply. That is the job we are built for.",
      "We trim for wind exposure out here: slightly tapered faces that shed snow load and keep density low down where the winter wind bites hardest.",
    ],
    faqs: [
      {
        q: "Can you handle a very long laneway hedge in Laurentian Valley?",
        a: "Yes. Long runs are normal township work. We quote by length, height, and condition from photos, and most laneway hedges are done in a single visit with all trimmings hauled away.",
      },
    ],
  },
  "hedge-trimming/deep-river": {
    intro: [
      "Deep River gardens grow well in the river air, and the cedars grow best of all, straight past window height if a season goes missed. Our crews bring the pole trimmers and platform ladders that tall hedges demand, then rake and haul every clipping.",
      "We also prune the ornamentals this town is quietly full of: dogwoods, spireas, and foundation junipers shaped so the house looks tended, not trimmed into gumdrops.",
    ],
    faqs: [
      {
        q: "My Deep River hedge is over ten feet. Is that a problem?",
        a: "No, tall hedges are routine for us. Pole equipment and ladders handle the height, and we can also plan a gradual height reduction over two seasons if you want it brought down.",
      },
    ],
  },
  "hedge-trimming/chalk-river": {
    intro: [
      "Chalk River properties blur into the bush, and the hedge line is what draws the boundary back. We square the cedars, reclaim the shrubs the wild has been recruiting, and haul the trimmings so the edge between yard and forest is crisp again.",
      "Riding the Deep River route means rural addresses get scheduled hedge visits, timed for the season the plants want rather than whenever a crew happens by.",
    ],
    faqs: [
      {
        q: "Half my hedge has gone wild. Can it be saved?",
        a: "Usually. Cedar recovers well if the green growth is still there, and staged cuts over a season or two bring shape back. Where sections are truly dead we say so and suggest patch planting.",
      },
    ],
  },
  "hedge-trimming/renfrew": {
    intro: [
      "Renfrew's older streets frame their century homes with mature hedges and foundation plantings that have outlived several owners. Trimming them well is half horticulture, half respect. We shape for health and form, and the clippings leave with us.",
      "The town's newer builds want the modern look instead: low boxwood-style lines and tight cedar screens, squared to a string line. Same crew, same route day, both done properly.",
    ],
    faqs: [
      {
        q: "Do you remove hedges as well as trim them in Renfrew?",
        a: "Small and mid-size removals, yes: shrubs and hedge sections come out roots-and-all where practical, and the ground is left tidy. Large tree work goes to an arborist, and we will tell you when that is the right call.",
      },
    ],
  },
  // ---------------- LANDSCAPING PROJECTS ----------------
  "landscaping-services/petawawa": {
    intro: [
      "Petawawa moves on posting season, and so does its landscaping: bed refreshes before a house lists, curb appeal packages for new owners, and low-maintenance plantings for families who would rather spend summer at the beach than weeding. The military and veteran discount applies to project work too.",
      "We plant for this town's sandy soil and open sun: tough perennials, mulch that actually holds moisture, and edging that keeps its line. Small interlock repairs and sod patches round out most jobs.",
    ],
    faqs: [
      {
        q: "Can you refresh my landscaping before I sell my Petawawa home?",
        a: "Yes, pre-listing refreshes are some of our most common Petawawa projects. Fresh mulch, crisp edges, a few strategic plants, and repaired walkway pavers change the listing photos completely, usually inside a week of your call.",
      },
    ],
  },
  "landscaping-services/pembroke": {
    intro: [
      "Pembroke's established gardens are the good kind of problem: mature beds that need editing, not replacing. We refresh what decades built, cut clean edges, top up mulch, divide what is crowded, and patch the paver walkways that heave a little more each winter.",
      "For the west-end new builds the job is the opposite: builder-basic yards that need foundation beds, a tree in the right place, and enough structure that the house stops looking parked on a lawn.",
    ],
    faqs: [
      {
        q: "Can you fix the heaved brick walkway at my older Pembroke home?",
        a: "Usually in a day. We lift the affected section, re-level the base with fresh screenings, and re-set the original brick, keeping the character while losing the trip hazard.",
      },
    ],
  },
  "landscaping-services/laurentian-valley": {
    intro: [
      "Country properties want landscaping that can defend itself: windbreak plantings, mulched beds big enough to read from the road, and hardy stock that survives an open-field winter without a burlap wrap. That is the project work we do across the township.",
      "We also build the practical stuff: gravel pads, stepping-stone paths to outbuildings, and drainage-minded bed edges that keep spring melt away from the foundation.",
    ],
    faqs: [
      {
        q: "What plantings survive an exposed Laurentian Valley property?",
        a: "Zone 4 workhorses: cedar and spruce for structure, potentilla, spirea and daylily for colour, and native grasses where the wind is worst. We plant what comes back, not what photographs well for one season.",
      },
    ],
  },
  "landscaping-services/deep-river": {
    intro: [
      "Deep River gardens grow in filtered pine light, and the best ones leaning into it: shade beds of hosta and fern, mulched islands around the big trunks, and moss-tolerant paths down toward the water. We refresh, edge, and plant with the town's canopy in mind.",
      "Waterfront properties get extra care with what washes downhill: we keep new beds and mulch stable on slopes and out of the river's way.",
    ],
    faqs: [
      {
        q: "What grows well in the pine shade of Deep River yards?",
        a: "Shade perennials thrive here: hostas, ferns, astilbe, and groundcovers that take acidic needle fall in stride. We design the bed for the light you actually have.",
      },
    ],
  },
  "landscaping-services/chalk-river": {
    intro: [
      "Chalk River projects are about drawing the line between kept and wild: defined beds at the house, a mulched edge where the lawn meets the bush, and pathways that make the property feel planned. Modest work, big visual payoff.",
      "Because we ride the Deep River route, project days are easy to schedule, and follow-up care can fold into a lawn plan afterward.",
    ],
    faqs: [
      {
        q: "Can a small landscaping project really change a bush-lot property?",
        a: "More than anywhere else, honestly. On a wild backdrop, one day of clean edges, mulch, and a few structured plantings reads as a complete transformation.",
      },
    ],
  },
  "landscaping-services/renfrew": {
    intro: [
      "Renfrew's century homes carry garden bones worth keeping: stone borders, established perennials, and mature foundation plantings. Our projects here are restorations more than renovations, edited beds, repaired stone lines, and fresh mulch that makes old gardens look loved again.",
      "Newer Renfrew streets book the classics: foundation bed builds, sod patches where the builder's lawn gave up, and walkway repairs before the next freeze makes them worse.",
    ],
    faqs: [
      {
        q: "Can you work around the established perennials in my Renfrew garden?",
        a: "Yes, that is the point. We divide and reuse what is healthy, edit what is crowded, and the refreshed bed keeps the plants your garden already proved will thrive.",
      },
    ],
  },

  // ---------------- SNOW REMOVAL ----------------
  "snow-removal/petawawa": {
    intro: [
      "Petawawa mornings do not wait for shovelling, and neither do parade timings. Our snow routes are built around this town, cleared through the storm so driveways are open when the base traffic starts moving. Sign before August 14 with code EARLYBIRD15 and take 15 percent off your seasonal contract, the best rate of the year.",
      "We stake driveways in the fall, run tractor-mounted blowers that throw snow clear instead of banking it, and cap each route so the machine is never far away mid-storm.",
    ],
    faqs: [
      {
        q: "Will my driveway be cleared in time for early parade timings?",
        a: "Petawawa routes are timed for base schedules. Contract driveways get priority passes through the storm and a final clean-up pass after, so early departures are covered.",
      },
      {
        q: "Do military members get a break on snow contracts?",
        a: "Yes, serving members, veterans, and military families get 10% off. It can't be combined with offers above 10%, so during the early-bird window we simply apply EARLYBIRD15 at 15% instead, whichever saves you more is the one you get.",
      },
    ],
  },
  "snow-removal/pembroke": {
    intro: [
      "Pembroke snow has a habit of arriving wet and heavy off the river, the kind that wrecks backs and burns out little snowblowers. Our tractors do not care. Seasonal contracts cover the driveway and apron at one flat rate, with walkway clearing available for the older homes whose front steps face the street.",
      "The city plow's windrow across your driveway mouth is included in every pass. That alone sells most Pembroke contracts.",
    ],
    faqs: [
      {
        q: "Do you clear the plow windrow at the end of my Pembroke driveway?",
        a: "Every pass. The heavy berm the municipal plow leaves across the apron is part of the job, not an extra.",
      },
    ],
  },
  "snow-removal/laurentian-valley": {
    intro: [
      "Township driveways are long, and drifting is the real opponent: an open-field wind can close a cleared lane in an hour. Our tractor blowers are the right machine for it, throwing snow well off the driveway so the banks never squeeze the lane narrower month by month.",
      "Laurentian Valley routes run with our Pembroke runs, so rural addresses get storm service at town frequency, staked in the fall and cleared through to spring.",
    ],
    faqs: [
      {
        q: "Can you keep a 200-metre laneway open all winter?",
        a: "Yes, long laneways are exactly what the tractors are for. Blown snow lands metres off the lane, so February looks like December instead of a canyon.",
      },
    ],
  },
  "snow-removal/deep-river": {
    intro: [
      "Deep River winters are long, cold, and productive, and half the town needs the driveway open before an early shift at CNL. Contract routes here are timed for commuters: cleared through the storm, re-checked before typical departure hours, walkways shovelled where booked.",
      "River-effect drifting along the exposed streets is a routing fact we plan for, not a surprise. Stakes go in before freeze-up so the operator knows your edges in a whiteout.",
    ],
    faqs: [
      {
        q: "What counts as a qualifying snowfall for Deep River contracts?",
        a: "The threshold is set in your contract, typically around five centimetres. Storms above it trigger your route automatically, with unlimited qualifying visits all winter on the flat rate.",
      },
    ],
  },
  "snow-removal/chalk-river": {
    intro: [
      "Chalk River driveways are rural-length with bush on both sides, which means snow storage runs out fast if it is pushed instead of blown. Our tractor blowers throw it into the trees where it belongs, keeping the lane full width into March.",
      "Riding with the Deep River routes, Chalk River contract homes get the same through-storm service, with cottage laneways handled for owners who come up on winter weekends.",
    ],
    faqs: [
      {
        q: "Can you keep a seasonal cottage laneway open near Chalk River?",
        a: "Yes. Weekend-use laneways can be on the full storm route or on a lighter clear-before-Friday schedule, whichever suits how you use the place.",
      },
    ],
  },
  "snow-removal/renfrew": {
    intro: [
      "Renfrew commuters leave early and the snow does not care, so our contract routes clear through the storm with driveways open for the morning run down Highway 17. Flat-rate seasonal pricing means a heavy winter costs the same as a light one.",
      "The town's steel roofs shed slabs onto walks and entrances hours after the sky clears. Walkway clearing is the add-on Renfrew books most, and our passes come back for exactly that.",
    ],
    faqs: [
      {
        q: "My steel roof buries the walkway after every storm. Is that covered?",
        a: "With the walkway add-on, yes. We re-clear entrances and paths on our return passes, including the roof-shed piles that show up after the driveway is already done.",
      },
    ],
  },
};

export function getLocalCopy(
  serviceSlug: string,
  areaSlug: string
): LocalCopy | undefined {
  return localCopy[`${serviceSlug}/${areaSlug}`];
}

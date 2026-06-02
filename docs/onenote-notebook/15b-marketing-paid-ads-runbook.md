# Marketing — Paid Ads Runbook

Step-by-step Google Ads setup + ongoing management. Only spin up
paid ads AFTER organic + GBP + reviews are healthy (see
`15-marketing-playbook.md`).

This runbook is Google Search Ads only — Display, YouTube, Meta ads
have different mechanics and are lower priority for a local property
care business.

---

## Should you be running ads at all?

Run paid ads when:
- GBP listing is verified + complete
- 50+ Google reviews, 4.8+ average
- Organic search brings in 10+ leads/week consistently
- You have $500-1500/month to commit for 6+ months
- Your sales process can handle 50%+ more leads if it works

Don't run paid ads if:
- You can't keep up with the leads you already have (paid will
  break the business)
- Your close rate on inbound leads is < 30% (sales problem first)
- You have less than $300/month budget (too low to learn anything)
- You haven't set up conversion tracking (you'll be flying blind)

---

## Step 1 — Set up the account (one-time, 1 hour)

### A. Create the Google Ads account
1. Go to **ads.google.com**
2. Sign in with the same Google account you use for Google Business
   Profile
3. Skip "Smart campaigns" — they're for tiny businesses without
   the time to manage; you'll outgrow them in a month
4. Pick "Expert mode" instead

### B. Link Google Ads to Google Business Profile
1. Tools → Linked Accounts → Google Business Profile
2. Link the verified PVS listing
3. This unlocks location extensions (your address shows in ads)

### C. Set up conversion tracking (critical)
Without this, you're guessing.

Two conversions to track:
- **Phone calls** from ads (Google Ads can show a tracked call number)
- **Quote form submissions** on the website

For phone calls:
1. Tools → Conversions → New conversion → Phone calls
2. Choose "Calls from ads using call extensions or call-only ads"
3. Set call length threshold: 60 seconds (filters out wrong numbers)

For form submissions:
1. Tools → Conversions → New conversion → Website
2. Set up Google Tag (gtag.js) — you'll need to add a small JS
   snippet to the site (developer task)
3. Trigger fires on the quote form thank-you page

If you can't set up conversion tracking — DON'T launch ads. Wait
until you can.

### D. Link Google Ads to Search Console
- Tools → Linked Accounts → Search Console
- Useful for seeing the overlap between paid + organic queries

### E. Add a payment method + set budget cap
- Account billing → add credit card
- Set monthly account-level budget cap — start with $500-1500/month
- Google CAN'T charge you more than your daily budget × ~30.4 days

---

## Step 2 — Campaign structure (3 campaigns, one per division)

### Why 3 campaigns?
- Different services, different keywords, different seasons
- LawnPros campaign only runs March-October
- SnowLand campaign only runs September-March
- Lets you control budget per division

### Campaign 1: PVS — LawnPros

**Settings:**
- Campaign type: Search
- Goal: Get more leads (phone calls + form submissions)
- Networks: Search Network ONLY (uncheck Search Partners + Display)
- Locations: Petawawa + Pembroke + Deep River + Cobden + Renfrew +
  Arnprior + Eganville + Chalk River. Use a custom radius if your
  service area is more specific.
- Languages: English
- Audience signals: None (you're targeting by intent, not audience)
- Budget: ~$300-500/month
- Bid strategy: Maximize conversions (after you have 30+ conversions
  collected; before that, use Manual CPC with $2-4 cap)
- Ad schedule: Mon-Sat 6am-9pm (don't pay for clicks at 2am)
- Ad rotation: Optimize (Google picks best ad)

**Ad groups + keywords:**

Ad group A — Lawn Mowing
- Keywords (phrase match in quotes, exact match in brackets):
  - "lawn care petawawa"
  - "lawn care pembroke"
  - "lawn mowing petawawa"
  - "lawn mowing pembroke"
  - [lawn care petawawa ontario]
  - "lawn maintenance ottawa valley"

Ad group B — Spring Cleanup
- Keywords:
  - "spring cleanup petawawa"
  - "spring yard cleanup pembroke"
  - "yard cleanup ottawa valley"
  - "spring landscaping petawawa"

Ad group C — Aeration / Lawn Health
- Keywords:
  - "lawn aeration pembroke"
  - "aeration petawawa"
  - "lawn dethatching petawawa"
  - "overseeding lawn ottawa valley"

### Campaign 2: PVS — ClearView

Same structure. Ad groups:
- Window Cleaning
- Gutter Cleaning
- Pressure Washing
- House Washing (soft wash)

Keywords follow the pattern: "{service} {town}" in both phrase and
exact match.

### Campaign 3: PVS — SnowLand

Ad groups:
- Snow Removal
- Snow Plowing (driveway)
- Seasonal Snow Contracts
- Walkway Clearing

Active September-March only. Pause completely April-August.

---

## Step 3 — Negative keywords (the single biggest money saver)

A negative keyword tells Google NOT to show your ad for that search.

### Add these as negative keywords at the campaign level for ALL campaigns:

```
free
diy
do it yourself
how to
tutorial
guide
yourself
jobs
careers
hiring
employment
salary
wage
school
course
training (unless you're running training services)
youtube
video
amazon
costco
home depot
canadian tire
cheap
free quote (yes, even this — attracts time-wasters)
```

### LawnPros-specific negatives:
```
artificial
fake
turf installation
sod installation
landscaping design
hardscape
patio installation
pool
```

### ClearView-specific negatives:
```
installation
replacement
repair
broken
glass repair
window installation
gutter installation
roof replacement
```

### SnowLand-specific negatives:
```
plow blade (people shopping for equipment)
plow truck for sale
salt for sale
shovels for sale
snowblower
snow blower
```

Review the **Search Terms Report** weekly for the first month and
add any junk searches as negatives. After 60-90 days the negative
list will be dialled in.

---

## Step 4 — Ad copy templates

Each ad group needs 3-5 ad variations. Google picks the best.

### Responsive Search Ad — LawnPros Lawn Mowing

**Headlines (write 10-12, Google rotates 3 at a time):**
1. Lawn Mowing in Petawawa
2. Reliable Lawn Care — Free Quote
3. Petawawa & Pembroke Lawn Pros
4. Weekly Lawn Mowing, Insured Crew
5. Recurring Lawn Care Plans
6. Same-Day Quote, Local Crew
7. Trusted Across the Ottawa Valley
8. Streak-Free Edges Every Visit
9. Fully Insured — No Surprises
10. Book Spring Mowing — Routes Filling

**Descriptions (write 4):**
1. Local, insured lawn care crew serving Petawawa, Pembroke & the Valley. Free quote within one business day.
2. Recurring lawn mowing, spring cleanups, aeration. Real homeowners, real reviews. (613) 334-5858.
3. Streak-free edges, full cleanup, no missed weeks. Fair pricing, locked in for the season.
4. Three local crews, year-round care. Get a free quote today.

**Display path 1:** Lawn-Care
**Display path 2:** Petawawa

### Same structure for every ad group — write ad copy specific to the
service + service area.

### Ad extensions (set up once, applies across campaigns)

- **Sitelinks**: "Get a Free Quote" / "Reviews" / "Our Services" /
  "Service Areas"
- **Callouts**: "Free Quotes", "Fully Insured", "Locally Owned",
  "Recurring Plans"
- **Call extension**: (613) 334-5858 — only during business hours
- **Location extension**: Auto-pulls from GBP
- **Structured snippets**: Services list pulled from your offerings

Extensions don't cost extra and dramatically improve click-through
rate. Always use them.

---

## Step 5 — Landing pages

Don't send paid traffic to your homepage.

Each campaign sends to the most relevant page:
- LawnPros campaign → `/divisions/lawnpros` OR `/services/lawn-mowing`
- ClearView Window Cleaning → `/services/window-cleaning`
- SnowLand Snow Removal → `/services/snow-removal/petawawa` (or
  whichever town the searcher's in — Google's geo-targeting takes
  care of this for you when you use the dynamic landing page)

Each landing page must have:
- Clear H1 matching the search intent ("Window Cleaning in Petawawa")
- Phone number visible above the fold
- Quote form visible above the fold
- Local trust signals (reviews count, insurance, areas served)
- Mobile-friendly (already true)

---

## Step 6 — Weekly management (30 min Mondays)

After Monday huddle, sit with a coffee and:

### Review (15 min)
1. **Cost per conversion** by campaign — is it within $40-60?
2. **Conversion volume** — getting at least 3-5 conversions/week per
   campaign?
3. **Search terms report** — any new junk searches to add as
   negatives?
4. **Quality scores** — anything below 6/10? (Lower quality = higher
   cost per click)

### Action (15 min)
- Add 5-10 new negative keywords from the search terms report
- Pause any ads with > $40 cost per conversion sustained for 2+ weeks
- Increase budget on any campaign with cost per conversion < $30 and
  consistent volume
- Test new headlines on any ad group that hasn't seen variation in
  4+ weeks

---

## Step 7 — Monthly review (1 hour, last Friday)

- Cost per acquired CUSTOMER (not lead) by campaign
- Lifetime value of customers acquired through ads vs. organic
- Total spend vs. revenue generated
- ROAS (Return on Ad Spend): revenue from ad-attributed customers /
  ad spend
- Target ROAS: 5x minimum (every $1 in ads returns $5+ in revenue)

If you're below 3x ROAS for 60 days, something is wrong:
- Pricing too low?
- Close rate too low?
- Wrong keywords (high traffic, low intent)?
- Wrong landing pages?

---

## Common mistakes — avoid these

1. **Running broad match keywords** — burns budget on irrelevant
   searches. Use phrase + exact only.
2. **Not adding negative keywords** — you'll pay for "free lawn care
   tips" clicks all month
3. **Sending to homepage** — generic landing = low conversion
4. **Setting and forgetting** — Ads need weekly attention; otherwise
   they bleed money
5. **Running ads in off-season** — snow ads in July, lawn ads in
   January = wasted spend
6. **Bidding too aggressively** — don't outbid yourself; let Google's
   automation work after 30+ conversions
7. **Ignoring quality score** — fixing low quality scores cuts your
   cost per click in half

---

## Budget guidelines (first 90 days)

| Month | Action | Spend |
|---|---|---|
| Month 1 | Launch all 3 campaigns at low budget; gather data | $500-700 |
| Month 2 | Review what's working; pause losers; scale winners | $500-1000 |
| Month 3 | Optimize landing pages; refine keywords | $700-1200 |

After Month 3, scale up the campaigns hitting target ROAS. Pause or
restructure the ones that aren't.

---

## When to hire help

DIY Google Ads is fine for the first 6-12 months. You learn what
works in YOUR market.

Hire a Google Ads contractor when:
- You're spending $2k+/month
- You're hitting ROAS targets but feel you're leaving growth on the
  table
- You no longer have 30 min/week for it

Typical contractor fee: $300-800/month for managing $2k-10k/month
spend. Pay flat fee, NOT % of spend (which creates perverse
incentive to grow your spend).

---

## Quick reference — the 5 things to look at every week

1. **Cost per conversion** (target < $50)
2. **Conversion volume** (target 3-5/week per campaign)
3. **Search terms report** (add negatives)
4. **Quality scores** (fix anything < 6)
5. **Budget pace** (on track for monthly cap or under?)

That's the weekly ritual. 30 min, every Monday.

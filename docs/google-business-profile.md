# Google Business Profile — Setup Sheet

Copy/paste these into Google Business Profile during signup. Everything
here matches the website schema (LocalBusiness JSON-LD in `app/layout.tsx`
and `lib/site.ts`) — keep them in sync if you change anything.

**Sign up at:** https://business.google.com/create

---

## Business name
```
Prestige View Services
```

## Business category
**Primary category:**
```
Property maintenance
```

**Additional categories** (add all that apply — Google allows up to 9):
```
Lawn care service
Window cleaning service
Gutter cleaning service
Pressure washing service
Snow removal service
House cleaning service
Junk removal service
Landscaper
```

## Address
Decide whether to show the street address publicly or set as **service-area business** (no public address — recommended for residential property care).

If service-area only, list:
```
Petawawa, ON
Pembroke, ON
Deep River, ON
Chalk River, ON
Cobden, ON
Renfrew, ON
Arnprior, ON
Eganville, ON
```

If showing a street address (matches site schema):
```
45 Water Tower Road
Petawawa, ON
Canada
```

## Phone
```
(613) 334-5858
```

## Website
```
https://prestigeviewservices.ca
```

## Business hours
```
Monday    7:00 AM – 7:00 PM
Tuesday   7:00 AM – 7:00 PM
Wednesday 7:00 AM – 7:00 PM
Thursday  7:00 AM – 7:00 PM
Friday    7:00 AM – 7:00 PM
Saturday  7:00 AM – 7:00 PM
Sunday    Closed
```

---

## Business description (750 chars max)

```
Prestige View Services is the Ottawa Valley's year-round property care company — based in Petawawa and serving Pembroke, Deep River, Chalk River, Cobden, Renfrew, Arnprior, and Eganville. We run three specialist crews under one local, insured team:

PVS LawnPros — Lawn mowing, spring cleanups, aeration, overseeding, and seasonal property maintenance.

PVS ClearView — Window cleaning, gutter cleaning, pressure washing, house washing, and junk removal.

PVS SnowLand — Residential snow removal, seasonal snow contracts, and walkway clearing.

Recurring service. One easy bill. Free quote within one business day. Streak-free guarantee on every window job.
```

---

## Services list

Add each service with a short description. Pricing per service is optional
— leave blank unless you want fixed prices visible.

### LawnPros
- **Lawn Mowing** — Weekly or bi-weekly recurring mowing with edging and cleanup
- **Spring Cleanups** — Winter debris removal, bed edging, first cut, full hauling
- **Lawn Aeration** — Core-pull aeration to relieve compaction
- **Dethatching** — Power-rake dethatching with full debris cleanup
- **Overseeding** — Premium seed blends to thicken thin spots
- **Property Maintenance** — Custom recurring upkeep on one account

### ClearView
- **Window Cleaning** — Interior and exterior, streak-free guarantee
- **Gutter Cleaning** — Hand-clean debris removal, downspout flush, inspection
- **Pressure Washing** — Driveway, walkway, deck and patio restoration
- **House / Exterior Washing** — Soft-wash siding, soffits, exterior surfaces
- **Property Touch-Ups** — Small exterior fixes and maintenance
- **Junk Removal** — Same-day appliances, furniture, yard debris hauling
- **Property Cleanouts** — Move-out, estate, garage, renovation cleanouts

### SnowLand
- **Residential Snow Removal** — Per-storm or recurring driveway clearing
- **Seasonal Snow Contracts** — Flat winter rate, unlimited qualifying storms
- **Walkway & Path Clearing** — Walkways, steps and entries shoveled + salted

---

## Service areas

```
Petawawa, ON
Pembroke, ON
Deep River, ON
Chalk River, ON
Cobden, ON
Renfrew, ON
Arnprior, ON
Eganville, ON
```

---

## Photos to upload

Upload at least:

- **Logo** — `public/images/logo.png` (white-outlined version) or `logo-light.png` (black-text on white) depending on background
- **Cover photo** — Pick one strong job shot, e.g. `public/images/gallery/window-cleaning/aw-exterior-rain.jpg`
- **Mascot** — `public/images/mascot-sam.png` (Almighty Sam — adds personality and stands out)
- **Service photos** — 2–3 from each gallery:
  - `public/images/gallery/lawn-mowing/aerial-drone-property.jpg`
  - `public/images/gallery/window-cleaning/interior-team-action.jpg`
  - `public/images/gallery/snow-removal/snow-job-05.jpg`
  - `public/images/gallery/pressure-washing/pressure-job-01.jpg`
  - `public/images/gallery/gutter-cleaning/gutter-job-01.jpg`
  - `public/images/gallery/junk-removal/junk-job-01.jpg`
  - `public/images/gallery/window-cleaning/residential-pvs-uniform.jpg` (PVS branded uniform — great trust signal)

---

## After publishing

1. Add the **Google Maps profile URL** to `lib/site.ts` under `googleReviewUrl`
   if it changes from the current `https://g.page/r/CQB2PdKcBZl-EAE/review`
2. Verify the listing (Google sends a postcard with a code — usually 5-14 days)
3. Encourage every completed job to leave a review via the QR code printed
   from the `/admin/reviews` page

---

## Why this matters

A verified, fully-filled Google Business Profile is the **single highest-impact**
local-SEO action you can take. It powers:

- Google Maps pack rankings (the 3 businesses shown above search results)
- "Near me" search results
- Star ratings shown in regular Google search
- Knowledge panel (the box on the right of search results)
- Drive direction requests, calls, and website clicks tracked in GBP Insights

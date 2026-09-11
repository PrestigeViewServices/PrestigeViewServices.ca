# Prestige View Services — Website

Marketing + lead-gen site for **Prestige View Services (PVS)** — residential
property care across Petawawa, Pembroke, and the Ottawa Valley.

Includes the owner's **admin dashboard** at `/admin` (leads, winter
reservations, support, hiring, Prestige Club, site content, notifications),
the **Prestige Club** customer portal at `/account`, the careers funnel, and
dual analytics (Vercel + Google Analytics 4). Auth is fully in-house — no
third-party login service.

Built on **Next.js 15 (App Router)**, **TypeScript**, **Tailwind**,
**shadcn/ui**, **Prisma + Postgres**, and **Framer Motion**.

---

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env.local  # fill in values (see below)
npm run db:deploy           # apply migrations once DATABASE_URL is set
npm run dev
```

Open <http://localhost:3000>, and <http://localhost:3000/admin> for the
dashboard (sign in with `ADMIN_EMAIL` + `ADMIN_PASSWORD`).

> The marketing pages boot cleanly even without Postgres / GA4 configured —
> protected surfaces show a "not configured" notice instead of crashing.
> Fill in env vars and refresh to light them up. **SETUP.md** is the
> click-by-click guide.

### Scripts

| Script               | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Local dev server on `:3000`                      |
| `npm run build`      | Production build                                 |
| `npm run start`      | Run the production build                         |
| `npm run typecheck`  | TypeScript check, no emit                        |
| `npm run lint`       | ESLint (Next.js config)                          |
| `npm run db:generate`| Regenerate Prisma client                         |
| `npm run db:migrate` | Create + apply a new Prisma migration (dev)      |
| `npm run db:deploy`  | Apply pending migrations (prod-safe, no prompts) |
| `npm run db:push`    | Push schema without a migration (prototyping)    |
| `npm run db:seed`    | Seed sample applications / support requests      |
| `npm run admin`      | List / add / reset / remove dashboard sign-ins   |
| `npm run leads`      | Back up / restore every lead + intake table (JSON) |
| `npm run setup:check`| Verify `.env.local` + database connectivity      |
| `npm run vercel-build`| What Vercel runs: migrate deploy → next build   |

---

## Environment variables

| Var                                | Required for           | Purpose                                                                |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `DATABASE_URL`                     | **Admin dashboard**    | Postgres connection string (Neon or Supabase, direct/non-pooled)       |
| `ADMIN_EMAIL`                      | **Admin dashboard**    | Recovery login email for `/admin`                                      |
| `ADMIN_PASSWORD`                   | **Admin dashboard**    | Recovery login password for `/admin` (10+ chars). Always works.        |
| `ADMIN_SESSION_SECRET`             | Recommended            | Signs the admin cookie (falls back to `ADMIN_PASSWORD`)                |
| `CUSTOMER_SESSION_SECRET`          | Recommended            | Signs Prestige Club member cookies (falls back to the admin secret)    |
| `NEXT_PUBLIC_SITE_URL`             | SEO / sitemap          | Canonical site origin                                                  |
| `NEXT_PUBLIC_BUSINESS_PHONE`       | Header / contact / SEO | E.164 phone, e.g. `+1-613-334-5858`                                    |
| `RESEND_API_KEY`                   | Owner alerts           | Email every intake to the owner (`lib/notify.ts`)                      |
| `LEAD_FROM_EMAIL`                  | Owner alerts           | Verified sender, e.g. `PVS Website <alerts@prestigeviewservices.ca>`   |
| `OWNER_NOTIFY_EMAIL`               | Owner alerts           | Comma-separated recipients                                             |
| `TWILIO_*` / `OWNER_SMS_GATEWAY`   | Owner alerts (SMS)     | Text alerts via Twilio or a carrier email-to-text gateway              |
| `CLOUDINARY_*`                     | Photo uploads          | `/admin/site/photos`                                                   |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`    | Analytics              | GA4 measurement ID (`G-XXXXXXX`)                                       |
| `JOBBER_*`, `CRON_SECRET`          | Prestige Club sync     | Read-only Jobber sync for service history                              |

Vercel Analytics turns on automatically when deployed to Vercel — no key
required. `.env.example` documents every variable with where to get it.

---

## Routes

| Path                          | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `/`                           | Home (marketing)                                               |
| `/fall-winter`                | Seasonal hub: fall cleanups + gutters now, snow pass for later |
| `/winter-packages`            | Snow pass conversion page + reservation form                   |
| `/services`, `/services/{slug}` | All services / service detail (+ `/{area}` city variants)    |
| `/service-areas`              | Cities served                                                  |
| `/quote`, `/contact`          | Aurora Suite lead form (primary CTA)                           |
| `/reviews`, `/our-work`       | Social proof                                                   |
| `/careers`, `/careers/{slug}` | Recruiting funnel + application                                |
| `/support`                    | Customer support form (existing customers)                     |
| `/account`                    | Prestige Club member portal (in-house login)                   |
| `/refer`, `/r/{code}`         | Referral program + landing                                     |
| `/admin`                      | **Command Center** — leads, open requests, traffic, activity   |
| `/admin/leads`, `/admin/pipeline` | Leads inbox + job pipeline                                 |
| `/admin/winter-reservations`  | Snow pass reservations                                         |
| `/admin/support`, `/admin/applications` | Tickets + hiring                                     |
| `/admin/club/*`               | Members, approvals, referrals, giveaways, metrics, settings    |
| `/admin/notifications`        | In-app feed of everything the site captured                    |
| `/admin/marketing`            | Marketing & SEO hub                                            |
| `/admin/site`, `/admin/site/content`, `/admin/site/photos` | Owner-editable site content + photos |
| `/admin/account`              | Dashboard sign-ins (add / reset / remove admins)               |
| `/api/admin/login`            | POST → sets the signed admin cookie; DELETE → sign out         |
| `/sitemap.xml`, `/robots.txt` | Auto-generated                                                 |

---

## Admin access

- `/admin` is guarded by `app/admin/layout.tsx` → `lib/admin-session.ts`.
  Signed-out visitors see the login form on any `/admin` URL.
- Two ways in, both ours: a sign-in stored in Postgres (`AdminCredential`,
  managed at `/admin/account` or `npm run admin`), or the **recovery login**
  `ADMIN_EMAIL` + `ADMIN_PASSWORD` from the environment, which always works.
- Every admin has the same full access. The signed session is an HMAC'd
  cookie (30 days) signed with `ADMIN_SESSION_SECRET`.
- Customer (`/account`) sessions are a separate system (`lib/customer-auth.ts`)
  and can never grant admin access.

`/sign-in`, `/sign-up`, `/post-sign-in` are legacy redirects kept so old
links still land somewhere sensible.

### Saving and moving leads

Leads reach the database two ways: the native form (`/request-service` →
`/api/leads`) and referral flows. The **Get Quote** form on `/quote` and
`/contact` is an Aurora Suite iframe, so those leads live in Aurora until
they are imported.

- **Leads inbox → Export CSV** — every lead as a spreadsheet.
- **Leads inbox → Backup (JSON)** — every intake table (leads, quote
  requests, winter reservations, support tickets, applications), restorable.
- **Leads inbox → Import leads** (`/admin/leads/import`) — any CSV, Aurora
  exports included; columns matched by header, duplicates skipped.
- `npm run leads export [file]` / `npm run leads import <file> [--to <url>]`
  — the same backup from a terminal, for moving to a new database.

### Wiring Postgres

1. Provision a free Postgres on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com)
2. Paste the connection string into `DATABASE_URL`
3. `npm run db:deploy` (creates the schema) — on Vercel this runs
   automatically on every deploy via `scripts/vercel-build.mjs`
4. Optional: `npm run db:seed` (sample applications / support)

---

## Analytics

- **Vercel Analytics** is added via `@vercel/analytics/react` and auto-fires
  on every route when deployed to Vercel. No env var required. The dashboard
  is in your Vercel project → Analytics tab.
- **Google Analytics 4** loads via `next/script` when
  `NEXT_PUBLIC_GA_MEASUREMENT_ID` is set. Captures pageviews, referrer, and
  `utm_*` automatically — source/medium/campaign attribution works out of
  the box.

To check attribution in GA4: **Reports → Acquisition → Traffic acquisition**.

---

## Lead capture (Aurora Suite)

The `<AuroraLeadForm />` component is the single source of truth for
**sales lead capture** (separate from job applications and from customer
support). It embeds the Aurora Suite signed iframe on `/quote`, each
`/divisions/*` page, and `/contact`. The iframe URL is HMAC-signed — never
append query params.

`Get Quote` CTAs route to `/quote` (or anchor to `#quote-form` on division
pages). Division-page CTAs scroll to the in-page form so the visitor never
leaves.

---

## Content (typed, editable without code changes)

| File                            | Drives                                          |
| ------------------------------- | ----------------------------------------------- |
| `lib/site.ts`                   | Name, tagline, phone, email, address            |
| `lib/content/divisions.ts`      | The three divisions                             |
| `lib/content/services.ts`       | Every service                                   |
| `lib/content/offers.ts`         | Promo offers (toggle `active`)                  |
| `lib/content/reviews.ts`        | Customer reviews                                |
| `lib/content/careers.ts`        | Open roles (toggle `active`)                    |
| `lib/content/gallery.ts`        | "Recent Work" tiles on the home page            |
| `/public/images/`               | Logos + gallery photos                          |

The **Google review link** is a single constant in
`lib/site.ts` → `siteConfig.googleReviewUrl`. Every CTA (the `/reviews`
button, footer link, post-quote callout, `/account` callout) and the
downloadable QR code on `/admin/reviews` rebuild from that value, so
updating it everywhere is a one-line change.

---

## Explicitly deferred

These are flagged in the codebase as `// TODO:` and intentionally out of
Phase 1 scope:

- **Billing / loyalty subscription** — integrate **Stripe** later
- **Time tracking + commission** — integrate **Connecteam** or
  **QuickBooks Time** rather than building payroll in-house
- **Visual site-editing CMS** — evaluate a headless CMS (Sanity, Payload,
  TinaCMS) if non-developers need to edit copy

---

## Design system

- **Fall & winter theme (site-wide):** deep midnight-navy background
  `#090D18` with a warm amber "fall" wash and an icy sky "winter" wash, a
  drifting leaf + snowflake ambience layer (`components/season-ambience.tsx`,
  hidden on `/admin` and on pages with their own ambience), and a
  `bg-gradient-season` amber→frost accent gradient for headline highlights.
- Surface `#111726`, text `#F5F7FA` / `#9AA7BD`
- Primary / ClearView gradient `#3B82F6 → #2563EB`
- LawnPros gradient `#22C55E → #16A34A`
- SnowLand gradient `#38BDF8 → #0EA5E9`
- Cards `rounded-2xl`, buttons `rounded-full`
- Framer Motion only on hero / entrance; everything else uses Tailwind
  transitions. `prefers-reduced-motion` respected globally.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import the repo into Vercel.
3. Add the env vars from `.env.example` — at minimum `DATABASE_URL`,
   `ADMIN_EMAIL`, `ADMIN_PASSWORD`.
4. Vercel auto-detects Next.js and runs `npm run vercel-build`, which
   applies pending Prisma migrations and then builds. `postinstall` runs
   `prisma generate`.
5. Any env var change needs **Deployments → Redeploy** to take effect.
6. Keep `package-lock.json` in sync (`npm install` after editing
   `package.json`) — Vercel uses `npm ci`, which fails on a stale lock.

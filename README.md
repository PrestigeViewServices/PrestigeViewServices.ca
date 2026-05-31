# Prestige View Services — Website

Marketing + lead-gen site for **Prestige View Services (PVS)** — residential
property care across Petawawa, Pembroke, and the Ottawa Valley.

**Phase 1** now includes a role-gated admin portal (Clerk + Postgres),
employee portal stub, customer support page, careers funnel with applications
DB, and dual analytics (Vercel + Google Analytics 4).

Built on **Next.js 14 (App Router)**, **TypeScript**, **Tailwind**,
**shadcn/ui**, **Clerk**, **Prisma + Postgres**, and **Framer Motion**.

---

## Getting started

```bash
npm install                 # also runs `prisma generate` via postinstall
cp .env.example .env.local  # fill in values (see below)
npm run db:migrate          # apply migrations once DATABASE_URL is set
npm run db:seed             # optional — sample applications + users
npm run dev
```

Open <http://localhost:3000>.

> The marketing pages boot cleanly even without Clerk / Postgres / GA4
> configured — protected surfaces show a "Service not configured" notice
> instead of crashing. Fill in env vars and refresh to light them up.

### Scripts

| Script               | Purpose                                          |
| -------------------- | ------------------------------------------------ |
| `npm run dev`        | Local dev server on `:3000`                      |
| `npm run build`      | Production build                                 |
| `npm run start`      | Run the production build                         |
| `npm run typecheck`  | TypeScript check, no emit                        |
| `npm run lint`       | ESLint (Next.js config)                          |
| `npm run db:generate`| Regenerate Prisma client                         |
| `npm run db:migrate` | Apply Prisma migrations (dev)                    |
| `npm run db:push`    | Push schema without a migration (prototyping)    |
| `npm run db:seed`    | Seed sample admin / employee / applications      |

---

## Environment variables

| Var                                | Required for           | Purpose                                                                |
| ---------------------------------- | ---------------------- | ---------------------------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`             | SEO / sitemap          | Canonical site origin                                                  |
| `NEXT_PUBLIC_BUSINESS_PHONE`       | Header / contact / SEO | E.164 phone, e.g. `+1-613-334-5858`                                    |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`| Auth                   | Clerk publishable key                                                  |
| `CLERK_SECRET_KEY`                 | Auth                   | Clerk secret key                                                       |
| `CLERK_WEBHOOK_SECRET`             | User sync              | Svix signing secret from the Clerk webhook endpoint                    |
| `ULTIMATE_ADMIN_EMAILS`            | Auth                   | Comma-separated emails that auto-receive the `ultimate_admin` role     |
| `DATABASE_URL`                     | DB-backed surfaces     | Postgres connection string (Neon or Supabase)                          |
| `APPLICATION_NOTIFICATION_EMAIL`   | Hiring                 | Where new careers applications get emailed                             |
| `SUPPORT_NOTIFICATION_EMAIL`       | Support                | Where new /support submissions get emailed                             |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID`    | Analytics              | GA4 measurement ID (`G-XXXXXXX`)                                       |

Vercel Analytics turns on automatically when deployed to Vercel — no key
required.

---

## Routes

| Path                          | Purpose                                                        |
| ----------------------------- | -------------------------------------------------------------- |
| `/`                           | Home (marketing)                                               |
| `/divisions/{slug}`           | Division pages (LawnPros / ClearView / SnowLand)               |
| `/services`                   | All services, tabbed by division                               |
| `/reviews`                    | All customer reviews                                           |
| `/quote`                      | Aurora Suite lead form (primary CTA)                           |
| `/careers`                    | Recruiting funnel                                              |
| `/careers/{slug}`             | Role detail + application form                                 |
| `/contact`                    | Contact info + Aurora lead form                                |
| `/support`                    | Customer support form (existing customers)                     |
| `/about`                      | Trust / about page                                             |
| `/sign-in`, `/sign-up`        | Clerk hosted UI (Google, Apple, email, phone)                  |
| `/admin`                      | Role-gated dashboard (counts, by-status, recent activity)      |
| `/admin/applications`         | Hiring applications + status updates (`New / Contacted / Hired / Rejected`) |
| `/admin/support`              | Support requests + status updates                              |
| `/admin/loyalty`              | Phase 2 placeholder — Stripe subscriptions / points TBD        |
| `/admin/users`                | Role management (ultimate_admin writes; admin read-only)       |
| `/admin/site`                 | **ultimate_admin only** — Site Modifications hub               |
| `/admin/site/photos`          | **super_admin + ultimate_admin** — gallery photo manager       |
| `/admin/reviews`              | Admin family — QR code + SMS/email templates for review asks   |
| `/portal`                     | Employee portal stub (hours / commission placeholders)         |
| `/account`                    | **customer only** — profile + their own support requests       |
| `/post-sign-in`               | Internal role-router after Clerk sign-in                       |
| `/api/apply`                  | POST → validate + write Application + email notify             |
| `/api/support`                | POST → validate + write SupportRequest + email notify          |
| `/api/clerk/webhook`          | Clerk → Postgres user sync (Svix-verified)                     |
| `/sitemap.xml`, `/robots.txt` | Auto-generated                                                 |

---

## Role-gated portal (Phase 1)

### Roles

| Role             | Can access                                                                                  |
| ---------------- | ------------------------------------------------------------------------------------------- |
| `ultimate_admin` | Everything. Only role allowed to change roles, hit `/admin/site`, or touch billing surfaces |
| `super_admin`    | **`/admin` overview + `/admin/applications` + `/admin/site/photos` only.** No role changes, no billing |
| `admin`          | `/admin`, applications, support, loyalty. `/admin/users` read-only. No photos, no /site     |
| `employee`       | `/portal` only                                                                              |
| `customer`       | `/account` only                                                                             |

`ultimate_admin` is assigned by the env allowlist (`ULTIMATE_ADMIN_EMAILS`)
on first sign-in. `super_admin` is granted by an `ultimate_admin` via
`/admin/users`. The UI never lets a non-ultimate-admin assign these roles.

### Sign-in routing

Clerk's "after sign-in" / "after sign-up" URLs both point at
`/post-sign-in`. That page reads the user's role and server-side
`redirect()`s them to the correct portal:

- `customer` → `/account`
- `employee` → `/portal`
- `admin` / `super_admin` / `ultimate_admin` → `/admin`

Users never pick which portal to enter — the role decides for them.
URL-guessing the wrong portal bounces back through `/post-sign-in`.

### Assigning `ultimate_admin`

`ultimate_admin` is **never UI-assignable**. Put the email(s) of the
person(s) who should hold it into `ULTIMATE_ADMIN_EMAILS` (comma-separated).
The Clerk webhook auto-assigns the role on first sign-in. To revoke, remove
the email from the env var **and** demote the user via the Users view.

### Wiring Clerk

1. Create a Clerk app at <https://clerk.com>
2. Enable Google, Apple, email, and phone (SMS) sign-in methods in the
   Clerk Dashboard → User & Authentication settings
3. Copy the publishable + secret keys into `.env.local`
4. **Webhook:**
   - In Clerk Dashboard → Webhooks → "Add Endpoint"
   - URL: `https://your-domain.com/api/clerk/webhook` (use ngrok in dev)
   - Subscribe to: `user.created`, `user.updated`, `user.deleted`
   - Copy the signing secret into `CLERK_WEBHOOK_SECRET`

### Wiring Postgres

1. Provision a free Postgres on [Neon](https://neon.tech) or
   [Supabase](https://supabase.com)
2. Paste the connection string into `DATABASE_URL`
3. `npm run db:migrate` (creates the schema)
4. Optional: `npm run db:seed` (sample admin/employee/applications/support)

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

- Background `#0A0E17`, surface `#111726`, text `#F5F7FA` / `#9AA7BD`
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
3. Add **all** env vars from `.env.example`.
4. Vercel auto-detects Next.js. The `postinstall` script runs `prisma
   generate` automatically.
5. After first deploy, set the Clerk webhook URL to your production domain.

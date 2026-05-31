# Prestige View Services — Website

Marketing + lead-gen site for **Prestige View Services (PVS)** — a residential
property care company serving Petawawa, Pembroke, and the Ottawa Valley.

Built on Next.js 14 (App Router), TypeScript, Tailwind CSS, shadcn/ui, and
Framer Motion. Deployable to Vercel.

The primary business objective is **booked quotes and signed seasonal
contracts**. Every page is structured to move a visitor toward the embedded
[Aurora Suite](https://aurorasuite.ca) lead form on `/quote` (or the in-page
embed on each division page).

---

## Getting started

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

Open <http://localhost:3000>.

### Useful scripts

| Script              | What it does                          |
| ------------------- | ------------------------------------- |
| `npm run dev`       | Local dev server on `:3000`           |
| `npm run build`     | Production build                      |
| `npm run start`     | Run the production build              |
| `npm run typecheck` | TypeScript check, no emit             |
| `npm run lint`      | ESLint (Next.js config)               |

---

## Environment variables

Copy `.env.example` → `.env.local` and set:

| Var                          | Purpose                                              |
| ---------------------------- | ---------------------------------------------------- |
| `NEXT_PUBLIC_SITE_URL`       | Used in sitemap, OG tags, JSON-LD                    |
| `NEXT_PUBLIC_BUSINESS_PHONE` | Click-to-call number (E.164: `+1-613-555-0123`)      |
| `ADMIN_PASSWORD`             | Single shared password for the v1 `/admin` gate      |

> Lead capture is handled by the embedded **Aurora Suite** form, not by this
> app. No SMTP / Resend env vars are needed. If you need to swap the form or
> the signed URL, edit `components/AuroraLeadForm.tsx`.

---

## Where to edit content

All marketing copy is plain TypeScript in `/lib/content/`. No CMS yet — edit,
save, redeploy.

| File                            | What's in it                                    |
| ------------------------------- | ----------------------------------------------- |
| `lib/site.ts`                   | Site name, tagline, phone, email, service area  |
| `lib/content/divisions.ts`      | LawnPros / ClearView / SnowLand metadata        |
| `lib/content/services.ts`       | Every service: name, features, cross-sell hints |
| `lib/content/offers.ts`         | Promo offers (set `active: false` to hide)      |
| `lib/content/reviews.ts`        | Customer reviews                                |

### Common edits

**Add a service** — drop a new entry into `lib/content/services.ts` with a
`division` slug and a `pairsWith` list. It will automatically show up on the
relevant division page, the `/services` tab page, the footer (if you add it
there), and the sitemap. (Lead capture is handled by the Aurora form embed —
the `services` data drives marketing pages, not the form itself.)

**Toggle the modal offer** — `lib/content/offers.ts`: set `showInModal: true`
on exactly one offer. Set `active: false` on any offer to remove it everywhere
without deleting it.

**Add a review** — add an entry to `lib/content/reviews.ts`. The home page
preview and average rating will update automatically.

---

## Routes

| Path                       | Purpose                                              |
| -------------------------- | ---------------------------------------------------- |
| `/`                        | Home                                                 |
| `/divisions/lawnpros`      | PVS LawnPros division page                           |
| `/divisions/clearview`     | PVS ClearView division page                          |
| `/divisions/snowland`      | PVS SnowLand division page                           |
| `/services`                | All services, tabbed by division                     |
| `/reviews`                 | All reviews                                          |
| `/quote`                   | Aurora lead form (primary)                           |
| `/contact`                 | Contact info + Aurora lead form                      |
| `/about`                   | Trust / about page                                   |
| `/admin`                   | Stub admin gate                                      |
| `/api/admin/login`         | POST → sets the `pvs_admin` cookie                   |
| `/sitemap.xml`, `/robots.txt` | Auto-generated                                    |

### Lead capture (Aurora Suite)

The `<AuroraLeadForm />` client component in `components/AuroraLeadForm.tsx`
is the **single source of truth for lead capture** across the site. It
renders on:

* `/quote` (primary)
* Each `/divisions/*` page (in-page section with `id="quote-form"`)
* `/contact` (request-a-callback section)

`Get Quote` CTAs on the home page, header, services tabs, and offer cards
all route to `/quote`. CTAs on a division page anchor to `#quote-form` on
the same page so the visitor never leaves.

**Notes on the embed:**

* The iframe URL is HMAC-signed — don't append query params.
* The page listens for `AS_FORM_HEIGHT` postMessage events **only from
  `https://aurorasuite.ca`** for dynamic resize (origin check is enforced).
* Replace the URL in `components/AuroraLeadForm.tsx` if Aurora regenerates
  your form's signature.

---

## Admin

`/admin` is intentionally minimal in v1:

* A single shared password (`ADMIN_PASSWORD` env var)
* Sets an httpOnly cookie on success
* Page is `noindex,nofollow` and excluded from `robots.txt`

**Before launch**, replace this with real auth (NextAuth, Clerk, etc.) and
wire the dashboard to a real data source.

---

## Design system

* Background `#0A0E17`, surface `#111726`, text `#F5F7FA` / `#9AA7BD`
* Primary / ClearView gradient `#3B82F6 → #2563EB`
* LawnPros gradient `#22C55E → #16A34A`
* SnowLand gradient `#38BDF8 → #0EA5E9`
* Cards `rounded-2xl`, buttons `rounded-full`
* Animations: Framer Motion only on hero / entrance; everything else uses
  Tailwind transitions. `prefers-reduced-motion` is respected globally.

---

## Deploying to Vercel

1. Push to GitHub.
2. Import into Vercel.
3. Add the env vars from `.env.example` in the Vercel dashboard.
4. Done — the app router build is supported out of the box.

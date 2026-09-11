# PVS — Setup & Admin Dashboard Guide

A **click-by-click** guide for getting the Prestige View Services website
and its admin dashboard running. You don't need to be a developer — take it
one step at a time.

If anything here is confusing, that's a bug. Tell us and we'll rewrite it.

**Total time:** ~10 minutes the first time.

> **Already live on Vercel and just locked out of `/admin`?**
> Jump to [Locked out? Recovery login](#locked-out-recovery-login).

---

## How the admin dashboard works (read this first)

- The dashboard lives at **`/admin`** on your site. Nothing else to install
  — no separate app, no third-party login service.
- It has its **own login**: an email + password you choose. There is no
  Google/Apple sign-in and no "Clerk" account. Those were removed.
- Two things are required for it to work, both set as **environment
  variables** (settings the site reads at startup):

  | Variable          | What it is                                                                      |
  | ----------------- | ------------------------------------------------------------------------------- |
  | `DATABASE_URL`    | The Postgres database that stores leads, reservations, members, notifications… |
  | `ADMIN_EMAIL`     | The email you sign in with                                                      |
  | `ADMIN_PASSWORD`  | The password you sign in with (10+ characters)                                  |

  `ADMIN_EMAIL` + `ADMIN_PASSWORD` is the **recovery login**. It always
  works — even if you later change your password in the dashboard, and even
  if the database is down. It is the way back in.

- Once you're in, add more admins (each with their own email + password)
  from **Account → Sign-ins** (`/admin/account`).

Everything else (email alerts, photo uploads, analytics) is optional and
can be added later.

---

## What you'll do

1. Install the code dependencies
2. Create your `.env.local` file
3. Create a free Neon database
4. Choose your admin email + password
5. Apply the database schema
6. Run the setup check
7. Start the app and sign in
8. **Deploy to Vercel** (paste the same values there)
9. Turn on email/text alerts (recommended)
10. Optional extras (photos, analytics)

---

## Before you start

- **Node.js 20 or newer.** Check with `node --version`. Download: <https://nodejs.org/>
- **A code editor.** VS Code is free: <https://code.visualstudio.com/>

---

## Step 1 — Install dependencies

In a terminal in the project folder:

```bash
npm install
```

**Success:** the command finishes with no red errors. Yellow warnings are fine.

---

## Step 2 — Make your `.env.local` file

Copy the example:

- **Windows (PowerShell):** `Copy-Item .env.example .env.local`
- **Mac / Linux:** `cp .env.example .env.local`

Leave the file open in your editor — you'll fill in values next.

> Don't rename `.env.example`. Edit only `.env.local`. It is gitignored so
> your secrets stay private.

---

## Step 3 — Create your Neon database

Neon is free and takes 2 minutes.

1. Go to <https://console.neon.tech> and **Sign up** (Google login works).
2. Click **Create project**.
3. Project name: `prestige-view-services`. Region: `us-east-1` (closest to Ottawa).
4. Click **Create project**.
5. Find the **Connection string** box.
6. Make sure **Pooled connection** is **OFF** — migrations need a direct connection.
7. Copy the full string and paste it into `.env.local`:

   ```
   DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```

**Success:** the `DATABASE_URL` line has a real URL, not a placeholder.

> Prefer Supabase? Create a project at <https://supabase.com>, then
> **Project Settings → Database → Connection string → URI**.

---

## Step 4 — Choose your admin email + password

In `.env.local`:

```
ADMIN_EMAIL=you@prestigeviewservices.ca
ADMIN_PASSWORD=a-strong-password-at-least-10-characters
ADMIN_SESSION_SECRET=
```

- `ADMIN_EMAIL` — the address you'll type on the login screen.
- `ADMIN_PASSWORD` — 10+ characters. Treat it like a bank password.
- `ADMIN_SESSION_SECRET` — optional but recommended on the live site. A long
  random string that signs the login cookie. Generate one with:

  ```bash
  node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
  ```

  Changing it later signs every device out (handy if a phone is lost).

---

## Step 5 — Apply the database schema

```bash
npm run db:deploy
```

**Success:** ends with `All migrations have been successfully applied` (or
`Database schema is up to date`).

If you see `Can't reach database server`, your `DATABASE_URL` is wrong —
go back to Step 3.

> On Vercel this step is **automatic**: every deploy runs pending migrations
> before building (see `scripts/vercel-build.mjs`). You only run it by hand
> for local development.

---

## Step 6 — Run the setup check

```bash
npm run setup:check
```

**Success:**

```
✓ DATABASE_URL
✓ ADMIN_EMAIL
✓ ADMIN_PASSWORD

✓ DATABASE_URL connects

All checks passed.
```

Any `✗` line tells you exactly what to fix.

---

## Step 7 — Start the app and sign in

```bash
npm run dev
```

Open <http://localhost:3000/admin>.

1. Enter the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from Step 4.
2. Click **Open dashboard**.

**Success:** you see the **Command Center** with the sidebar (Overview ·
Leads & Sales · Requests · Prestige Club · Operations · Website · Account).

If you see "Admin password not set" → restart the dev server (Ctrl+C, then
`npm run dev`). Env vars only load on startup.

---

## Step 8 — Deploy to Vercel

1. **Push your code to GitHub** (already done if you've been committing).
2. Go to <https://vercel.com>, sign in with the same GitHub account, and
   **Add New… → Project** → import the repo. Vercel auto-detects Next.js.
3. Go to **Settings → Environment Variables** and add (same values as your
   `.env.local`):

   - `DATABASE_URL`
   - `ADMIN_EMAIL`
   - `ADMIN_PASSWORD`
   - `ADMIN_SESSION_SECRET` (recommended)
   - `NEXT_PUBLIC_SITE_URL` = `https://prestigeviewservices.ca`

4. Click **Save**, then **Deployments → ⋯ → Redeploy** to pick up the new
   values. (Env changes never apply to an existing deployment — always
   redeploy after editing them.)

**Success:** your live URL shows the site, and `/admin` accepts the email +
password from Step 4.

> **The build runs `npm run vercel-build`**, which applies any pending
> database migrations and then builds the site. If a migration can't run
> (for example a paused Neon project), the build still finishes and the
> dashboard tells you which table is missing.

---

## Step 9 — Turn on alerts (recommended)

Without this, everything the website captures still lands in the dashboard
(and in **Notifications**), but nothing is emailed or texted to you. The
Command Center shows an amber "alerts are off" banner until it's set.

1. Sign up at <https://resend.com> (free tier is plenty).
2. **Domains → Add domain** → `prestigeviewservices.ca` → add the DNS
   records it shows you → wait for **Verified**.
3. **API Keys → Create** → copy the key.
4. Add to Vercel (and `.env.local`):

   ```
   RESEND_API_KEY=re_...
   LEAD_FROM_EMAIL=PVS Website <alerts@prestigeviewservices.ca>
   OWNER_NOTIFY_EMAIL=you@prestigeviewservices.ca
   ```

5. Redeploy. On the Command Center, click **Send a test alert** to prove it
   end to end.

**Texts too?** Either add Twilio (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`,
`TWILIO_FROM_NUMBER`, `OWNER_NOTIFY_PHONE`) or set `OWNER_SMS_GATEWAY` to
your carrier's email-to-text address — Telus `6137626009@msg.telus.com`,
Bell `6137626009@txt.bell.ca`, Rogers `6137626009@pcs.rogers.com`.

---

## Step 10 — Optional extras

### Photos (`/admin/site/photos`)

The photo manager needs an image host. Cloudinary's free tier is plenty.

1. Sign up at <https://cloudinary.com>.
2. Gear icon → **Settings → API Keys**.
3. Add to `.env.local` and Vercel:

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=000000000000000
   CLOUDINARY_API_SECRET=your-secret
   ```

Without these the photos page shows a friendly "not configured" notice.

### Google Analytics

Add `NEXT_PUBLIC_GA_MEASUREMENT_ID=G-XXXXXXX` (GA4 → Admin → Data Streams →
Web). Vercel Analytics is on automatically with no key.

### Search Console / Bing

`GOOGLE_SITE_VERIFICATION` and `BING_SITE_VERIFICATION` — see
`docs/search-console.md`.

---

## Adding more admins

Every admin has the same full access, so only add people you'd trust with
the whole business.

- **From the dashboard:** **Account → Sign-ins** → **Add admin** → email +
  password. They sign in at `/admin` the same way you do.
- **From a terminal** (works even when nobody can sign in):

  ```bash
  npm run admin                        # list every sign-in
  npm run admin add crew@example.com   # add one, password generated
  npm run admin reset you@example.com  # new password, generated
  npm run admin remove old@example.com
  ```

---

## Saving and moving your leads

Every lead the website captured lives in the database and is never touched
by a deploy — migrations only add tables and columns. To keep your own copy
or move to a new database:

- **Leads inbox → Export CSV** downloads every lead as a spreadsheet.
- **Leads inbox → Backup (JSON)** downloads every intake table (leads,
  quote requests, winter reservations, support tickets, applications).
  Keep one before any hosting change.
- **Leads inbox → Import leads** brings a CSV in — including leads from
  **Aurora Suite**, where the public Get Quote form sends them. Export
  from Aurora as CSV, upload it, done. Re-importing never duplicates.
- From a terminal: `npm run leads export` writes the backup file, and
  `npm run leads import pvs-intake-backup-YYYY-MM-DD.json --to "<new DATABASE_URL>"`
  restores it into another database.

---

## Locked out? Recovery login

Signing in with **`ADMIN_EMAIL` + `ADMIN_PASSWORD` from Vercel** always
works, whatever was changed in the dashboard. To check what the live site
actually has, open `/admin` while signed out and expand **Can't get in?** —
it lists which of `ADMIN_PASSWORD`, `ADMIN_EMAIL`, `ADMIN_SESSION_SECRET`
the deployment has set (no values, just set / missing).

- **`ADMIN_PASSWORD` missing** → Vercel → Settings → Environment Variables →
  add it → Redeploy. Sign-in cannot work without it.
- **Forgot the recovery password** → set a new `ADMIN_PASSWORD` in Vercel
  and redeploy. There is nothing to "reset" — the env var *is* the password.
- **Wrong email** → the login screen shows a masked hint like `g***@o***.com`.
  Fix `ADMIN_EMAIL` in Vercel and redeploy.
- **Still stuck** → `npm run admin reset you@example.com` from a terminal
  with `DATABASE_URL` in `.env.local`.

---

## Troubleshooting

**Vercel build fails with "npm ci can only install packages when your
package.json and package-lock.json are in sync".**
Run `npm install` locally, commit the updated `package-lock.json`, push.
Vercel uses `npm ci`, which refuses to build from an out-of-date lock file.

**Dashboard says "The admin sign-in table does not exist" / "run `npm run db:deploy`".**
A migration hasn't reached the live database. Since `vercel-build` was added
this happens only when the migration itself failed — check the build log
for `[vercel-build] WARNING`. Usual fix: use the **direct** (non-pooled)
Neon connection string for `DATABASE_URL`, then Redeploy. Or run
`npm run db:deploy` locally with the production `DATABASE_URL`.

**"Admin password not set" on the live site.**
`ADMIN_PASSWORD` isn't in Vercel's env vars, or was added without a
redeploy. Add it, then Deployments → Redeploy.

**I changed an env var and nothing happened.**
Env vars only load at build/startup. Locally: restart `npm run dev`. On
Vercel: Deployments → Redeploy.

**`npm run db:deploy` fails with "Can't reach database server".**
- Does `DATABASE_URL` end in `?sslmode=require`?
- Open the Neon dashboard — is the project active (not paused)?
- `npm run setup:check` tells you exactly where the connection fails.

**Alerts banner says email is off / mail never arrives.**
`RESEND_API_KEY` missing, or `LEAD_FROM_EMAIL` unset so mail goes out as
`onboarding@resend.dev` (Resend's sandbox sender only delivers to the Resend
account owner). Verify your domain in Resend and set `LEAD_FROM_EMAIL`.

**Mac/Linux says `command not found: npx`.**
Reinstall Node.js from <https://nodejs.org/>.

**Anything else.**
Run `npm run setup:check` first. After that, the dev server terminal output
is the best place to look. For Vercel: **Project → Deployments → click the
latest → Build Logs**.

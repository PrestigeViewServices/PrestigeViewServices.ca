# PVS Phase 1 — Setup Guide

A **click-by-click** guide for getting the Prestige View Services admin
portal running. You don't need to be a developer to follow it — take it
one step at a time.

If anything here is confusing, that's a bug. Tell us and we'll rewrite it.

**Total time:** ~15 minutes the first time.

There are two parallel paths:

- **Local dev** (Steps 1–12) — run it on your computer at `http://localhost:3000`.
- **Vercel production** (Step 13) — make it live on the internet at your real domain.

They share the same env vars. Set them once locally, then copy them into Vercel.

---

## What you'll do

1. Install the code dependencies
2. Create your `.env.local` file
3. Create a free Clerk account + app
4. **Set Clerk sign-up mode to Public** (otherwise sign-up is blocked)
5. Copy your Clerk keys into `.env.local`
6. Set the ultimate-admin email
7. Create a free Neon database
8. Apply the database schema
9. Run the setup check
10. Start the app
11. Sign in for the first time
12. Verify the role gates
13. **Deploy to Vercel** (paste the same env vars there)

Optional extras (Cloudinary for photos, Clerk webhook for user sync) are at the bottom.

---

## Before you start

- **Node.js 20 or newer.** Check by running `node --version`. Download: <https://nodejs.org/>
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

> Don't rename `.env.example`. Edit only `.env.local`. `.env.local` is gitignored so your secrets stay private.

---

## Step 3 — Create your Clerk app

Clerk handles all sign-in / sign-up. Free for hundreds of monthly users.

1. Go to <https://dashboard.clerk.com> and **Sign up** (Google login works).
2. Click **Create application** (top-right).
3. Name: `Prestige View Services`.
4. Under **How will your users sign in?** turn ON:
   - ✅ Google
   - ✅ Apple
   - ✅ Email
   - ✅ Phone number
5. Click **Create application**.

**Success:** you land on your new app's Clerk dashboard.

---

## Step 4 — Set Sign-up Mode to Public

> ⚠️ **Do this NOW or sign-up will fail with**
> *"…is not allowed to access this application."*
>
> By default some Clerk apps ship in restricted mode. You need to flip it.

1. In the Clerk dashboard sidebar, click **Configure** → **Restrictions**.
   (In older Clerk UIs: **User & Authentication → Restrictions**.)
2. Find **Sign-up mode**.
3. Set it to **Public** (anyone can sign up).
4. Save.

> Want to lock sign-up to specific people? Leave it on **Restricted** and add invitations under the same page — but for setup/testing, Public is what you want.

---

## Step 5 — Copy your Clerk keys

1. In the Clerk sidebar, click **API Keys**.
2. You'll see two values:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...` (click the eye icon to reveal)
3. Paste them into `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_paste_yours_here
CLERK_SECRET_KEY=sk_test_paste_yours_here
```

> ⚠️ The secret key is like a password. Never put it in Slack, email, or screenshots.

---

## Step 6 — Set the ultimate-admin email

In `.env.local`, find:

```
ULTIMATE_ADMIN_EMAILS=REPLACE_WITH_YOUR_EMAIL@prestigeviewservices.ca
```

Replace it with the email **you'll sign in with**:

```
ULTIMATE_ADMIN_EMAILS=you@prestigeviewservices.ca
```

The first time you sign in with that exact email, the app **auto-promotes you to `ultimate_admin`** on the `/post-sign-in` page. The UI can never grant this role — only this env var can.

Multiple emails are allowed (comma-separated):

```
ULTIMATE_ADMIN_EMAILS=you@prestigeviewservices.ca,partner@prestigeviewservices.ca
```

---

## Step 7 — Create your Neon database

Neon is free and takes 2 minutes.

1. Go to <https://console.neon.tech> and **Sign up** (Google login works).
2. Click **Create project**.
3. Project name: `prestige-view-services`. Region: `us-east-1` (closest to Ottawa).
4. Click **Create project**.
5. Find the **Connection string** box.
6. Make sure **Pooled connection** is **OFF** — we need a direct connection for migrations.
7. Copy the full string:

   ```
   postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```

8. Paste it into `.env.local`:

   ```
   DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```

**Success:** the `DATABASE_URL` line has a real URL, not a placeholder.

> Prefer Supabase? Create a project at <https://supabase.com>, then **Project Settings → Database → Connection string → URI**. Paste into `DATABASE_URL` the same way.

---

## Step 8 — Apply the database schema

```bash
npm run db:migrate
```

When Prisma asks for a migration name, type `init` and press Enter.

**Success:**

```
✔ Generated Prisma Client
The following migration(s) have been created and applied: ...
```

If you see `Can't reach database server`, your `DATABASE_URL` is wrong — go back to Step 7.

---

## Step 9 — Run the setup check

```bash
npm run setup:check
```

**Success:**

```
✓ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✓ CLERK_SECRET_KEY
✓ DATABASE_URL
✓ ULTIMATE_ADMIN_EMAILS

✓ DATABASE_URL connects

All checks passed. Run `npm run dev` next.
```

Any `✗` line tells you exactly what to fix.

---

## Step 10 — Start the app

```bash
npm run dev
```

Open <http://localhost:3000>.

**Success:** the PVS marketing site loads.

---

## Step 11 — Sign in for the first time

1. Click **Sign in** in the top-right corner.
2. Use the **exact email** from `ULTIMATE_ADMIN_EMAILS`.
3. Pick any enabled sign-in method (Google is easiest).
4. After sign-in, you land on `/post-sign-in` which detects your role and redirects to **/admin** automatically.

**Success:** you see the admin dashboard with the sidebar (**Overview · Applications · Photos · Reviews · Support · Loyalty · Users · Site Modifications**).

If you instead see "Clerk not configured" → restart the dev server (Ctrl+C, then `npm run dev`). Env vars only load on startup.

If you get *"…is not allowed to access this application"* → you skipped Step 4. Go set Sign-up Mode to **Public** in Clerk and try again.

---

## Step 12 — Verify the role gates

1. **Users** in the sidebar → you should see at least your own user.
2. **Site Modifications** → you should see the hub page (Photos tile is "Live", others say "Phase 2").
3. (Optional) Have a teammate sign up with a different email. In **Users**, change their role to `admin` from the dropdown.
4. Have them visit `/admin/users` → they see the user list with role dropdowns **disabled** (admins can view but not change).
5. Have them visit `/admin/site` → they're **redirected** (only ultimate_admin can access).

If all five behave as described, role gates are working.

---

## Step 13 — Deploy to Vercel

Once your local app works, push to production.

1. **Push your code to GitHub** (already done if you've been committing).
2. Go to <https://vercel.com> and sign up (use the same GitHub account).
3. Click **Add New… → Project**.
4. Import the `prestige-view-services` repo.
5. Vercel auto-detects Next.js. Click **Deploy** — the first deploy will fail if env vars aren't set yet, which is expected.
6. Once the project exists, go to **Settings → Environment Variables** and add (paste the same values you have in `.env.local`):

   - `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`
   - `CLERK_SECRET_KEY`
   - `ULTIMATE_ADMIN_EMAILS`
   - `DATABASE_URL`
   - (optional) `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — needed for `/admin/site/photos` uploads
   - (optional) `CLERK_WEBHOOK_SECRET` — see "Optional extras" below
   - (optional) `NEXT_PUBLIC_GA_MEASUREMENT_ID` — for Google Analytics

7. Click **Save**, then **Deployments → Redeploy** to pick up the new env vars.

**Success:** your live URL (e.g. `https://prestige-view-services.vercel.app` or your custom domain) shows the same marketing site, and signing in works exactly like in local dev.

> Watching the deploy from your terminal? Run `npx vercel login` then `npx vercel link` once, then `npx vercel deployments` lists every build with its status.

---

## Optional extras

### Cloudinary (for `/admin/site/photos` uploads)

The photo manager needs an image host. Cloudinary's free tier is plenty.

1. Sign up at <https://cloudinary.com>.
2. From the dashboard, click the gear → **Settings → API Keys**.
3. Add to `.env.local` (and to Vercel):

   ```
   CLOUDINARY_CLOUD_NAME=your-cloud-name
   CLOUDINARY_API_KEY=000000000000000
   CLOUDINARY_API_SECRET=your-secret
   ```

Without these, the photos page renders a friendly "Cloudinary isn't configured" notice and the upload form is read-only.

### Clerk webhook (Users dashboard auto-population)

**This is now optional.** The `/post-sign-in` page handles role assignment without it. The webhook is only needed if you want the **Users** dashboard view to populate automatically with every user (instead of only the signed-in ones who've been routed through `/post-sign-in`).

For Vercel production:

1. Clerk dashboard → **Webhooks** → **Add Endpoint**.
2. Endpoint URL: `https://your-vercel-domain/api/clerk/webhook`.
3. Subscribe to `user.created`, `user.updated`, `user.deleted`.
4. Click **Create**. Copy the **Signing Secret** (`whsec_...`).
5. Add to Vercel env vars as `CLERK_WEBHOOK_SECRET`.

For local development, point the webhook at an ngrok tunnel: <https://ngrok.com>, then `ngrok http 3000`, then use the `https://...ngrok-free.app/api/clerk/webhook` URL.

---

## Troubleshooting

**"…is not allowed to access this application" when signing up.**
This is the Clerk "Sign-up mode" setting blocking you. Go to **Configure → Restrictions → Sign-up mode** and set it to **Public**. Step 4 above covers this. If you'd rather restrict, add an invitation for your email on the same page.

**"Clerk not configured" still shows after I added the keys.**
Restart the dev server (Ctrl+C, then `npm run dev`). Env vars only load on startup. On Vercel: hit **Deployments → Redeploy** after changing env vars.

**`npm run db:migrate` fails with "Can't reach database server".**
- Check `DATABASE_URL` — does it end in `?sslmode=require`?
- Run `npm run setup:check` — it'll tell you exactly where the connection fails.
- Open the Neon dashboard. Is the project active (not paused)?

**I signed in but I'm a `customer`, not `ultimate_admin`.**
The email you signed in with doesn't exactly match `ULTIMATE_ADMIN_EMAILS`. Typos, different casing, or the wrong account are the usual causes. Fix the env var, restart the dev server (or redeploy on Vercel), sign out, sign back in. `/post-sign-in` re-checks on next sign-in and promotes you.

**Vercel build failing with `Missing publishableKey`.**
Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` to Vercel's env vars and redeploy. Clerk's keyless mode works for local `next dev` only — production builds need real keys.

**Mac/Linux says `command not found: npx`.**
Reinstall Node.js from <https://nodejs.org/>. The installer adds `npx` automatically.

**Anything else.**
Run `npm run setup:check` first — it usually identifies the problem. After that, the dev server terminal output is the best place to look. For Vercel, **Project → Deployments → click the latest → Build Logs** shows the error.

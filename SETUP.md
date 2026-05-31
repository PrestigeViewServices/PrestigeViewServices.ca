# PVS Phase 1 — Setup Guide

This is a **click-by-click** guide for getting the Prestige View Services
admin portal running on your machine for the first time. You don't need to
be a developer to follow it — just take it one step at a time.

If anything in here is confusing, that's a bug. Tell us and we'll rewrite it.

**Total time:** about 15 minutes the first time.

---

## What you'll do

1. Install the code dependencies
2. Create a free Clerk account (for sign-in)
3. Enable Google / Apple / email / phone sign-in in Clerk
4. Copy your Clerk keys
5. Create a free Neon database (for storing applications + users)
6. Paste everything into `.env.local`
7. Apply the database schema
8. Run the setup check
9. Start the app
10. Sign in for the first time and verify the dashboard loads

At the end you'll see the real admin dashboard, not the "Clerk not configured" placeholder.

---

## Before you start

You need these installed on your computer. If you already have them, skip ahead.

- **Node.js 20 or newer.** Check by running `node --version` in a terminal.
  Download: <https://nodejs.org/>
- **A code editor.** VS Code is free and recommended: <https://code.visualstudio.com/>

---

## Step 1 — Install dependencies

Open a terminal in the project folder and run:

```bash
npm install
```

**What success looks like:** the command finishes with no red errors. It might say `added N packages in Xs`. Yellow warnings are fine.

---

## Step 2 — Make your `.env.local` file

Copy the example file:

- **Windows (PowerShell):** `Copy-Item .env.example .env.local`
- **Mac / Linux:** `cp .env.example .env.local`

You'll fill in the values in the next steps. Leave the file open in your code editor.

> Don't rename `.env.example` — leave it as-is and only edit `.env.local`. `.env.local` is ignored by git so your secrets stay private.

---

## Step 3 — Create your Clerk app

Clerk handles all sign-in/sign-up. It's free for hundreds of monthly users.

1. Go to <https://dashboard.clerk.com> and **Sign up** (Google sign-in works fine).
2. Once you're in, click **Create application** (top-right).
3. Give it a name like `Prestige View Services`.
4. Under **How will your users sign in?** turn ON these toggles:
   - ✅ Google
   - ✅ Apple
   - ✅ Email
   - ✅ Phone number
5. Click **Create application**.

**What success looks like:** you land on the Clerk dashboard for your new app.

---

## Step 4 — Copy your Clerk keys

1. In the Clerk sidebar, click **API Keys**.
2. You'll see two values:
   - **Publishable key** — starts with `pk_test_...`
   - **Secret key** — starts with `sk_test_...` (click the eye icon to reveal it)
3. Copy each into `.env.local`:

```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_paste_yours_here
CLERK_SECRET_KEY=sk_test_paste_yours_here
```

> ⚠️ The secret key is like a password. Never put it in Slack, email, screenshots, or any public place.

---

## Step 5 — Set the ultimate-admin email

In `.env.local`, find this line:

```
ULTIMATE_ADMIN_EMAILS=REPLACE_WITH_YOUR_EMAIL@prestigeviewservices.ca
```

Replace it with the email **you will sign in with**:

```
ULTIMATE_ADMIN_EMAILS=you@prestigeviewservices.ca
```

This is the ONLY way to get the `ultimate_admin` role. The first time you sign in with this exact email, the app automatically gives you full access. The UI can never assign this role to anyone.

You can add multiple emails separated by commas if you have a business partner:

```
ULTIMATE_ADMIN_EMAILS=you@prestigeviewservices.ca,partner@prestigeviewservices.ca
```

---

## Step 6 — Create your Neon database

Neon is free and takes 2 minutes.

1. Go to <https://console.neon.tech> and **Sign up** (Google sign-in works).
2. Click **Create project**.
3. Project name: `prestige-view-services`. Region: pick the one closest to Ottawa (`us-east-1` is fine).
4. Click **Create project**.
5. On the next screen, look for the **Connection string** box.
6. Make sure the **Pooled connection** toggle is **OFF** (we need a direct connection for migrations).
7. Copy the full string — it looks like:
   ```
   postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```
8. Paste it into `.env.local`:
   ```
   DATABASE_URL=postgresql://username:password@ep-xxxx.neon.tech/neondb?sslmode=require
   ```

**What success looks like:** the `DATABASE_URL` line in `.env.local` has a real-looking URL, not the placeholder.

> Prefer Supabase? Steps are similar: create a project at <https://supabase.com>, then **Project Settings → Database → Connection string → URI**. Paste it into `DATABASE_URL` the same way.

---

## Step 7 — Apply the database schema

In your terminal, in the project folder, run:

```bash
npm run db:migrate
```

The first time, Prisma will ask for a migration name. Type `init` and press Enter.

**What success looks like:** you see something like
```
✔ Generated Prisma Client
The following migration(s) have been created and applied: ...
```

If you get an error like `Can't reach database server`, your `DATABASE_URL` is wrong — go back to Step 6, copy it again, and rerun.

---

## Step 8 — Set up the Clerk webhook

This is what keeps Clerk users in sync with the database. Without it, sign-in still works but the Users view in the dashboard won't populate.

> **Skip this for now if you just want to try it locally.** The dashboard will work; only the Users view will be empty until you do this. Come back when you deploy.

For local development:

1. In the Clerk dashboard sidebar, click **Webhooks**.
2. Click **Add Endpoint**.
3. **Endpoint URL:** if you're testing locally, install ngrok (<https://ngrok.com>) and run `ngrok http 3000`, then paste the ngrok URL + `/api/clerk/webhook`. Otherwise use your deployed URL.
4. **Subscribe to events:** check `user.created`, `user.updated`, `user.deleted`.
5. Click **Create**.
6. On the next screen, copy the **Signing Secret** (starts with `whsec_`).
7. Paste it in `.env.local`:
   ```
   CLERK_WEBHOOK_SECRET=whsec_paste_yours_here
   ```

---

## Step 9 — Run the setup check

Confirm everything is wired up before starting the app:

```bash
npm run setup:check
```

**What success looks like:**
```
Reading .env.local

✓ NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
✓ CLERK_SECRET_KEY
✓ DATABASE_URL
✓ ULTIMATE_ADMIN_EMAILS

✓ DATABASE_URL connects

All checks passed. Run `npm run dev` next.
```

If any line shows `✗`, the message tells you exactly what to fix. Fix it and rerun.

---

## Step 10 — Start the app

```bash
npm run dev
```

Open <http://localhost:3000> in your browser.

**What success looks like:** you see the PVS marketing site.

---

## Step 11 — Sign in for the first time

1. Click **Sign in** in the top-right corner.
2. Use the **same email** you put in `ULTIMATE_ADMIN_EMAILS`.
3. Pick any sign-in method you enabled (Google is easiest).
4. Once signed in, navigate to <http://localhost:3000/admin>.

**What success looks like:** you see the admin dashboard with the sidebar containing **Overview · Applications · Support · Loyalty · Users · Site Modifications**.

If you see "Clerk not configured" instead, double-check Step 4 and restart the dev server (Ctrl+C, then `npm run dev` again — env vars only load on startup).

---

## Step 12 — Verify the role gates

To confirm everything is working correctly:

1. In the sidebar, click **Users**. You should see at least your own user.
2. In the sidebar, click **Site Modifications**. You should see the Phase 2 placeholder.
3. (Optional) Have someone else sign in with a different email. Then in your **Users** view, change their role to `admin` from the dropdown.
4. Have them visit `/admin/users` — they should see the user list with the role dropdowns **disabled** (admins can view but not change roles).
5. Have them visit `/admin/site` — they should be **redirected to `/admin`** (only ultimate_admin can access).

If all five steps behave as described, role gates are working correctly.

---

## You're done

The portal is fully set up. From here:

- Add real career roles in `lib/content/careers.ts`
- Wire the email-notification stubs in `lib/send-*-email.ts` to Resend or SMTP
- Configure analytics by setting `NEXT_PUBLIC_GA_MEASUREMENT_ID`
- Deploy to Vercel (the env vars all transfer — just paste them in the Vercel dashboard)

---

## Troubleshooting

**"Clerk not configured" still shows after I added the keys.**
You need to restart the dev server after editing `.env.local`. Press Ctrl+C in the terminal running `npm run dev`, then run `npm run dev` again.

**`npm run db:migrate` fails with "Can't reach database server".**
- Check `DATABASE_URL` in `.env.local` — does it have `?sslmode=require` at the end?
- Try `npm run setup:check` — it'll tell you if the connection fails.
- Open the Neon dashboard. Is the project active (not "paused" or "suspended")?

**I signed in but I'm a `customer`, not `ultimate_admin`.**
The email you signed in with doesn't exactly match `ULTIMATE_ADMIN_EMAILS`. Common causes: typos, different casing, signed in with a different account. Update `ULTIMATE_ADMIN_EMAILS` to match exactly, restart the dev server, sign out, sign back in.

**Mac/Linux says `command not found: npx`.**
Reinstall Node.js from <https://nodejs.org/>. The installer adds `npx` automatically.

**Anything else.**
Run `npm run setup:check` first — it usually identifies the problem. If it doesn't, the dev server's terminal output is the best place to look.

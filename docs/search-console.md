# Google Search Console + Bing Webmaster Tools — Setup

The site is live at https://prestigeviewservices.ca with a 176-URL sitemap.
Submitting it to Google + Bing tells the crawlers what exists and starts
the indexing clock. This is a 5-minute job per search engine.

---

## Google Search Console (do this first)

### Step 1 — Add the property

1. Go to **https://search.google.com/search-console**
2. **Add Property** → pick **URL prefix** (not Domain — simpler verification)
3. Enter: `https://prestigeviewservices.ca`
4. Click **Continue**

### Step 2 — Verify ownership via HTML tag (recommended)

Google offers several methods. Use **HTML tag** because the site already
has a `<verification>` slot wired up — you only need to paste the code.

1. Pick **HTML tag** from the verification options
2. Google shows a `<meta>` tag like:
   ```html
   <meta name="google-site-verification" content="ABC123_long_random_string_here">
   ```
3. **Copy only the value inside `content="..."`** — i.e. `ABC123_long_random_string_here`, not the whole tag
4. Reply here with the code and I'll:
   - Set `GOOGLE_SITE_VERIFICATION=<code>` in `.env.local`
   - Push it to Vercel production env
   - Trigger a redeploy
5. Once redeployed (~1 min), go back to Search Console and click **Verify**

### Step 3 — Submit the sitemap

After verification passes:

1. Sidebar → **Sitemaps**
2. Enter: `sitemap.xml`
3. **Submit**

Google will start crawling all **176 URLs** within hours, full indexing in
days. Track progress in the **Pages** report.

---

## Bing Webmaster Tools (10 min after Google)

Bing serves ~5% of search traffic but is the default on Windows + powers
DuckDuckGo. Worth the 5 minutes.

### Step 1 — Add the site

1. Go to **https://www.bing.com/webmasters**
2. Sign in with a Microsoft account
3. **Import from GSC** is the easiest — if you signed into the same Google
   account as Search Console, Bing can copy the verified site over in one
   click. Otherwise, **Add a site manually** → `https://prestigeviewservices.ca`

### Step 2 — Verify (only if you skipped the GSC import)

1. Pick **Meta tag** verification
2. Bing shows a tag like:
   ```html
   <meta name="msvalidate.01" content="ABCDEF1234567890">
   ```
3. Reply with the code value — I'll set `BING_SITE_VERIFICATION` in
   `.env.local` + Vercel + redeploy

### Step 3 — Submit the sitemap

1. Sidebar → **Sitemaps**
2. Submit: `https://prestigeviewservices.ca/sitemap.xml`

---

## What to expect after submission

| Timeline | What happens |
|---|---|
| Day 1 | Google + Bing start crawling. Sitemap shows "Submitted" status. |
| Day 2-7 | Most pages indexed. Search Console "Pages" report fills in. |
| Day 7-30 | First impressions show up in **Performance** report. |
| Day 30+ | Rankings stabilize. Look for "<service> + <city>" queries. |

---

## When you have the Google verification code

Just paste it back here. The technical work is one env update + a redeploy —
under 2 minutes.

The same applies for Bing — paste the code, I'll wire it up.

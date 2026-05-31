# Images — drop your files here

Every image on the site reads from this folder. All filenames are
**lowercase, hyphen-separated, no spaces** so they work on Vercel
(case-sensitive filesystem) and Windows alike.

If a file is missing, the matching component falls back gracefully:

- **Logos** → fall back to a text + icon lockup. Page still renders cleanly.
- **Gallery photos** → entries are driven by `lib/content/gallery.ts`; if a
  file is missing, only that tile is broken (the rest of the page is fine).

---

## Logos

| File                                | Used in                                   | Recommended size       |
| ----------------------------------- | ----------------------------------------- | ---------------------- |
| `logo.png`                          | Header, footer, mobile menu, master OG    | **≥ 2000 × 500 px**, ~4:1 ratio, transparent background (PNG or SVG) |
| `divisions/lawnpros.png`            | `/divisions/lawnpros` hero                | 2000 × 500 px, transparent |
| `divisions/clearview.png`           | `/divisions/clearview` hero               | 2000 × 500 px, transparent |
| `divisions/snowland.png`            | `/divisions/snowland` hero                | 2000 × 500 px, transparent |

**Format:** PNG with transparency is the safe default. SVG also works — if
you switch to SVG, change the file extension everywhere the component
references it (`logo.svg`, `divisions/lawnpros.svg`, etc.).

> The master logo is rendered against a dark background on every page,
> so make sure the wordmark and tagline are legible on `#0A0E17`. Light or
> outlined strokes work best.

---

## Gallery (recent work)

The home page "Recent Work" strip and any future before/after sections read
from `/public/images/gallery/`. Add files there, then add a matching entry
to **`lib/content/gallery.ts`**.

Recommended specs for new photos:

- **Aspect ratio:** 3:2 landscape (e.g., 1600 × 1067)
- **Format:** JPG (photos) or WebP. PNG only if you need transparency.
- **Size:** ≤ 400 KB after export. Next.js will auto-generate responsive
  variants — you don't need to upload multiple sizes.

Suggested starter filenames (sync with `lib/content/gallery.ts`):

| File                              | What to show                                  |
| --------------------------------- | --------------------------------------------- |
| `gallery/lawn-after.jpg`          | A freshly mowed Petawawa lawn                 |
| `gallery/windows-after.jpg`       | Streak-free window cleaning result            |
| `gallery/pressure-washing.jpg`    | Restored driveway / patio                     |
| `gallery/snow-driveway.jpg`       | Cleared driveway after a storm                |
| `gallery/gutter-cleaning.jpg`     | Gutter clean-out crew shot                    |
| `gallery/sample.svg`              | Built-in dark-themed placeholder (ships in repo) |

You don't have to use these exact names — just keep them lowercase,
hyphen-separated, and update `lib/content/gallery.ts` so the captions and
file paths match.

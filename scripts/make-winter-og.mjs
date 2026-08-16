/**
 * Generates the OpenGraph card for /winter-packages.
 *
 *   node scripts/make-winter-og.mjs
 *
 * Produces public/images/og-winter-packages.png (1200×630) by compositing a
 * text layer over one of the night tractor photos. Re-run this after changing
 * the headline or the brand colours. Committed output, not a build step, so
 * the site never depends on sharp at deploy time.
 */
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve(import.meta.dirname, "..");
const PHOTO = path.join(
  ROOT,
  "public/images/gallery/snow-removal/night-tractor-snowblowing-headlights.webp"
);
const LOGO = path.join(ROOT, "public/images/logo.png");
const OUT = path.join(ROOT, "public/images/og-winter-packages.png");

const W = 1200;
const H = 630;

/** Escape text destined for an SVG text node. */
const esc = (s) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const overlay = `
<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="scrim" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%"   stop-color="#0A1220" stop-opacity="0.96"/>
      <stop offset="58%"  stop-color="#0A1220" stop-opacity="0.86"/>
      <stop offset="100%" stop-color="#0A1220" stop-opacity="0.42"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#scrim)"/>
  <rect x="0" y="0" width="10" height="${H}" fill="#7DD3FC"/>

  <text x="72" y="228" fill="#7DD3FC"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="24" font-weight="700" letter-spacing="4">
    ${esc("PETAWAWA · NEW: PEMBROKE")}
  </text>

  <text x="72" y="312" fill="#FFFFFF"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="66" font-weight="700">
    ${esc("Seasonal Snow Passes")}
  </text>

  <text x="72" y="382" fill="#FFFFFF"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="66" font-weight="700">
    ${esc("Bronze to Platinum")}
  </text>

  <text x="72" y="446" fill="#CBE4F7"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="27" font-weight="400">
    ${esc("Storms trigger us automatically. You never make a call.")}
  </text>

  <rect x="72" y="492" width="376" height="54" rx="27" fill="#7DD3FC"/>
  <text x="260" y="527" fill="#0A1220" text-anchor="middle"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="22" font-weight="700">
    ${esc("Free quote, no payment today")}
  </text>

  <text x="476" y="528" fill="#8FB6D4"
        font-family="Inter, Segoe UI, Helvetica, Arial, sans-serif"
        font-size="23" font-weight="500">
    ${esc("(613) 334-5858")}
  </text>
</svg>`;

const logo = await sharp(await readFile(LOGO))
  .resize({ height: 58, fit: "inside" })
  .png()
  .toBuffer();

const png = await sharp(await readFile(PHOTO))
  .resize(W, H, { fit: "cover", position: "right" })
  .composite([
    { input: Buffer.from(overlay), top: 0, left: 0 },
    { input: logo, top: 72, left: 72 },
  ])
  .png({ compressionLevel: 9 })
  .toBuffer();

await writeFile(OUT, png);
console.log(`Wrote ${path.relative(ROOT, OUT)} (${(png.length / 1024).toFixed(0)} kB)`);

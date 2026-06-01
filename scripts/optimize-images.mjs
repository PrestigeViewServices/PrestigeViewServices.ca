#!/usr/bin/env node
/**
 * One-shot image optimization for /public/images/gallery/**.
 *
 * Two passes:
 *  1. HEIC → JPG conversion for the 4 .heic files in Photos/Gutter Cleaning/
 *  2. Resize + recompress every gallery JPG so it lands well under the
 *     400 KB target called out in /public/images/README.md.
 *
 * Idempotent — re-running it on already-compressed files just re-encodes
 * them to the same target and overwrites in place.
 *
 * Run with:  node scripts/optimize-images.mjs
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import heicConvert from "heic-convert";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const GALLERY_DIR = path.join(repoRoot, "public", "images", "gallery");
const HEIC_SRC_DIR = path.join(repoRoot, "Photos", "Gutter Cleaning");
const HEIC_OUT_DIR = path.join(GALLERY_DIR, "gutter-cleaning");

const MAX_DIMENSION = 1800; // px (longest edge)
const JPEG_QUALITY = 78;

/** Convert all .heic files in HEIC_SRC_DIR to JPG in HEIC_OUT_DIR. */
async function convertHeicFiles() {
  let count = 0;
  const entries = await fs.readdir(HEIC_SRC_DIR);
  const heicFiles = entries.filter((e) => e.toLowerCase().endsWith(".heic"));

  // Find the highest existing gutter-job-NN number so we append after it.
  const out = await fs.readdir(HEIC_OUT_DIR).catch(() => []);
  const nums = out
    .map((f) => f.match(/^gutter-job-(\d+)\.jpg$/i))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  let nextNum = nums.length ? Math.max(...nums) + 1 : 1;

  for (const file of heicFiles) {
    const srcPath = path.join(HEIC_SRC_DIR, file);
    const buf = await fs.readFile(srcPath);
    const jpgBuf = await heicConvert({
      buffer: buf,
      format: "JPEG",
      quality: 0.9,
    });

    // Pipe through sharp to get the same compression/resize treatment as
    // everything else in this pass.
    const optimised = await sharp(Buffer.from(jpgBuf))
      .rotate() // honour EXIF orientation
      .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toBuffer();

    const outName = `gutter-job-${String(nextNum).padStart(2, "0")}.jpg`;
    const outPath = path.join(HEIC_OUT_DIR, outName);
    await fs.writeFile(outPath, optimised);
    console.log(
      `  HEIC→JPG  ${file}  →  ${outName}  (${(optimised.length / 1024).toFixed(0)} KB)`
    );
    nextNum++;
    count++;
  }
  return count;
}

/** Walk GALLERY_DIR, recompress every JPG in place. */
async function compressGalleryJpgs() {
  let count = 0;
  let beforeBytes = 0;
  let afterBytes = 0;

  async function walk(dir) {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    for (const e of entries) {
      const full = path.join(dir, e.name);
      if (e.isDirectory()) {
        await walk(full);
        continue;
      }
      if (!/\.(jpe?g)$/i.test(e.name)) continue;

      const before = await fs.readFile(full);
      beforeBytes += before.length;

      const out = await sharp(before)
        .rotate()
        .resize({ width: MAX_DIMENSION, height: MAX_DIMENSION, fit: "inside", withoutEnlargement: true })
        .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
        .toBuffer();

      // Only write if we actually shrunk it (avoid making files bigger).
      if (out.length < before.length) {
        await fs.writeFile(full, out);
        afterBytes += out.length;
        console.log(
          `  shrink   ${path.relative(repoRoot, full)}  ${(before.length / 1024).toFixed(0)} → ${(out.length / 1024).toFixed(0)} KB`
        );
      } else {
        afterBytes += before.length;
        console.log(
          `  keep     ${path.relative(repoRoot, full)}  ${(before.length / 1024).toFixed(0)} KB (already smaller)`
        );
      }
      count++;
    }
  }
  await walk(GALLERY_DIR);
  return { count, beforeBytes, afterBytes };
}

(async () => {
  console.log("\n[1/2] HEIC → JPG conversion");
  const heicCount = await convertHeicFiles();
  console.log(`  Done. Converted ${heicCount} HEIC file(s).`);

  console.log("\n[2/2] Recompress all gallery JPGs");
  const { count, beforeBytes, afterBytes } = await compressGalleryJpgs();
  const mbBefore = (beforeBytes / 1024 / 1024).toFixed(2);
  const mbAfter = (afterBytes / 1024 / 1024).toFixed(2);
  const saved = (((beforeBytes - afterBytes) / beforeBytes) * 100).toFixed(1);
  console.log(
    `  Done. Processed ${count} files.  ${mbBefore} MB → ${mbAfter} MB  (${saved}% smaller)`
  );
})().catch((err) => {
  console.error("Image optimization failed:", err);
  process.exit(1);
});

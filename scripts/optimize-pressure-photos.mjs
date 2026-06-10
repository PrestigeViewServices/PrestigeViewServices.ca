#!/usr/bin/env node
/**
 * Generic one-shot importer for a folder of job photos.
 *
 * Reads each .jpg/.jpeg from --src, honours EXIF rotation, resizes to
 * MAX_DIMENSION on the longest edge, recompresses to JPEG q78, and writes
 * the result into --out as `<prefix>-NN.jpg` starting from the next free
 * slot (so re-running picks up new files without overwriting old ones).
 *
 * Usage:
 *   node scripts/optimize-pressure-photos.mjs \
 *     --src "../Pressure Wash 5june" \
 *     --out public/images/gallery/pressure-washing \
 *     --prefix pressure-job
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx === -1 || idx === process.argv.length - 1) return null;
  return process.argv[idx + 1];
}

const SRC_DIR = path.resolve(repoRoot, getArg("src") ?? "../Pressure Wash 5june");
const OUT_DIR = path.resolve(
  repoRoot,
  getArg("out") ?? "public/images/gallery/pressure-washing"
);
const PREFIX = getArg("prefix") ?? "pressure-job";

const MAX_DIMENSION = 1800;
const JPEG_QUALITY = 78;

async function nextNumber() {
  const existing = await fs.readdir(OUT_DIR).catch(() => []);
  const re = new RegExp(`^${PREFIX}-(\\d+)\\.jpg$`, "i");
  const nums = existing
    .map((f) => f.match(re))
    .filter(Boolean)
    .map((m) => parseInt(m[1], 10));
  return nums.length ? Math.max(...nums) + 1 : 1;
}

async function main() {
  console.log(`Source : ${SRC_DIR}`);
  console.log(`Output : ${OUT_DIR}`);
  console.log(`Prefix : ${PREFIX}`);

  await fs.mkdir(OUT_DIR, { recursive: true });

  const entries = await fs.readdir(SRC_DIR);
  const jpegs = entries.filter((e) => /\.jpe?g$/i.test(e)).sort();

  if (jpegs.length === 0) {
    console.log("No .jpeg files found in source.");
    return;
  }

  let n = await nextNumber();

  for (const file of jpegs) {
    const srcPath = path.join(SRC_DIR, file);
    const outName = `${PREFIX}-${String(n).padStart(2, "0")}.jpg`;
    const outPath = path.join(OUT_DIR, outName);

    // Skip files that already came in on a previous run — match against
    // the EXIF DateTimeOriginal would be ideal, but checking by filename
    // mapping is simpler: if an output with this same source basename
    // (recorded in a `.imported` sidecar) exists, skip.
    const sentinel = path.join(OUT_DIR, `.imported-${file}.flag`);
    if (await fs.stat(sentinel).then(() => true).catch(() => false)) {
      console.log(`  ${file} → skipped (already imported)`);
      continue;
    }

    await sharp(srcPath)
      .rotate()
      .resize({
        width: MAX_DIMENSION,
        height: MAX_DIMENSION,
        fit: "inside",
        withoutEnlargement: true,
      })
      .jpeg({ quality: JPEG_QUALITY, mozjpeg: true })
      .toFile(outPath);

    await fs.writeFile(sentinel, "");

    const stat = await fs.stat(outPath);
    console.log(
      `  ${file} → ${outName}  (${(stat.size / 1024).toFixed(0)} KB)`
    );
    n += 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

#!/usr/bin/env node
/**
 * Convert every .md file in docs/onenote-notebook/ into a matching
 * .docx in docs/onenote-notebook/docx/. OneNote imports the .docx
 * with headings, lists, tables, and emphasis preserved — drag the
 * docx folder into your OneNote and the structure comes through.
 *
 * Run with:  npm run notebook:docx
 */
import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { marked } from "marked";
import HTMLtoDOCX from "html-to-docx";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, "..");

const SRC_DIR = path.join(repoRoot, "docs", "onenote-notebook");
const OUT_DIR = path.join(SRC_DIR, "docx");

const DOC_OPTIONS = {
  orientation: "portrait",
  margins: { top: 1440, right: 1440, bottom: 1440, left: 1440 }, // 1 inch
  title: "PVS Operations Notebook",
  creator: "Prestige View Services",
  font: "Aptos",
  fontSize: 22, // half-points → 11pt
  pageNumber: true,
};

/** Wrap the converted HTML so html-to-docx renders heading + body styles
 *  the way OneNote expects. */
function wrapHtml(bodyHtml, title) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${title}</title>
  <style>
    body { font-family: 'Aptos', 'Calibri', sans-serif; font-size: 11pt; line-height: 1.5; }
    h1 { font-size: 22pt; margin: 0 0 12pt 0; }
    h2 { font-size: 16pt; margin: 18pt 0 8pt 0; }
    h3 { font-size: 13pt; margin: 14pt 0 6pt 0; }
    h4 { font-size: 11pt; margin: 10pt 0 4pt 0; font-weight: bold; }
    p { margin: 0 0 8pt 0; }
    ul, ol { margin: 0 0 8pt 24pt; }
    li { margin: 0 0 4pt 0; }
    code { font-family: 'Cascadia Code', 'Consolas', monospace; background: #f3f3f3; padding: 1px 4px; border-radius: 2px; }
    pre { font-family: 'Cascadia Code', 'Consolas', monospace; background: #f3f3f3; padding: 8pt; border: 1px solid #ddd; overflow-x: auto; }
    pre code { background: none; padding: 0; }
    blockquote { border-left: 3pt solid #888; padding-left: 12pt; margin: 8pt 0; color: #555; font-style: italic; }
    table { border-collapse: collapse; margin: 8pt 0; width: 100%; }
    th, td { border: 1pt solid #999; padding: 4pt 8pt; text-align: left; }
    th { background: #f0f0f0; font-weight: bold; }
    hr { border: none; border-top: 1pt solid #ccc; margin: 16pt 0; }
  </style>
</head>
<body>
${bodyHtml}
</body>
</html>`;
}

async function convertOne(srcPath, outPath) {
  const md = await fs.readFile(srcPath, "utf8");
  // Title = first H1 line, or filename fallback
  const titleMatch = md.match(/^#\s+(.+)$/m);
  const title = titleMatch ? titleMatch[1].trim() : path.basename(srcPath, ".md");

  const bodyHtml = marked.parse(md, { gfm: true, breaks: false });
  const fullHtml = wrapHtml(bodyHtml, title);

  const buffer = await HTMLtoDOCX(fullHtml, null, {
    ...DOC_OPTIONS,
    title,
  });

  await fs.writeFile(outPath, buffer);
}

(async () => {
  await fs.mkdir(OUT_DIR, { recursive: true });
  const entries = await fs.readdir(SRC_DIR);
  const mdFiles = entries
    .filter((e) => e.endsWith(".md"))
    .sort();

  console.log(`Converting ${mdFiles.length} markdown files → DOCX…\n`);

  let ok = 0;
  let fail = 0;
  for (const file of mdFiles) {
    const srcPath = path.join(SRC_DIR, file);
    const outPath = path.join(OUT_DIR, file.replace(/\.md$/, ".docx"));
    try {
      await convertOne(srcPath, outPath);
      const stat = await fs.stat(outPath);
      console.log(
        `  ✓  ${file}  →  docx/${path.basename(outPath)}  (${(stat.size / 1024).toFixed(0)} KB)`
      );
      ok++;
    } catch (err) {
      console.error(`  ✗  ${file}  —  ${err.message}`);
      fail++;
    }
  }

  console.log(`\nDone. ${ok} converted, ${fail} failed.`);
  if (fail > 0) process.exit(1);
})().catch((err) => {
  console.error("Conversion failed:", err);
  process.exit(1);
});

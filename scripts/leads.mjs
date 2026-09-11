#!/usr/bin/env node
/**
 * Lead backup + transfer from a terminal — moves every intake table between
 * databases, for a hosting change or a fresh Neon project.
 *
 *   npm run leads export                  # → pvs-intake-backup-YYYY-MM-DD.json
 *   npm run leads export my-backup.json
 *   npm run leads import my-backup.json   # into DATABASE_URL, skips rows that exist
 *   npm run leads import my-backup.json --to "postgresql://...other-db..."
 *
 * Reads DATABASE_URL from .env.local (npm run leads loads it). The JSON is
 * the same file the dashboard's "Backup (JSON)" button downloads, so a
 * backup taken in the browser restores here and vice versa.
 *
 * Import is additive and idempotent: rows are matched by id, existing rows
 * are never modified, and a partial failure leaves everything already
 * written in place.
 */
import { writeFileSync, readFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";

const TABLES = [
  ["leads", "lead"],
  ["quoteRequests", "quoteRequest"],
  ["winterReservations", "winterReservation"],
  ["supportRequests", "supportRequest"],
  ["applications", "application"],
];

function fail(msg) {
  console.error(`\n  ✗ ${msg}\n`);
  process.exit(1);
}

function client(url) {
  if (!url) fail("DATABASE_URL is not set. Put it in .env.local or pass --to <url>.");
  return new PrismaClient({ datasources: { db: { url } } });
}

async function exportBackup(file) {
  const db = client(process.env.DATABASE_URL);
  const out = {
    format: "pvs-intake-backup",
    version: 1,
    exportedAt: new Date().toISOString(),
    counts: {},
  };
  for (const [key, model] of TABLES) {
    const rows = await db[model].findMany({ orderBy: { createdAt: "asc" } });
    out[key] = rows;
    out.counts[key] = rows.length;
  }
  await db.$disconnect();
  const name = file ?? `pvs-intake-backup-${new Date().toISOString().slice(0, 10)}.json`;
  writeFileSync(name, JSON.stringify(out, null, 2));
  console.log(`\n  ✓ Wrote ${name}`);
  for (const [key] of TABLES) console.log(`    ${key.padEnd(20)} ${out.counts[key]}`);
  console.log("");
}

/** Strips relation-only fields Prisma would reject on create. */
function scrub(model, row) {
  const r = { ...row };
  // Foreign keys to tables outside the backup would fail on a fresh DB.
  if (model === "lead") delete r.customerId;
  if (model === "supportRequest") delete r.userId;
  return r;
}

async function importBackup(file, toUrl) {
  if (!file) fail("Usage: npm run leads import <file.json> [--to <DATABASE_URL>]");
  let data;
  try {
    data = JSON.parse(readFileSync(file, "utf8"));
  } catch (e) {
    fail(`Could not read ${file}: ${e.message}`);
  }
  if (data.format !== "pvs-intake-backup") {
    fail("That file is not a PVS intake backup (expected the JSON from Leads inbox → Backup).");
  }
  const db = client(toUrl ?? process.env.DATABASE_URL);
  console.log("");
  for (const [key, model] of TABLES) {
    const rows = Array.isArray(data[key]) ? data[key] : [];
    let created = 0;
    let existed = 0;
    let failed = 0;
    for (const row of rows) {
      try {
        const exists = await db[model].findUnique({ where: { id: row.id }, select: { id: true } });
        if (exists) {
          existed++;
          continue;
        }
        await db[model].create({ data: scrub(model, row) });
        created++;
      } catch (e) {
        failed++;
        if (failed <= 3) console.error(`    ! ${key} ${row.id}: ${e.message.split("\n")[0]}`);
      }
    }
    console.log(
      `  ${key.padEnd(20)} ${String(created).padStart(4)} added, ${String(existed).padStart(4)} already there${failed ? `, ${failed} failed` : ""}`
    );
  }
  await db.$disconnect();
  console.log("\n  ✓ Import finished\n");
}

const [cmd, ...rest] = process.argv.slice(2);
const toIdx = rest.indexOf("--to");
const toUrl = toIdx >= 0 ? rest[toIdx + 1] : undefined;
const args =
  toIdx >= 0 ? rest.filter((_, i) => i !== toIdx && i !== toIdx + 1) : rest;

if (cmd === "export") await exportBackup(args[0]);
else if (cmd === "import") await importBackup(args[0], toUrl);
else {
  console.log(`
  Lead backup & transfer

    npm run leads export [file.json]
    npm run leads import <file.json> [--to <DATABASE_URL>]
`);
  process.exit(cmd ? 1 : 0);
}

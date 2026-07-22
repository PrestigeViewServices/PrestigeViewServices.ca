/**
 * Import civic addresses from Statistics Canada's Open Database of Addresses
 * (ODA, https://www.statcan.gc.ca/en/lode/databases/oda — Open Government
 * Licence) into the CanvassAddress table for the door-to-door canvassing app.
 *
 * Usage:
 *   npx dotenv -e .env.local -- node scripts/import-oda-addresses.mjs <path-to-ODA_ON_v1.csv>
 *
 * Only rows in our target municipalities are kept. Chalk River is a village
 * inside the Laurentian Hills CSD, so that whole CSD is labeled "Chalk River"
 * for reps. Re-running is safe: rows dedupe on the ODA row id.
 */
import fs from "node:fs";
import readline from "node:readline";
import { PrismaClient } from "@prisma/client";

const CSD_TO_TOWN = new Map([
  ["petawawa", "Petawawa"],
  ["pembroke", "Pembroke"],
  ["deep river", "Deep River"],
  ["laurentian hills", "Chalk River"],
]);

const file = process.argv[2];
if (!file || !fs.existsSync(file)) {
  console.error("Usage: node scripts/import-oda-addresses.mjs <ODA_ON_v1.csv>");
  process.exit(1);
}
if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL not set — run through `npx dotenv -e .env.local --`.");
  process.exit(1);
}

const db = new PrismaClient();

/** Minimal CSV line parser — handles quoted fields with embedded commas. */
function parseLine(line) {
  if (!line.includes('"')) return line.split(",");
  const out = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"') {
        if (line[i + 1] === '"') {
          cur += '"';
          i++;
        } else inQ = false;
      } else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      out.push(cur);
      cur = "";
    } else cur += c;
  }
  out.push(cur);
  return out;
}

const SMALL_WORDS = new Set(["of", "the", "and", "de", "du", "des"]);
function titleCase(s) {
  return s
    .toLowerCase()
    .split(/\s+/)
    .map((w, i) =>
      SMALL_WORDS.has(w) && i > 0 ? w : w.charAt(0).toUpperCase() + w.slice(1)
    )
    .join(" ")
    .trim();
}

async function main() {
  const rl = readline.createInterface({
    input: fs.createReadStream(file, { encoding: "utf8" }),
    crlfDelay: Infinity,
  });

  let header = null;
  let col = {};
  let scanned = 0;
  let matched = 0;
  let inserted = 0;
  const perTown = new Map();
  let batch = [];

  const flush = async () => {
    if (!batch.length) return;
    const res = await db.canvassAddress.createMany({
      data: batch,
      skipDuplicates: true,
    });
    inserted += res.count;
    batch = [];
  };

  for await (const line of rl) {
    if (!header) {
      header = parseLine(line).map((h) => h.trim().toLowerCase());
      for (const [i, name] of header.entries()) col[name] = i;
      for (const required of ["latitude", "longitude", "street_no", "csdname"]) {
        if (!(required in col)) {
          throw new Error(`CSV missing expected column "${required}"`);
        }
      }
      continue;
    }
    scanned++;
    if (scanned % 1_000_000 === 0) {
      console.log(`…scanned ${scanned.toLocaleString()} rows, matched ${matched}`);
    }

    // Cheap pre-filter before full CSV parsing — all four CSD names appear
    // verbatim in the raw line.
    if (!/petawawa|pembroke|deep river|laurentian hills/i.test(line)) continue;

    const f = parseLine(line);
    const csd = (f[col["csdname"]] ?? "").trim().toLowerCase();
    const town = CSD_TO_TOWN.get(csd);
    if (!town) continue;

    const lat = parseFloat(f[col["latitude"]]);
    const lng = parseFloat(f[col["longitude"]]);
    const civic = (f[col["street_no"]] ?? "").trim();
    let street = (f[col["street"]] ?? "").trim();
    if (!street) {
      street = [f[col["str_name"]], f[col["str_type"]], f[col["str_dir"]]]
        .map((x) => (x ?? "").trim())
        .filter(Boolean)
        .join(" ");
    }
    if (!Number.isFinite(lat) || !Number.isFinite(lng) || !civic || !street) continue;

    const unit = (f[col["unit"]] ?? "").trim() || null;
    const postal = (f[col["postal_code"]] ?? "").trim() || null;
    const rowId = (f[col["id"]] ?? "").trim();
    const odaId = rowId || `${csd}|${street}|${civic}|${unit ?? ""}|${lat}|${lng}`;

    matched++;
    perTown.set(town, (perTown.get(town) ?? 0) + 1);
    batch.push({
      odaId,
      civicNumber: civic,
      street: titleCase(street),
      unit,
      city: town,
      postalCode: postal,
      lat,
      lng,
    });
    if (batch.length >= 2000) await flush();
  }
  await flush();

  console.log(`\nScanned ${scanned.toLocaleString()} rows.`);
  console.log(`Matched ${matched.toLocaleString()} addresses:`);
  for (const [town, n] of [...perTown.entries()].sort()) {
    console.log(`  ${town}: ${n.toLocaleString()}`);
  }
  console.log(`Inserted ${inserted.toLocaleString()} new rows (rest were already imported).`);

  const totals = await db.canvassAddress.groupBy({
    by: ["city"],
    _count: { _all: true },
  });
  console.log("\nCanvassAddress totals in DB:");
  for (const t of totals.sort((a, b) => a.city.localeCompare(b.city))) {
    console.log(`  ${t.city}: ${t._count._all.toLocaleString()}`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => db.$disconnect());

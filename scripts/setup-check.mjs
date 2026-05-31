#!/usr/bin/env node
/**
 * `npm run setup:check`
 *
 * Reads .env.local (or .env), reports which required env vars are present
 * vs missing, and probes the database connection. Output is in plain
 * language so a non-developer can self-diagnose before running `npm run dev`.
 *
 * Exit code: 0 if everything checks out, 1 if anything is missing/unreachable.
 *
 * Zero runtime dependencies beyond Node's built-ins and @prisma/client
 * (which is already installed for the app itself).
 */

import { readFileSync, existsSync } from "node:fs";
import { resolve } from "node:path";

// ------------------------- styling helpers ----------------------------------

const isTTY = process.stdout.isTTY;
const c = (code, s) => (isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const ok = (s) => c("32", s);
const warn = (s) => c("33", s);
const err = (s) => c("31", s);
const dim = (s) => c("90", s);
const bold = (s) => c("1", s);

// ------------------------- env loading --------------------------------------

const candidates = [".env.local", ".env"];

function loadEnv() {
  for (const name of candidates) {
    const path = resolve(process.cwd(), name);
    if (!existsSync(path)) continue;
    const content = readFileSync(path, "utf8");
    for (const line of content.split(/\r?\n/)) {
      const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*?)\s*$/);
      if (!m || line.trim().startsWith("#")) continue;
      let val = m[2];
      if (
        (val.startsWith('"') && val.endsWith('"')) ||
        (val.startsWith("'") && val.endsWith("'"))
      ) {
        val = val.slice(1, -1);
      }
      if (process.env[m[1]] === undefined) process.env[m[1]] = val;
    }
    return name;
  }
  return null;
}

// ------------------------- required vars ------------------------------------

const PLACEHOLDER_PATTERNS = [
  /REPLACE/i,
  /xxxxx/i,
  /change[\-_ ]?me/i,
  /your[\-_ ]?(api|key|email|host|password)/i,
  /paste/i,
  /^pk_test_REPLACE/i,
  /^sk_test_REPLACE/i,
  /^whsec_REPLACE/i,
];

function isPlaceholder(v) {
  return PLACEHOLDER_PATTERNS.some((re) => re.test(v));
}

const REQUIRED = [
  {
    key: "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
    expectedPrefix: ["pk_test_", "pk_live_"],
    where: "Clerk Dashboard → API Keys → Publishable key",
  },
  {
    key: "CLERK_SECRET_KEY",
    expectedPrefix: ["sk_test_", "sk_live_"],
    where: "Clerk Dashboard → API Keys → Secret key",
  },
  {
    key: "DATABASE_URL",
    expectedPrefix: ["postgresql://", "postgres://"],
    where: "Neon: console.neon.tech → Connect → Connection string (Pooled OFF)",
  },
  {
    key: "ULTIMATE_ADMIN_EMAILS",
    where:
      "Comma-separated email(s) you'll sign in with — get full ultimate_admin",
  },
];

const OPTIONAL = [
  {
    key: "CLERK_WEBHOOK_SECRET",
    expectedPrefix: ["whsec_"],
    where: "Clerk → Webhooks → endpoint → Signing Secret (needed for user sync)",
  },
  { key: "APPLICATION_NOTIFICATION_EMAIL" },
  { key: "SUPPORT_NOTIFICATION_EMAIL" },
  { key: "NEXT_PUBLIC_GA_MEASUREMENT_ID" },
];

// ------------------------- run ----------------------------------------------

console.log(bold("\nSetup check\n"));

const envFile = loadEnv();
if (!envFile) {
  console.log(err("✗") + " No .env.local or .env found.");
  console.log(
    dim("    Copy .env.example to .env.local first, then fill in the values.")
  );
  console.log(dim("    See SETUP.md → Step 2."));
  process.exit(1);
}
console.log(dim(`Reading ${envFile}\n`));

let problems = 0;

function checkVar(spec, required) {
  const v = process.env[spec.key];
  const label = spec.key.padEnd(36);
  if (!v) {
    if (required) {
      console.log(`${err("✗")} ${label} ${err("missing")}`);
      if (spec.where) console.log(dim(`    → ${spec.where}`));
      problems++;
    } else {
      console.log(`${dim("·")} ${label} ${dim("optional, not set")}`);
    }
    return;
  }
  if (isPlaceholder(v)) {
    console.log(
      `${err("✗")} ${label} ${err("still the placeholder value")}`
    );
    if (spec.where) console.log(dim(`    → ${spec.where}`));
    if (required) problems++;
    return;
  }
  if (
    spec.expectedPrefix &&
    !spec.expectedPrefix.some((p) => v.startsWith(p))
  ) {
    console.log(
      `${warn("⚠")} ${label} ${warn(
        `doesn't start with expected prefix (${spec.expectedPrefix.join(", ")})`
      )}`
    );
    if (spec.where) console.log(dim(`    → ${spec.where}`));
    if (required) problems++;
    return;
  }
  console.log(`${ok("✓")} ${label}`);
}

console.log(bold("Required:"));
for (const r of REQUIRED) checkVar(r, true);

console.log("\n" + bold("Optional:"));
for (const r of OPTIONAL) checkVar(r, false);

// ------------------------- DB connectivity probe ---------------------------

console.log("");
const dbUrl = process.env.DATABASE_URL;
if (dbUrl && !isPlaceholder(dbUrl)) {
  process.stdout.write(dim("Testing DATABASE_URL connectivity... "));
  let prisma;
  try {
    const mod = await import("@prisma/client");
    prisma = new mod.PrismaClient();
    await prisma.$queryRawUnsafe("SELECT 1");
    console.log(ok("✓ reachable"));
  } catch (e) {
    console.log(err("✗ not reachable"));
    console.log(dim(`    ${e?.message || e}`));
    console.log(
      dim(
        "    Common causes: wrong password, wrong host, missing `?sslmode=require`, project paused."
      )
    );
    problems++;
  } finally {
    try {
      await prisma?.$disconnect();
    } catch {}
  }
} else {
  console.log(dim("Skipping DB connectivity probe — DATABASE_URL not set."));
}

// ------------------------- summary ------------------------------------------

console.log("");
if (problems === 0) {
  console.log(
    ok("All checks passed.") +
      " Run " +
      bold("npm run db:migrate") +
      " (if you haven't yet), then " +
      bold("npm run dev") +
      "."
  );
  process.exit(0);
} else {
  console.log(
    err(
      `${problems} item${problems === 1 ? "" : "s"} need${
        problems === 1 ? "s" : ""
      } attention.`
    ) + " See SETUP.md for the click-by-click guide."
  );
  process.exit(1);
}

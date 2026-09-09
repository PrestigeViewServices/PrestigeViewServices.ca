#!/usr/bin/env node
/**
 * Dashboard sign-in management from a terminal — the break-glass when
 * nobody can get into /admin at all.
 *
 * Talks straight to Postgres, so it works with no session, no password, and
 * no running site. Requires DATABASE_URL (npm run admin loads .env.local).
 *
 *   npm run admin                        # list every sign-in
 *   npm run admin add you@example.com    # add one, password generated
 *   npm run admin add you@example.com 'my-password'
 *   npm run admin reset you@example.com  # new password, generated
 *   npm run admin reset you@example.com 'my-password'
 *   npm run admin remove old@example.com
 *
 * The hashing format matches lib/customer-auth.ts exactly:
 * scrypt$<salt-hex>$<hash-hex>. Keep the two in sync.
 */
import { randomBytes, randomInt, scrypt as scryptCb } from "node:crypto";
import { promisify } from "node:util";
import { PrismaClient } from "@prisma/client";

const scrypt = promisify(scryptCb);

const OWNER_ID = "owner";
const MIN_PASSWORD_LENGTH = 10;
// No look-alike characters — these get read aloud and typed on phones.
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

function generatePassword() {
  const chars = Array.from(
    { length: 20 },
    () => ALPHABET[randomInt(ALPHABET.length)]
  );
  return [0, 5, 10, 15].map((i) => chars.slice(i, i + 5).join("")).join("-");
}

async function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = await scrypt(password, salt, 64);
  return `scrypt$${salt.toString("hex")}$${hash.toString("hex")}`;
}

function normalizeEmail(email) {
  return String(email ?? "").trim().toLowerCase();
}

function assertEmail(email) {
  const clean = normalizeEmail(email);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(clean)) {
    fail(`"${email}" is not a valid email address`);
  }
  return clean;
}

function assertPassword(password) {
  if (password.length < MIN_PASSWORD_LENGTH) {
    fail(`Password must be at least ${MIN_PASSWORD_LENGTH} characters`);
  }
  return password;
}

function fail(message) {
  console.error(`\n  ✖ ${message}\n`);
  process.exit(1);
}

const USAGE = `
  Dashboard sign-ins

    npm run admin                              list every sign-in
    npm run admin add <email> [password]       add an admin
    npm run admin reset <email> [password]     set a new password
    npm run admin remove <email>               remove an admin

  Omit the password and a strong one is generated and printed once.
`;

async function main() {
  if (!process.env.DATABASE_URL) {
    fail(
      "DATABASE_URL is not set. Put it in .env.local (or export it) and run again."
    );
  }

  const [command, ...args] = process.argv.slice(2);
  const db = new PrismaClient();

  try {
    switch (command ?? "list") {
      case "list":
        await list(db);
        break;
      case "add":
        await add(db, args);
        break;
      case "reset":
        await reset(db, args);
        break;
      case "remove":
      case "rm":
        await remove(db, args);
        break;
      case "help":
      case "--help":
      case "-h":
        console.log(USAGE);
        break;
      default:
        console.log(USAGE);
        fail(`Unknown command "${command}"`);
    }
  } catch (err) {
    if (err?.code === "P2021") {
      fail(
        "The AdminCredential table does not exist yet. Run `npm run db:deploy` first."
      );
    }
    fail(err?.message ?? String(err));
  } finally {
    await db.$disconnect();
  }
}

async function findByEmail(db, email) {
  return db.adminCredential.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
  });
}

async function list(db) {
  const rows = await db.adminCredential.findMany({
    orderBy: { email: "asc" },
  });
  if (rows.length === 0) {
    console.log(
      "\n  No dashboard sign-ins saved. Only the ADMIN_EMAIL / ADMIN_PASSWORD" +
        "\n  recovery login works right now. Add one:" +
        "\n\n    npm run admin add you@prestigeviewservices.ca\n"
    );
    return;
  }
  console.log(`\n  ${rows.length} dashboard sign-in(s):\n`);
  for (const r of rows) {
    const tag = r.id === OWNER_ID ? " (owner)" : "";
    const when = r.updatedAt.toISOString().slice(0, 10);
    console.log(`    ${r.email}${tag}  ·  password set ${when}`);
  }
  console.log("\n  All of them have full dashboard access.\n");
}

async function add(db, [rawEmail, rawPassword]) {
  if (!rawEmail) fail("Usage: npm run admin add <email> [password]");
  const email = assertEmail(rawEmail);
  const password = rawPassword
    ? assertPassword(rawPassword)
    : generatePassword();

  if (await findByEmail(db, email)) {
    fail(`${email} is already a sign-in. Use \`npm run admin reset\` instead.`);
  }

  // The first account created takes the canonical `owner` id so a fresh
  // database matches what the app expects.
  const owner = await db.adminCredential.findUnique({
    where: { id: OWNER_ID },
    select: { id: true },
  });
  const id = owner ? `adm_${randomBytes(9).toString("hex")}` : OWNER_ID;

  await db.adminCredential.create({
    data: { id, email, passwordHash: await hashPassword(password) },
  });

  console.log(`\n  ✔ Added ${email}\n`);
  console.log(`    Password: ${password}`);
  console.log(
    "\n  Copy it now — it is stored hashed and cannot be shown again.\n"
  );
}

async function reset(db, [rawEmail, rawPassword]) {
  if (!rawEmail) fail("Usage: npm run admin reset <email> [password]");
  const email = assertEmail(rawEmail);
  const password = rawPassword
    ? assertPassword(rawPassword)
    : generatePassword();

  const row = await findByEmail(db, email);
  if (!row) {
    fail(`No sign-in for ${email}. Use \`npm run admin add\` to create it.`);
  }

  await db.adminCredential.update({
    where: { id: row.id },
    data: { passwordHash: await hashPassword(password) },
  });

  console.log(`\n  ✔ New password for ${email}\n`);
  console.log(`    Password: ${password}`);
  console.log(
    "\n  Copy it now — it is stored hashed and cannot be shown again.\n"
  );
}

async function remove(db, [rawEmail]) {
  if (!rawEmail) fail("Usage: npm run admin remove <email>");
  const email = assertEmail(rawEmail);

  const row = await findByEmail(db, email);
  if (!row) fail(`No sign-in for ${email}.`);

  const total = await db.adminCredential.count();
  if (total <= 1) {
    fail(
      "This is the last sign-in. Add another one before removing it, or you " +
        "will be relying on the ADMIN_PASSWORD recovery login alone."
    );
  }

  await db.adminCredential.delete({ where: { id: row.id } });
  console.log(`\n  ✔ Removed ${email}\n`);
}

main();

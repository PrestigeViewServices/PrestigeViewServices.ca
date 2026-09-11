#!/usr/bin/env node
/**
 * Production build entry point used by Vercel (`npm run vercel-build`).
 *
 * Deploys used to run `next build` only, so every schema change shipped
 * without its migration: the code expected a table (AdminCredential,
 * AdminNotification, SiteContent, ...) that the live database never got,
 * and the dashboard fell back to "run `npm run db:deploy`" notices the
 * owner had no terminal to run. This script applies pending migrations
 * first, so the database is always in step with the code that reads it.
 *
 * Fail-safe by design:
 *  - No DATABASE_URL (preview branch, fresh project)  -> skip, build anyway.
 *  - Migration fails (pooled URL, paused Neon project) -> WARN loudly, build
 *    anyway. A site that is up with one stale table beats a site that is
 *    down. The dashboard still shows exactly which table is missing.
 */
import { spawnSync } from "node:child_process";

const url = (process.env.DATABASE_URL ?? "").trim();

function run(cmd, args) {
  const res = spawnSync(cmd, args, { stdio: "inherit", shell: process.platform === "win32" });
  return res.status ?? 1;
}

if (!url) {
  console.log("[vercel-build] DATABASE_URL is not set, skipping migrations.");
} else {
  console.log("[vercel-build] Applying pending database migrations...");
  const code = run("npx", ["prisma", "migrate", "deploy"]);
  if (code === 0) {
    console.log("[vercel-build] Database schema is up to date.");
  } else {
    console.warn(
      "\n[vercel-build] WARNING: `prisma migrate deploy` failed (exit " +
        code +
        "). Building anyway so the site stays up.\n" +
        "[vercel-build] Fix: make sure DATABASE_URL on Vercel is the DIRECT (non-pooled) " +
        "Neon connection string, or run `npm run db:deploy` from a terminal.\n"
    );
  }
}

process.exit(run("npx", ["next", "build"]));

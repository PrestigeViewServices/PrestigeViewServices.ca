/**
 * Word export of every lead from a terminal, for when the dashboard is not
 * at hand (or the site is down and the leads still need chasing).
 *
 *   npm run leads:docx                      # → pvs-quote-requests-YYYY-MM-DD.docx
 *   npm run leads:docx my-leads.docx
 *
 * Reads DATABASE_URL from .env.local. Same document as the Leads inbox's
 * "Export Word" button.
 */
import { writeFileSync } from "node:fs";
import { PrismaClient } from "@prisma/client";
import { leadsToDocx } from "../lib/lead-docx";

async function main() {
  const url = process.env.DATABASE_URL;
  if (!url) {
    console.error("\n  ✗ DATABASE_URL is not set. Put it in .env.local.\n");
    process.exit(1);
  }

  const db = new PrismaClient({ datasources: { db: { url } } });
  const leads = await db.lead.findMany({ orderBy: { createdAt: "desc" } });
  await db.$disconnect();

  const file =
    process.argv[2] ?? `pvs-quote-requests-${new Date().toISOString().slice(0, 10)}.docx`;
  writeFileSync(file, await leadsToDocx(leads));
  console.log(`\n  ✓ Wrote ${file} (${leads.length} lead${leads.length === 1 ? "" : "s"})\n`);
}

main().catch((e) => {
  console.error(`\n  ✗ ${e instanceof Error ? e.message : e}\n`);
  process.exit(1);
});

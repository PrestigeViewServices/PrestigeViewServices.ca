import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fetchAllLeads, intakeBackup, leadsToCsv } from "@/lib/lead-export";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads/export?format=csv|json
 *
 *  csv  → the Lead table as a spreadsheet (default).
 *  json → a restorable backup of every intake table.
 *
 * Admin session required; the file downloads straight from the dashboard.
 */
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const format = new URL(req.url).searchParams.get("format") === "json" ? "json" : "csv";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "json") {
    const backup = await intakeBackup(db);
    return new NextResponse(JSON.stringify(backup, null, 2), {
      headers: {
        "Content-Type": "application/json; charset=utf-8",
        "Content-Disposition": `attachment; filename="pvs-intake-backup-${stamp}.json"`,
        "Cache-Control": "no-store",
      },
    });
  }

  const leads = await fetchAllLeads(db);
  return new NextResponse(leadsToCsv(leads), {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="pvs-leads-${stamp}.csv"`,
      "Cache-Control": "no-store",
    },
  });
}

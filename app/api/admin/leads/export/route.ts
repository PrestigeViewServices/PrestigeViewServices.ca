import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { fetchAllLeads, intakeBackup, leadsToCsv } from "@/lib/lead-export";
import { leadsToDocx } from "@/lib/lead-docx";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/admin/leads/export?format=csv|json|docx
 *
 *  csv  → the Lead table as a spreadsheet (default).
 *  json → a restorable backup of every intake table.
 *  docx → a Word document, one record per lead, for re-quoting from.
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

  const requested = new URL(req.url).searchParams.get("format");
  const format = requested === "json" || requested === "docx" ? requested : "csv";
  const stamp = new Date().toISOString().slice(0, 10);

  if (format === "docx") {
    const leads = await fetchAllLeads(db);
    const buffer = await leadsToDocx(leads);
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="pvs-quote-requests-${stamp}.docx"`,
        "Cache-Control": "no-store",
      },
    });
  }

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

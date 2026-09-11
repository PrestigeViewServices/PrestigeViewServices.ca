import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { importLeads, parseLeadCsv } from "@/lib/lead-import";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { result?: string };

/**
 * Bring every lead the business has ever received into the one inbox:
 * Aurora Suite exports (the /quote and /contact forms post there, not
 * here), an old spreadsheet, or a backup CSV from this dashboard. Rows
 * become pipeline leads; re-running never duplicates or edits anything.
 */
export default async function LeadImportPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/leads"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Leads inbox
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">Import leads (CSV)</h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          The Get Quote form on the public site sends leads to Aurora Suite,
          so they are not in this inbox automatically. Export them from Aurora
          as a CSV and upload it here, and every lead you have ever received
          gets followed up from one place. Works with any spreadsheet too.
          Re-importing is safe: a lead already here (same email, same day) is
          skipped, never changed.
        </p>
      </header>

      {searchParams.result && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200 whitespace-pre-line">
          {decodeURIComponent(searchParams.result)}
        </div>
      )}

      <form action={runImport} className="surface-card space-y-5 p-5 sm:p-7">
        <div>
          <label htmlFor="imp-file" className="mb-1.5 block text-sm font-medium">
            Upload a .csv file
          </label>
          <input
            id="imp-file"
            name="file"
            type="file"
            accept=".csv,text/csv,text/plain"
            className="block w-full cursor-pointer rounded-xl border border-surface-border bg-input/80 text-sm file:mr-4 file:cursor-pointer file:rounded-l-xl file:border-0 file:bg-primary/15 file:px-4 file:py-2.5 file:text-sm file:font-semibold file:text-primary"
          />
        </div>
        <div className="flex items-center gap-3 text-xs uppercase tracking-wider text-muted-foreground">
          <span className="h-px flex-1 bg-surface-border" />
          or paste rows
          <span className="h-px flex-1 bg-surface-border" />
        </div>
        <div>
          <label htmlFor="imp-paste" className="mb-1.5 block text-sm font-medium">
            Paste CSV
          </label>
          <textarea
            id="imp-paste"
            name="paste"
            rows={8}
            placeholder={`name,email,phone,services,message,date\nJordan Tremblay,jordan@example.com,(613) 555-0148,Gutter Cleaning,Two-storey on Victoria St,2026-09-02\n"Smith, Sarah",sarah@example.com,613-555-0199,"Fall Cleanup; Snow Removal",,2026-09-05`}
            className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            With a header row these columns are recognized automatically:
            name (or first + last name), email, phone, address, service(s),
            message / comments, date / created, status, source, notes.
            Without one, the order name, email, phone, services, message is
            assumed. Services are matched to the site&apos;s service list by
            name. Max 5,000 rows per run.
          </p>
        </div>
        <Button type="submit" size="lg">
          <Upload className="h-4 w-4" />
          Import leads
        </Button>
      </form>

      <section className="surface-card p-5 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">
          Getting the CSV out of Aurora Suite
        </h2>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Open Aurora Suite → Leads (or Contacts).</li>
          <li>Choose Export → CSV, all dates.</li>
          <li>Upload the file above. Column names are matched automatically;
            anything unrecognized is ignored.</li>
        </ol>
        <p className="mt-3">
          Moving to a new database? <strong className="text-foreground">Leads inbox → Backup (JSON)</strong>{" "}
          downloads every intake table, and <code>npm run leads import file.json</code>{" "}
          restores it anywhere.
        </p>
      </section>
    </div>
  );
}

// --- server action ----------------------------------------------------------

async function runImport(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const { redirect } = await import("next/navigation");
  const back = (msg: string) =>
    redirect(`/admin/leads/import?result=${encodeURIComponent(msg)}`);

  let text = String(formData.get("paste") ?? "");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) {
      back("File too large (2 MB max) — split it and run twice.");
    }
    text = await file.text();
  }
  if (!text.trim()) {
    back("Nothing to import — upload a file or paste rows first.");
  }

  const rows = parseLeadCsv(text);
  const s = await importLeads(db, rows);
  const lines = [
    `Done: ${s.rowsSeen} rows read — ${s.created} leads added, ${s.duplicates} already in the inbox, ${s.invalid} skipped (missing name or email).`,
    ...s.problems,
  ];
  revalidatePath("/admin/leads");
  revalidatePath("/admin");
  back(lines.join("\n"));
}

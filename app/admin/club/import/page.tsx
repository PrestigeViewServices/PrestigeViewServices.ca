import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, FileSpreadsheet, Upload } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { parseCustomerCsv, provisionMembers } from "@/lib/member-import";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin"] as const;

type SearchParams = { result?: string };

/**
 * Universal customer import — built for Aurora Suite exports, works with
 * any CSV (spreadsheets, lead lists). Each row with a valid email becomes
 * an UNCLAIMED member with an invite token, identical to the Jobber
 * import: customers claim by signing up with the same email or via their
 * personal /claim link (shown on their member page). Re-running is safe —
 * existing emails are skipped, never modified.
 */
export default async function CustomerImportPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <div className="flex items-center gap-2">
          <FileSpreadsheet className="h-6 w-6 text-primary" />
          <h1 className="text-3xl font-bold tracking-tight">
            Import customers (CSV)
          </h1>
        </div>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          For Aurora Suite exports or any customer list. Every row with an
          email becomes a pre-provisioned club account, history-safe and
          unclaimed until the customer sets a password (they claim by
          signing up with that email, or via the claim link on their member
          page). Existing members are skipped, so re-importing is always
          safe.
        </p>
      </header>

      {searchParams.result && (
        <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/10 p-4 text-sm font-medium text-emerald-200">
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
            placeholder={`name,email,phone\nJordan Tremblay,jordan@example.com,(613) 555-0148\n"Smith, Sarah",sarah@example.com,613-555-0199`}
            className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 font-mono text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <p className="mt-1 text-xs text-muted-foreground">
            With a header row, these columns are recognized automatically:
            email, name / first name, last name, phone, address, city.
            Without one, the order name, email, phone is assumed. Max 5,000
            rows per run.
          </p>
        </div>
        <Button type="submit" size="lg">
          <Upload className="h-4 w-4" />
          Import customers
        </Button>
      </form>
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

  let text = String(formData.get("paste") ?? "");
  const file = formData.get("file");
  if (file instanceof File && file.size > 0) {
    if (file.size > 2 * 1024 * 1024) {
      redirect(
        `/admin/club/import?result=${encodeURIComponent("File too large (2 MB max) — split it and run twice.")}`
      );
    }
    text = await file.text();
  }
  if (!text.trim()) {
    redirect(
      `/admin/club/import?result=${encodeURIComponent("Nothing to import — upload a file or paste rows first.")}`
    );
  }

  const rows = parseCustomerCsv(text);
  const s = await provisionMembers(db, rows);
  const msg = `Done: ${s.rowsSeen} rows read — ${s.created} accounts created, ${s.existed} already existed, ${s.invalid} without a valid email.`;
  revalidatePath("/admin/club");
  redirect(`/admin/club/import?result=${encodeURIComponent(msg)}`);
}

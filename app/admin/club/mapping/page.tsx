import Link from "next/link";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Trash2 } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { CATEGORY_LABELS } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;
const CATEGORIES = ["WINDOW_EXTERIOR", "LAWN_CARE", "SNOW_REMOVAL"] as const;

/**
 * Jobber name → public category mapping. Jobber job/line names may contain
 * internal terms; only the mapped public label ever reaches customers. The
 * sync falls back to sensible keyword defaults when nothing here matches.
 */
export default async function CategoryMappingPage() {
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const mappings = await db.categoryMapping.findMany({
    orderBy: { matchTerm: "asc" },
  });

  return (
    <div className="space-y-6">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Category mapping</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
          When a Jobber job or line-item name contains a term below
          (case-insensitive), its portal record gets that public category.
          Unmatched names fall back to keyword defaults (snow terms → Snow
          Removal, lawn terms → Lawn Care, everything else → Window &amp;
          Exterior Cleaning).
        </p>
      </header>

      <form
        action={addMapping}
        className="surface-card flex flex-wrap items-end gap-3 p-5"
      >
        <div className="min-w-[200px] flex-1">
          <label className="mb-1 block text-xs font-medium" htmlFor="map-term">
            Match term
          </label>
          <input
            id="map-term"
            name="matchTerm"
            required
            maxLength={80}
            placeholder="e.g. eaves"
            className="h-10 w-full rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-medium" htmlFor="map-cat">
            Public category
          </label>
          <select
            id="map-cat"
            name="category"
            className="h-10 rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {CATEGORY_LABELS[c]}
              </option>
            ))}
          </select>
        </div>
        <Button type="submit" size="sm">
          Add mapping
        </Button>
      </form>

      <div className="surface-card divide-y divide-surface-border">
        {mappings.length === 0 && (
          <p className="p-6 text-sm text-muted-foreground">
            No custom mappings yet, keyword defaults are handling everything.
          </p>
        )}
        {mappings.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 px-5 py-3 text-sm"
          >
            <div>
              <span className="font-mono font-medium">{m.matchTerm}</span>
              <span className="mx-2 text-muted-foreground">→</span>
              {CATEGORY_LABELS[m.category]}
            </div>
            <form action={deleteMapping}>
              <input type="hidden" name="id" value={m.id} />
              <button
                type="submit"
                aria-label={`Delete mapping ${m.matchTerm}`}
                className="grid h-8 w-8 place-items-center rounded-lg text-muted-foreground transition-colors hover:bg-rose-500/15 hover:text-rose-300"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </form>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function addMapping(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const matchTerm = String(formData.get("matchTerm") ?? "")
    .trim()
    .toLowerCase()
    .slice(0, 80);
  const category = String(formData.get("category") ?? "");
  if (!matchTerm || !CATEGORIES.includes(category as (typeof CATEGORIES)[number])) {
    return;
  }
  await db.categoryMapping.upsert({
    where: { matchTerm },
    create: { matchTerm, category: category as (typeof CATEGORIES)[number] },
    update: { category: category as (typeof CATEGORIES)[number] },
  });
  revalidatePath("/admin/club/mapping");
}

async function deleteMapping(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const id = String(formData.get("id") ?? "");
  if (!id) return;
  await db.categoryMapping.delete({ where: { id } }).catch(() => {});
  revalidatePath("/admin/club/mapping");
}

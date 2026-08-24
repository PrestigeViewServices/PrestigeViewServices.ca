import Link from "next/link";
import { revalidatePath } from "next/cache";
import { Bell, Check, CheckCheck, ExternalLink } from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import { KIND_META, kindMeta } from "@/lib/admin-notifications";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

type SearchParams = { kind?: string; all?: string };

/**
 * The in-app notification feed — everything the website generates, newest
 * first. Works even while the email/SMS providers are unconfigured, so a
 * missing API key can never hide an intake again.
 */
export default async function NotificationsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  await requireRole([...ADMIN_ROLES]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Notifications are stored in Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }
  const db = getDb()!;

  const kindFilter =
    searchParams.kind && searchParams.kind in KIND_META
      ? searchParams.kind
      : undefined;
  const showAll = searchParams.all === "1";

  const [items, unread, kindCounts] = await Promise.all([
    db.adminNotification.findMany({
      where: {
        ...(kindFilter ? { kind: kindFilter } : {}),
        ...(showAll ? {} : { readAt: null }),
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    db.adminNotification.count({ where: { readAt: null } }),
    db.adminNotification.groupBy({
      by: ["kind"],
      where: { readAt: null },
      _count: { kind: true },
    }),
  ]);

  const countFor = (k: string) =>
    kindCounts.find((c) => c.kind === k)?._count.kind ?? 0;

  const baseQs = showAll ? "?all=1" : "?";

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Bell className="h-6 w-6 text-primary" />
            <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          </div>
          <p className="mt-1.5 text-muted-foreground">
            {unread} unread · everything the website generates lands here the
            moment it happens.
          </p>
        </div>
        {unread > 0 && (
          <form action={markAllRead}>
            <Button type="submit" variant="outline" size="sm">
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </form>
        )}
      </header>

      {/* ---- Filters ---- */}
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link
          href={showAll ? "/admin/notifications?all=1" : "/admin/notifications"}
          className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
            !kindFilter
              ? "border-primary/40 bg-primary/15 text-foreground"
              : "border-surface-border text-muted-foreground hover:text-foreground"
          }`}
        >
          All kinds
        </Link>
        {(Object.keys(KIND_META) as (keyof typeof KIND_META)[]).map((k) => {
          const n = countFor(k);
          return (
            <Link
              key={k}
              href={`/admin/notifications${baseQs}&kind=${k}`.replace("?&", "?")}
              className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors ${
                kindFilter === k
                  ? "border-primary/40 bg-primary/15 text-foreground"
                  : "border-surface-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {KIND_META[k].label}
              {n > 0 && (
                <span className="ml-1.5 rounded-full bg-primary/20 px-1.5 text-[10px] font-bold text-primary">
                  {n}
                </span>
              )}
            </Link>
          );
        })}
        <span className="mx-1 h-4 w-px bg-surface-border" />
        <Link
          href={
            showAll
              ? `/admin/notifications${kindFilter ? `?kind=${kindFilter}` : ""}`
              : `/admin/notifications?all=1${kindFilter ? `&kind=${kindFilter}` : ""}`
          }
          className="text-xs font-medium text-primary hover:underline"
        >
          {showAll ? "Unread only" : "Show read too"}
        </Link>
      </div>

      {/* ---- Feed ---- */}
      <div className="space-y-2.5">
        {items.length === 0 && (
          <div className="surface-card p-10 text-center text-muted-foreground">
            <Bell className="mx-auto h-8 w-8 opacity-40" />
            <p className="mt-3">
              {showAll
                ? "Nothing here yet. New activity appears the moment it happens."
                : "All caught up. Nothing unread."}
            </p>
          </div>
        )}
        {items.map((n) => {
          const meta = kindMeta(n.kind);
          const unreadRow = !n.readAt;
          return (
            <article
              key={n.id}
              className={`surface-card flex flex-wrap items-start justify-between gap-3 p-4 ${
                unreadRow ? "border-l-2 border-l-primary" : "opacity-75"
              }`}
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${meta.cls}`}
                  >
                    {meta.label}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {n.createdAt.toLocaleString("en-CA", {
                      month: "short",
                      day: "numeric",
                      hour: "numeric",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <p className="mt-1.5 text-sm font-semibold leading-snug">
                  {n.title}
                </p>
                {n.body && (
                  <p className="mt-1 line-clamp-2 whitespace-pre-line text-xs text-muted-foreground">
                    {n.body}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Link
                  href={n.href ?? meta.href}
                  className="inline-flex items-center gap-1 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium transition-colors hover:bg-white/5"
                >
                  <ExternalLink className="h-3 w-3" />
                  Open
                </Link>
                {unreadRow && (
                  <form action={markRead}>
                    <input type="hidden" name="id" value={n.id} />
                    <button
                      type="submit"
                      className="inline-flex items-center gap-1 rounded-full border border-surface-border px-3 py-1.5 text-xs font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
                    >
                      <Check className="h-3 w-3" />
                      Read
                    </button>
                  </form>
                )}
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function markRead(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  const id = String(formData.get("id") ?? "");
  await db.adminNotification
    .updateMany({ where: { id, readAt: null }, data: { readAt: new Date() } })
    .catch(() => {});
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

async function markAllRead() {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return;
  await db.adminNotification
    .updateMany({ where: { readAt: null }, data: { readAt: new Date() } })
    .catch(() => {});
  revalidatePath("/admin/notifications");
  revalidatePath("/admin");
}

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { CalendarClock, CheckCircle2, History } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import { CATEGORY_ACCENT, CATEGORY_LABELS, formatCents } from "@/lib/loyalty";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Service History — upcoming appointments on top, past visits below.
 * Public category labels only; Jobber titles arrive pre-scrubbed
 * (lib/jobber.ts#scrubTitle).
 */
export default async function HistoryPage() {
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const records = await db.serviceRecord.findMany({
    where: { memberId: member.id },
    orderBy: { serviceDate: "desc" },
    take: 100,
  });

  const upcoming = records
    .filter((r) => r.status === "SCHEDULED")
    .sort((a, b) => a.serviceDate.getTime() - b.serviceDate.getTime());
  const past = records.filter((r) => r.status !== "SCHEDULED");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Service History
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Every visit, in one place. Quality you can see.
        </p>
      </header>

      {/* ---- Upcoming ---- */}
      <section>
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Upcoming</h2>
        </div>
        {upcoming.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No upcoming visits booked.{" "}
            <Link
              href="/account/requests?new=1&type=BOOK_SERVICE"
              className="font-medium text-primary hover:underline"
            >
              Request your next service
            </Link>{" "}
            or call {siteConfig.phoneDisplay}.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {upcoming.map((r) => (
              <article
                key={r.id}
                className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{r.title}</h3>
                    <CategoryChip category={r.category} />
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {r.serviceDate.toLocaleDateString("en-CA", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                    })}
                    {r.address ? ` · ${r.address}` : ""}
                  </p>
                </div>
                <span className="rounded-full border border-blue-500/25 bg-blue-500/15 px-3 py-1 text-xs font-medium text-blue-300">
                  Scheduled
                </span>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* ---- Past ---- */}
      <section>
        <div className="flex items-center gap-2">
          <History className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Past visits</h2>
        </div>
        {past.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No past visits on record yet. If you&apos;ve used PVS before with a
            different email, send us a request from the Requests tab and
            we&apos;ll connect your history.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {past.map((r) => (
              <article key={r.id} className="surface-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold">{r.title}</h3>
                      <CategoryChip category={r.category} />
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {r.serviceDate.toLocaleDateString("en-CA", {
                        month: "long",
                        day: "numeric",
                        year: "numeric",
                      })}
                      {r.address ? ` · ${r.address}` : ""}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 text-right">
                    {r.amountCents > 0 && (
                      <span className="text-sm font-semibold tabular-nums">
                        {formatCents(r.amountCents)}
                      </span>
                    )}
                    {r.status === "CANCELED" ? (
                      <span className="rounded-full border border-slate-500/25 bg-slate-500/15 px-3 py-1 text-xs font-medium text-slate-300">
                        Canceled
                      </span>
                    ) : r.paid ? (
                      <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/25 bg-emerald-500/15 px-3 py-1 text-xs font-medium text-emerald-300">
                        <CheckCircle2 className="h-3.5 w-3.5" />
                        Paid
                      </span>
                    ) : (
                      <span className="rounded-full border border-amber-500/25 bg-amber-500/15 px-3 py-1 text-xs font-medium text-amber-200">
                        Unpaid
                      </span>
                    )}
                  </div>
                </div>
                {r.photoUrls.length > 0 && (
                  <div className="mt-4 flex gap-2 overflow-x-auto">
                    {r.photoUrls.slice(0, 6).map((url) => (
                      <img
                        key={url}
                        src={url}
                        alt={`${r.title} photo`}
                        loading="lazy"
                        className="h-24 w-32 shrink-0 rounded-xl border border-surface-border object-cover"
                      />
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function CategoryChip({
  category,
}: {
  category: keyof typeof CATEGORY_LABELS;
}) {
  return (
    <span
      className={`rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${CATEGORY_ACCENT[category]}`}
    >
      {CATEGORY_LABELS[category]}
    </span>
  );
}

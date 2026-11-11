import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, prettyDate, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, Panel } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";

export const dynamic = "force-dynamic";

const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-CA", { hour: "numeric", minute: "2-digit", timeZone: "America/Toronto" });

/** Job Photos — every stop photo, by day and crew. The answer to "did you actually do my yard?" */
export default async function PhotosPage(props: { searchParams: Promise<{ date?: string; q?: string }> }) {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="Photos are indexed in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const sp = await props.searchParams;
  const q = (sp.q ?? "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : ymd();

  const stops = await db.gamePlanStop.findMany({
    where: q
      ? { photoUrls: { isEmpty: false }, address: { contains: q, mode: "insensitive" } }
      : { photoUrls: { isEmpty: false }, plan: { date } },
    include: { plan: { select: { date: true, crew: { select: { name: true } } } }, doneBy: { select: { name: true } } },
    orderBy: q ? { doneAt: "desc" } : { sortOrder: "asc" },
    take: 120,
  });

  const byCrew = new Map<string, typeof stops>();
  for (const s of stops) {
    const k = q ? `${s.plan.date} · ${s.plan.crew.name}` : s.plan.crew.name;
    byCrew.set(k, [...(byCrew.get(k) ?? []), s]);
  }

  return (
    <div className="space-y-5">
      <PageHeader
        title="Job Photos"
        description={q ? `Every photo at addresses matching "${q}"` : `${prettyDate(date)} · ${stops.reduce((n, s) => n + s.photoUrls.length, 0)} photos`}
        actions={
          <form className="flex flex-wrap items-center gap-2">
            <input id="photos-q" name="q" defaultValue={q} placeholder="Search address" className="h-9 w-44 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
            <input id="photos-date" type="date" name="date" defaultValue={date} className="h-9 rounded-md border border-white/10 bg-[#0A0E18] px-2 text-sm text-white" />
            <button className="h-9 rounded-sm border border-white/[0.09] px-3 text-[13px] text-slate-300">Go</button>
            <a href={`/admin/game-plan/photos?date=${addDays(date, -1)}`} className="h-9 rounded-sm border border-white/[0.09] px-2 text-[13px] leading-9 text-slate-300">Prev</a>
            <a href={`/admin/game-plan/photos?date=${addDays(date, 1)}`} className="h-9 rounded-sm border border-white/[0.09] px-2 text-[13px] leading-9 text-slate-300">Next</a>
          </form>
        }
      />
      <GamePlanTabs />

      {stops.length === 0 && (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">No photos {q ? "for that address" : "for this day"} yet.</p>
      )}

      {[...byCrew.entries()].map(([crew, list]) => (
        <Panel key={crew} title={crew} subtitle={`${list.length} stop${list.length === 1 ? "" : "s"} with photos`}>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {list.map((s) => (
              <div key={s.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-3">
                <p className="text-[13px] font-medium text-slate-100">{s.address}</p>
                <p className="text-[12px] text-slate-500">
                  {s.service}{s.doneBy ? ` · ${s.doneBy.name}` : ""}{s.doneAt ? ` · ${fmtTime(s.doneAt)}` : ""}
                </p>
                {s.crewNote && <p className="mt-1 text-[12px] italic text-slate-400">&ldquo;{s.crewNote}&rdquo;</p>}
                <div className="mt-2 grid grid-cols-3 gap-1.5">
                  {s.photoUrls.map((u) => (
                    <a key={u} href={u} target="_blank" rel="noopener" className="block aspect-square overflow-hidden rounded">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={u.replace("/upload/", "/upload/c_fill,w_400,h_400,q_auto,f_auto/")} alt="" loading="lazy" className="h-full w-full object-cover transition hover:scale-105" />
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

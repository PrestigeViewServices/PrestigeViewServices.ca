import Link from "next/link";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { addDays, prettyDate, weekStart, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, adminBtn } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { WeekGrid } from "@/components/admin/game-plan/week-grid";

export const dynamic = "force-dynamic";

/** Week — the whole team's week on one grid. Crews see it under "This week". */
export default async function WeekPage(props: { searchParams: Promise<{ week?: string }> }) {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return <NotConfigured service="Database" reason="The week grid stores plans in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />;
  }
  const db = getDb()!;
  const sp = await props.searchParams;
  const ws = weekStart(/^\d{4}-\d{2}-\d{2}$/.test(sp.week ?? "") ? sp.week! : ymd());
  const dates = Array.from({ length: 7 }, (_, i) => addDays(ws, i));

  const crews = await db.crew.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, truck: true,
      gamePlans: { where: { date: { in: dates } }, select: { date: true, headline: true, startTime: true, truck: true, published: true, _count: { select: { stops: true } } } },
    },
  });

  const rows = crews.map((c) => ({
    id: c.id, name: c.name, truck: c.truck,
    days: dates.map((date) => {
      const p = c.gamePlans.find((g) => g.date === date);
      return { date, headline: p?.headline ?? "", startTime: p?.startTime ?? "", truck: p?.truck ?? "", stopCount: p?._count.stops ?? 0, published: p?.published ?? true };
    }),
  }));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Week"
        description={`${prettyDate(ws)} to ${prettyDate(addDays(ws, 6))}. One line per crew per day; crews see it on their phones right away.`}
        actions={
          <>
            <Link href={`/admin/game-plan/week?week=${addDays(ws, -7)}`} className={adminBtn.secondary}>Prev week</Link>
            <Link href={`/admin/game-plan/week`} className={adminBtn.secondary}>This week</Link>
            <Link href={`/admin/game-plan/week?week=${addDays(ws, 7)}`} className={adminBtn.secondary}>Next week</Link>
          </>
        }
      />
      <GamePlanTabs />
      {rows.length === 0 ? (
        <p className="rounded-xl border border-dashed border-white/10 p-8 text-center text-sm text-slate-400">
          No crews yet. <Link href="/admin/game-plan/team" className="text-sky-300 underline-offset-2 hover:underline">Set up crews</Link>
        </p>
      ) : (
        <WeekGrid key={ws} crews={rows} weekStart={ws} />
      )}
    </div>
  );
}

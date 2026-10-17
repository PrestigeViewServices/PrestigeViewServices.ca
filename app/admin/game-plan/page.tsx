import Link from "next/link";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { planDefaults, toCheckItems, ymd } from "@/lib/crew-app";
import { NotConfigured } from "@/components/admin/not-configured";
import { PageHeader, adminBtn } from "@/components/admin/page-header";
import { GamePlanTabs } from "@/components/admin/game-plan/tabs";
import { PlanEditor } from "@/components/admin/game-plan/plan-editor";

export const dynamic = "force-dynamic";

/**
 * Game Plan — post tomorrow's route and brief for each crew. What you post
 * here is what the crew sees at prestigeviewservices.ca/crew within 20 s.
 */
export default async function GamePlanPage(props: {
  searchParams: Promise<{ crew?: string; date?: string }>;
}) {
  await requireRole(["ultimate_admin", "admin", "manager"]);
  if (!isDbReady()) {
    return (
      <NotConfigured service="Database" reason="The crew app stores plans in Postgres." envVars={["DATABASE_URL"]} missing={missingDbEnvVars()} />
    );
  }
  const db = getDb()!;
  const sp = await props.searchParams;
  const date = /^\d{4}-\d{2}-\d{2}$/.test(sp.date ?? "") ? sp.date! : ymd();
  const crews = await db.crew.findMany({
    where: { active: true },
    orderBy: { name: "asc" },
    select: {
      id: true, name: true, truck: true,
      members: { where: { active: true }, orderBy: [{ rank: "asc" }, { name: "asc" }], select: { id: true, name: true, rank: true, pinHash: true } },
    },
  });
  const [defaults, rules] = await Promise.all([
    planDefaults(),
    db.pointRule.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" }, select: { label: true, points: true } }),
  ]);
  const crewId = crews.find((c) => c.id === sp.crew)?.id ?? crews[0]?.id ?? "";
  const plan = crewId
    ? await db.gamePlan.findUnique({
        where: { crewId_date: { crewId, date } },
        include: { stops: { orderBy: { sortOrder: "asc" } } },
      })
    : null;

  const needsPin = crews.flatMap((c) => c.members.filter((m) => !m.pinHash).map((m) => m.name));

  return (
    <div className="space-y-5">
      <PageHeader
        title="Game Plan"
        description="The standard daily game plan. Lead, truck, gear, quality standard, points and contact are prefilled; type weather, mission, stops and any heads-up, then post."
        actions={<Link href="/crew" target="_blank" className={adminBtn.secondary}>Open crew app</Link>}
      />
      <GamePlanTabs />

      {crews.length === 0 ? (
        <div className="rounded-xl border border-white/[0.07] bg-[#0E1322] p-8 text-center">
          <p className="text-sm text-slate-300">No crews yet.</p>
          <Link href="/admin/game-plan/team" className={`${adminBtn.primary} mt-3`}>Set up crews and PINs</Link>
        </div>
      ) : (
        <>
          {needsPin.length > 0 && (
            <p className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-[13px] text-amber-200">
              {needsPin.join(", ")} {needsPin.length === 1 ? "has" : "have"} no PIN yet and can&apos;t sign in.{" "}
              <Link href="/admin/game-plan/team" className="underline underline-offset-2">Set PINs</Link>
            </p>
          )}
          <PlanEditor
            key={`${crewId}-${date}`}
            crews={crews.map(({ id, name, truck, members }) => ({ id, name, truck, members: members.map((m) => ({ id: m.id, name: m.name, rank: m.rank })) }))}
            crewId={crewId}
            date={date}
            defaults={defaults}
            rules={rules}
            plan={
              plan
                ? {
                    id: plan.id,
                    headline: plan.headline,
                    truck: plan.truck,
                    trailer: plan.trailer,
                    startTime: plan.startTime,
                    weather: plan.weather,
                    mission: plan.mission,
                    brief: plan.brief,
                    headsUp: plan.headsUp,
                    contact: plan.contact,
                    tomorrowDrop: plan.tomorrowDrop,
                    leadId: plan.leadId,
                    gear: toCheckItems(plan.gear).map((g) => g.label),
                    endOfDay: toCheckItems(plan.endOfDay).map((g) => g.label),
                    published: plan.published,
                    updatedAt: plan.updatedAt.toISOString(),
                    stops: plan.stops.map((s) => ({ id: s.id, time: s.time, address: s.address, service: s.service, note: s.note, upsell: s.upsell, customerName: s.customerName, customerPhone: s.customerPhone, phoneVisibility: s.phoneVisibility, status: s.status, photoUrls: s.photoUrls })),
                  }
                : null
            }
          />
        </>
      )}
    </div>
  );
}

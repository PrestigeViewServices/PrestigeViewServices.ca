import Link from "next/link";
import { Gift, PartyPopper, Ticket, Trophy } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import { memberEntryBreakdown, winnerDisplay } from "@/lib/giveaways";
import { tierDef } from "@/lib/loyalty";

export const dynamic = "force-dynamic";

export default async function GiveawaysPage() {
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const [current, past] = await Promise.all([
    db.giveaway.findFirst({
      where: { status: "OPEN" },
      orderBy: { opensAt: "desc" },
    }),
    db.giveaway.findMany({
      where: { status: "DRAWN" },
      orderBy: { drawnAt: "desc" },
      take: 8,
    }),
  ]);

  const breakdown = current
    ? await memberEntryBreakdown(db, current, {
        id: member.id,
        tier: member.profile?.tier ?? "MEMBER",
      })
    : null;

  const winners = await Promise.all(
    past.map(async (g) => ({
      g,
      winner: g.winnerEntryId ? await winnerDisplay(db, g.winnerEntryId) : null,
    }))
  );

  const tierName = tierDef(member.profile?.tier ?? "MEMBER").name;

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Giveaways
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quarterly draws for club members, higher tiers get more entries.
        </p>
      </header>

      {current ? (
        <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8">
          <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
            <PartyPopper className="h-4 w-4" />
            Current draw
          </p>
          <h2 className="mt-2 text-2xl font-bold text-white">{current.title}</h2>
          <p className="mt-1 text-sm text-sky-100/85">
            Prize: {current.prize}
            {current.closesAt &&
              ` · entries close ${current.closesAt.toLocaleDateString("en-CA", { month: "long", day: "numeric" })}`}
          </p>
          {breakdown && (
            <div className="mt-5 inline-flex items-center gap-3 rounded-2xl bg-white/10 px-5 py-3 backdrop-blur">
              <Ticket className="h-6 w-6 text-sky-200" />
              <div>
                <p className="text-2xl font-bold text-white tabular-nums">
                  {breakdown.total}{" "}
                  <span className="text-sm font-medium text-sky-100/80">
                    {breakdown.total === 1 ? "entry" : "entries"}
                  </span>
                </p>
                <p className="text-xs text-sky-100/70">
                  {breakdown.tierEntries} from your {tierName} tier
                  {breakdown.referralEntries > 0 &&
                    ` + ${breakdown.referralEntries} referral bonus`}
                </p>
              </div>
            </div>
          )}
          <p className="mt-4 text-xs text-sky-100/70">
            You&apos;re entered automatically, nothing to do. Want more
            entries?{" "}
            <Link href="/account/referrals" className="font-medium text-white underline">
              Refer a friend
            </Link>{" "}
            (+1 entry each) or climb a tier.
          </p>
        </section>
      ) : (
        <section className="surface-card p-6 text-sm text-muted-foreground">
          <Gift className="h-6 w-6 text-primary" />
          <p className="mt-3">
            No draw is open right now, quarterly giveaways are announced here
            and by email. Your tier entries are automatic when one opens.
          </p>
        </section>
      )}

      {/* ---- Past winners ---- */}
      <section>
        <div className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Past winners</h2>
        </div>
        {winners.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            The first draw hasn&apos;t happened yet, it could be you.
          </p>
        ) : (
          <div className="mt-3 surface-card divide-y divide-surface-border">
            {winners.map(({ g, winner }) => (
              <div key={g.id} className="flex items-center justify-between gap-3 px-5 py-3 text-sm">
                <div>
                  <p className="font-medium">{g.title}</p>
                  <p className="text-xs text-muted-foreground">
                    {g.prize}
                    {g.drawnAt && ` · drawn ${g.drawnAt.toLocaleDateString("en-CA")}`}
                  </p>
                </div>
                <span className="shrink-0 font-semibold text-emerald-300">
                  {winner ?? "Winner pending"}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>

      <p className="text-xs text-muted-foreground">
        No purchase necessary,{" "}
        <Link href="/giveaway-entry" className="text-primary hover:underline">
          free entry form
        </Link>{" "}
        ·{" "}
        <Link href="/giveaway-rules" className="text-primary hover:underline">
          official rules
        </Link>
        . Open to Ontario residents 18+, Quebec excluded. Winners answer a
        skill-testing question.
      </p>
    </div>
  );
}

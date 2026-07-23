import {
  ArrowDownRight,
  ArrowUpRight,
  Cake,
  Check,
  Clock,
  Gift,
  MessageSquareHeart,
  Snowflake,
  Sparkles,
  Star,
  Users,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import {
  CENTS_PER_POINT,
  EXPIRY_MONTHS,
  POINTS,
  REDEEM_OPTIONS,
  TIERS,
  creditCentsForPoints,
  expiryInfo,
  formatCents,
  formatPoints,
  pointsBalance,
  rollingSpendCents,
  tierForSpend,
} from "@/lib/loyalty";
import { TierBadge } from "@/components/account/tier-progress";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const TYPE_LABEL: Record<string, string> = {
  EARN_SERVICE: "Service visit",
  EARN_REVIEW: "Google review bonus",
  EARN_REFERRAL: "Referral bonus",
  EARN_CROSS_CATEGORY: "New category bonus",
  EARN_SNOW_EARLYBIRD: "Snow early-bird bonus",
  EARN_BIRTHDAY: "Birthday bonus",
  REDEEM: "Redeemed for credit",
  EXPIRE: "Points expired",
  ADMIN_ADJUST: "Adjustment",
};

export default async function RewardsPage() {
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const [balance, spendCents, ledger, expiry] = await Promise.all([
    pointsBalance(db, member.id),
    rollingSpendCents(db, member.id),
    db.pointsTransaction.findMany({
      where: { memberId: member.id },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    expiryInfo(db, member.id),
  ]);

  const tier = tierForSpend(spendCents);
  const creditValue = creditCentsForPoints(balance);

  // Expiry warning: within 6 months of the 24-month inactivity cutoff.
  const warnExpiry =
    expiry.expiresAt &&
    balance > 0 &&
    expiry.expiresAt.getTime() - Date.now() < 183 * 24 * 60 * 60 * 1000;

  const earnCards = [
    {
      icon: Check,
      points: POINTS.PER_VISIT,
      title: "Every completed visit",
      body: "Points post automatically when your invoice is paid, every single service.",
      highlight: false,
    },
    {
      icon: Star,
      points: POINTS.CROSS_CATEGORY,
      title: "Try a second category",
      body: "Your first booking in a new category, windows, lawn, or snow, earns a one-time bonus. The fastest boost in the club.",
      highlight: true,
    },
    {
      icon: Users,
      points: POINTS.REFERRAL,
      title: "Refer a friend",
      body: "They complete their first paid service and get $25 off it, you get the points. (Referral links coming to the portal soon, mention a friend by name for now.)",
      highlight: false,
    },
    {
      icon: MessageSquareHeart,
      points: POINTS.REVIEW,
      title: "Leave a Google review",
      body: "One-time bonus once our team verifies it. Reviews keep a local crew rolling.",
      highlight: false,
    },
    {
      icon: Snowflake,
      points: POINTS.SNOW_EARLYBIRD,
      title: "Snow pass early bird",
      body: "Sign your seasonal snow contract before the early-bird deadline.",
      highlight: false,
    },
    {
      icon: Cake,
      points: POINTS.BIRTHDAY,
      title: "Birthday bonus",
      body: "Set your birthday month in your profile and the points arrive on their own.",
      highlight: false,
    },
  ];

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Points &amp; Rewards
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Quality you can see. Rewards you can feel.
          </p>
        </div>
        <TierBadge spendCents={spendCents} />
      </header>

      {/* ---- Balance + redemption ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Balance
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {formatPoints(balance)}
              <span className="ml-1.5 text-base font-medium text-muted-foreground">
                pts
              </span>
            </p>
          </div>
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Worth in service credit
            </p>
            <p className="mt-1 text-4xl font-bold tabular-nums">
              {formatCents(creditValue)}
            </p>
          </div>
        </div>

        <div className="mt-6 border-t border-surface-border pt-5">
          <div className="flex items-center gap-2">
            <Gift className="h-4 w-4 text-primary" />
            <h2 className="text-sm font-semibold">Redeem for service credit</h2>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {REDEEM_OPTIONS.map((pts) => {
              const affordable = balance >= pts;
              return (
                <div
                  key={pts}
                  className={`rounded-xl border p-3 text-center ${
                    affordable
                      ? "border-primary/40 bg-primary/10"
                      : "border-surface-border bg-surface/40 opacity-60"
                  }`}
                >
                  <p className="text-lg font-bold">
                    {formatCents(pts * CENTS_PER_POINT)}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatPoints(pts)} pts
                  </p>
                </div>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Online redemption requests are coming to the portal shortly. Until
            then, call {siteConfig.phoneDisplay} or send a request from the
            Requests tab and we&apos;ll apply your credit to your next
            invoice. Credits apply to future services, never cash, and combine
            with other promos up to 20% off an invoice, your military discount
            always stacks on top.
          </p>
        </div>
      </section>

      {warnExpiry && expiry.expiresAt && (
        <section className="flex items-start gap-3 rounded-2xl border border-amber-400/30 bg-amber-500/10 p-5">
          <Clock className="mt-0.5 h-5 w-5 shrink-0 text-amber-300" aria-hidden />
          <p className="text-sm leading-relaxed">
            <span className="font-semibold">Heads up:</span> points expire
            after {EXPIRY_MONTHS} months without a paid service. Yours are on
            track to expire around{" "}
            <span className="font-semibold">
              {expiry.expiresAt.toLocaleDateString("en-CA", {
                month: "long",
                year: "numeric",
              })}
            </span>
            , any completed visit before then resets the clock.
          </p>
        </section>
      )}

      {/* ---- How to earn ---- */}
      <section id="earn">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">How to earn more</h2>
        </div>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {earnCards.map((c) => (
            <div
              key={c.title}
              className={`surface-card p-5 ${
                c.highlight ? "border-primary/50 ring-1 ring-primary/40" : ""
              }`}
            >
              <div className="flex items-center justify-between gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                  <c.icon className="h-4 w-4" />
                </span>
                <span className="rounded-full bg-emerald-500/15 px-2.5 py-0.5 text-xs font-bold text-emerald-300">
                  +{c.points} pts
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{c.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {c.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Your tier perks ---- */}
      <section>
        <h2 className="text-lg font-semibold">
          Your {tier.name} perks
        </h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2">
          {tier.perks.map((perk) => (
            <li
              key={perk}
              className="flex items-start gap-2.5 rounded-xl border border-surface-border bg-surface/50 px-4 py-3 text-sm"
            >
              <Check
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                strokeWidth={3}
              />
              <span>{perk}</span>
            </li>
          ))}
        </ul>
        <details className="mt-4">
          <summary className="cursor-pointer text-sm font-medium text-primary">
            See all tiers
          </summary>
          <div className="mt-3 grid gap-4 sm:grid-cols-2">
            {TIERS.map((t) => (
              <div
                key={t.key}
                className={`surface-card p-5 ${
                  t.key === tier.key ? "border-primary/50" : ""
                }`}
              >
                <div className="flex items-center justify-between">
                  <h3 className="font-bold">{t.name}</h3>
                  <span className="text-xs text-muted-foreground">
                    {t.minCents === 0
                      ? "Everyone"
                      : `${formatCents(t.minCents)}+ / yr`}
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{t.blurb}</p>
                <ul className="mt-3 space-y-1.5 text-xs">
                  {t.perks.map((p) => (
                    <li key={p} className="flex items-start gap-1.5">
                      <Check className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </details>
      </section>

      {/* ---- Ledger ---- */}
      <section>
        <h2 className="text-lg font-semibold">Points history</h2>
        <div className="mt-3 surface-card divide-y divide-surface-border">
          {ledger.length === 0 && (
            <p className="p-6 text-sm text-muted-foreground">
              No points activity yet, your first completed visit starts the
              ledger.
            </p>
          )}
          {ledger.map((tx) => {
            const positive = tx.amount >= 0;
            return (
              <div
                key={tx.id}
                className="flex items-center justify-between gap-3 px-5 py-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <span
                    className={`grid h-8 w-8 shrink-0 place-items-center rounded-full ${
                      positive
                        ? "bg-emerald-500/15 text-emerald-300"
                        : "bg-rose-500/15 text-rose-300"
                    }`}
                  >
                    {positive ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">
                      {tx.note || TYPE_LABEL[tx.type] || tx.type}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {TYPE_LABEL[tx.type] ?? tx.type} ·{" "}
                      {tx.createdAt.toLocaleDateString("en-CA")}
                    </p>
                  </div>
                </div>
                <span
                  className={`shrink-0 text-sm font-bold tabular-nums ${
                    positive ? "text-emerald-300" : "text-rose-300"
                  }`}
                >
                  {positive ? "+" : ""}
                  {formatPoints(tx.amount)}
                </span>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}

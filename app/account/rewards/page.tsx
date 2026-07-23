import { revalidatePath } from "next/cache";
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
import { getMember, requireMemberId } from "@/lib/customer-auth";
import {
  EXPIRY_MONTHS,
  availablePoints,
  creditCentsForPoints,
  expiryInfo,
  formatCents,
  formatPoints,
  pointsBalance,
  redeemOptionsFor,
  rollingSpendCents,
  tierForSpend,
} from "@/lib/loyalty";
import { clubTiers, getClubSettings } from "@/lib/club-settings";
import { clubNotifyEmail, sendClubEmail } from "@/lib/send-club-email";
import { TierBadge } from "@/components/account/tier-progress";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const REDEMPTION_STATUS_META: Record<
  string,
  { label: string; cls: string }
> = {
  REQUESTED: {
    label: "Requested",
    cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  },
  APPROVED: {
    label: "Approved",
    cls: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  },
  APPLIED: {
    label: "Applied to invoice",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
  DECLINED: {
    label: "Declined",
    cls: "bg-rose-500/15 text-rose-300 border-rose-500/25",
  },
};

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

  const [settings, balance, available, spendCents, ledger, expiry, redemptions, reviewClaim] =
    await Promise.all([
      getClubSettings(db),
      pointsBalance(db, member.id),
      availablePoints(db, member.id),
      rollingSpendCents(db, member.id),
      db.pointsTransaction.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        take: 100,
      }),
      expiryInfo(db, member.id),
      db.redemption.findMany({
        where: { memberId: member.id },
        orderBy: { createdAt: "desc" },
        take: 20,
      }),
      db.reviewClaim.findFirst({
        where: { memberId: member.id, status: { not: "REJECTED" } },
        orderBy: { createdAt: "desc" },
      }),
    ]);

  const tiers = clubTiers(settings);
  const tier = tierForSpend(spendCents, tiers);
  const creditValue = creditCentsForPoints(balance, settings.centsPerPoint);
  const redeemOptions = redeemOptionsFor(settings.centsPerPoint);

  // Expiry warning: within 6 months of the 24-month inactivity cutoff.
  const warnExpiry =
    expiry.expiresAt &&
    balance > 0 &&
    expiry.expiresAt.getTime() - Date.now() < 183 * 24 * 60 * 60 * 1000;

  const earnCards = [
    {
      icon: Check,
      points: settings.pointsPerVisit,
      title: "Every completed visit",
      body: "Points post automatically when your invoice is paid, every single service.",
      highlight: false,
    },
    {
      icon: Star,
      points: settings.pointsCrossCategory,
      title: "Try a second category",
      body: "Your first booking in a new category, windows, lawn, or snow, earns a one-time bonus. The fastest boost in the club.",
      highlight: true,
    },
    {
      icon: Users,
      points: settings.pointsReferral,
      title: "Refer a friend",
      body: "Share your link from the Refer a Friend tab, they get $25 off their first service, you get the points once it's completed and paid.",
      highlight: false,
    },
    {
      icon: MessageSquareHeart,
      points: settings.pointsReview,
      title: "Leave a Google review",
      body: "One-time bonus once our team verifies it. Reviews keep a local crew rolling.",
      highlight: false,
    },
    {
      icon: Snowflake,
      points: settings.pointsSnowEarlybird,
      title: "Snow pass early bird",
      body: "Sign your seasonal snow contract before the early-bird deadline.",
      highlight: false,
    },
    {
      icon: Cake,
      points: settings.pointsBirthday,
      title: "Birthday bonus",
      body: "Set your birthday month in your profile and the points arrive on their own.",
      highlight: false,
    },
  ].filter((c) => c.points > 0);

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
          {available < balance && (
            <p className="mt-1 text-xs text-muted-foreground">
              {formatPoints(balance - available)} pts are held by a pending
              request, {formatPoints(available)} available to redeem.
            </p>
          )}
          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {redeemOptions.map((pts) => {
              const affordable = available >= pts;
              return (
                <form key={pts} action={requestRedemption}>
                  <input type="hidden" name="points" value={pts} />
                  <button
                    type="submit"
                    disabled={!affordable}
                    className={`w-full rounded-xl border p-3 text-center transition-colors ${
                      affordable
                        ? "border-primary/40 bg-primary/10 hover:border-primary/70 hover:bg-primary/20"
                        : "cursor-not-allowed border-surface-border bg-surface/40 opacity-60"
                    }`}
                  >
                    <p className="text-lg font-bold">
                      {formatCents(pts * settings.centsPerPoint)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatPoints(pts)} pts
                    </p>
                    {affordable && (
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-wider text-primary">
                        Request
                      </p>
                    )}
                  </button>
                </form>
              );
            })}
          </div>
          <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
            Tap an amount to request it, we approve within one business day
            and apply the credit to your next invoice. Credits apply to future
            services, never cash, and combine with other promos up to 20% off
            an invoice, your military discount always stacks on top. Questions?{" "}
            {siteConfig.phoneDisplay}.
          </p>

          {redemptions.length > 0 && (
            <div className="mt-4 space-y-2">
              {redemptions.map((r) => {
                const meta =
                  REDEMPTION_STATUS_META[r.status] ??
                  REDEMPTION_STATUS_META.REQUESTED;
                return (
                  <div
                    key={r.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-surface-border bg-surface/50 px-4 py-2.5 text-sm"
                  >
                    <span>
                      {formatCents(r.creditCents)} credit ·{" "}
                      <span className="text-muted-foreground">
                        {formatPoints(r.points)} pts ·{" "}
                        {r.createdAt.toLocaleDateString("en-CA")}
                      </span>
                      {r.status === "APPLIED" && r.appliedInvoiceRef && (
                        <span className="text-muted-foreground">
                          {" "}
                          · invoice {r.appliedInvoiceRef}
                        </span>
                      )}
                    </span>
                    <span
                      className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11px] font-medium ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* ---- Review bonus claim ---- */}
      <section className="surface-card flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
        <div className="flex items-start gap-3">
          <MessageSquareHeart className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">
              Left us a Google review? That&apos;s +{settings.pointsReview}{" "}
              points.
            </p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              <a
                href={siteConfig.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Write your review
              </a>
              , then tell us below. We verify it (usually same day) and the
              points post automatically. One-time bonus.
            </p>
          </div>
        </div>
        {reviewClaim ? (
          <span
            className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${
              reviewClaim.status === "AWARDED"
                ? "border-emerald-500/25 bg-emerald-500/15 text-emerald-300"
                : "border-blue-500/25 bg-blue-500/15 text-blue-300"
            }`}
          >
            {reviewClaim.status === "AWARDED"
              ? "Bonus awarded"
              : "Being verified"}
          </span>
        ) : (
          <form action={claimReview}>
            <Button type="submit" size="sm" variant="outline" className="shrink-0">
              I left a review
            </Button>
          </form>
        )}
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
            {tiers.map((t) => (
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

// --- server actions ---------------------------------------------------------

async function requestRedemption(formData: FormData) {
  "use server";
  const memberId = await requireMemberId();
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const points = Math.trunc(Number(formData.get("points")));
  // Validate against the CURRENT redemption options (admin-tunable rate).
  const settings = await getClubSettings(db);
  if (!redeemOptionsFor(settings.centsPerPoint).includes(points)) {
    throw new Error("Invalid redemption amount");
  }

  // Validate against balance minus points already held by pending requests.
  const available = await availablePoints(db, memberId);
  if (available < points) throw new Error("Not enough available points");

  const member = await db.member.findUnique({ where: { id: memberId } });
  const redemption = await db.redemption.create({
    data: {
      memberId,
      points,
      creditCents: creditCentsForPoints(points, settings.centsPerPoint),
      status: "REQUESTED",
    },
  });

  await sendClubEmail({
    to: clubNotifyEmail(),
    subject: `Redemption request: ${formatCents(redemption.creditCents)} — ${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim(),
    replyTo: member?.email,
    text: [
      `${member?.firstName ?? "A member"} requested a ${formatCents(redemption.creditCents)} service credit (${points} pts).`,
      ``,
      `Approve or decline: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/admin/club/approvals`,
    ].join("\n"),
  });

  revalidatePath("/account/rewards");
}

async function claimReview() {
  "use server";
  const memberId = await requireMemberId();
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  // One-time bonus: any prior pending/awarded claim (or awarded points)
  // blocks a new claim.
  const [existing, awarded] = await Promise.all([
    db.reviewClaim.findFirst({
      where: { memberId, status: { not: "REJECTED" } },
    }),
    db.pointsTransaction.findFirst({
      where: { memberId, type: "EARN_REVIEW" },
    }),
  ]);
  if (existing || awarded) return;

  const member = await db.member.findUnique({ where: { id: memberId } });
  await db.reviewClaim.create({ data: { memberId } });
  await sendClubEmail({
    to: clubNotifyEmail(),
    subject: `Review bonus claim — ${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim(),
    replyTo: member?.email,
    text: [
      `${member?.firstName ?? "A member"} says they left a Google review.`,
      `Verify it, then approve the 250-pt bonus:`,
      `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/admin/club/approvals`,
    ].join("\n"),
  });
  revalidatePath("/account/rewards");
}

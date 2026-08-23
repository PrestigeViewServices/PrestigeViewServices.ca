import Link from "next/link";
import {
  ArrowRight,
  Check,
  Gift,
  ShieldCheck,
  Sparkles,
  Users,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import { formatCents, formatPoints } from "@/lib/loyalty";
import { getClubSettings } from "@/lib/club-settings";
import {
  REFERRAL_STATUS_META,
  ensureReferralCode,
  referralStageLabel,
  referralStats,
  referralUrl,
} from "@/lib/referrals";
import { generateQrPng } from "@/lib/qrcode";
import { ReferralShare } from "@/components/account/referral-share";
import { ReferralInviteForm } from "@/components/account/referral-invite-form";

export const dynamic = "force-dynamic";

/** Mask the friend's email in the member-facing list. */
function maskEmail(email: string | null): string {
  if (!email) return "A friend";
  const [user, domain] = email.split("@");
  if (!domain) return "A friend";
  const visible = user.slice(0, 2);
  return `${visible}${"•".repeat(Math.max(2, user.length - 2))}@${domain}`;
}

/**
 * Refer a friend — the member's whole referral hub: what they've earned, what
 * is still in flight, every way to share, and an honest list of who they've
 * already reached.
 */
export default async function ReferralsPage() {
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const code = await ensureReferralCode(db, member);
  if (!code) return null;

  const settings = await getClubSettings(db);
  const [referrals, stats, qrDataUrl] = await Promise.all([
    db.referral.findMany({
      where: { referrerId: member.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    referralStats(db, member.id, settings, code),
    generateQrPng(referralUrl(code)).catch(() => null),
  ]);

  const url = referralUrl(code);
  const rewardPoints = settings.pointsReferral;
  const rewardValue = formatCents(rewardPoints * settings.centsPerPoint);
  const friendCredit = formatCents(settings.referralFriendCents);
  const shareMessage = `PVS looks after our windows, lawn and snow and they're great. Use my link and you get ${friendCredit} off your first service:`;

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          Give {friendCredit}, get {rewardValue}
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          Refer a friend
        </h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground leading-relaxed">
          Anyone you send our way, friend, family, neighbour, coworker, gets{" "}
          {friendCredit} off their first service. Once that job is done and
          paid, {formatPoints(rewardPoints)} points ({rewardValue} toward your
          next service) land in your account. No limit on how many people you
          send.
        </p>
      </header>

      {/* ---- Earnings summary ---- */}
      <section className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Earned from referrals"
          value={formatCents(stats.earnedCents)}
          sub={`${formatPoints(stats.earnedPoints)} points banked`}
          tone="emerald"
        />
        <StatCard
          label="On the way"
          value={formatCents(stats.pendingCents)}
          sub={`${stats.booked + stats.completed} referral${
            stats.booked + stats.completed === 1 ? "" : "s"
          } in progress`}
          tone="amber"
        />
        <StatCard
          label="Friends referred"
          value={String(stats.total)}
          sub={`${stats.awarded} completed`}
          tone="sky"
        />
      </section>

      {/* ---- Share card ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Share your link</h2>
        </div>
        <div className="mt-4">
          <ReferralShare
            url={url}
            code={code}
            message={shareMessage}
            qrDataUrl={qrDataUrl}
          />
        </div>

        <ol className="mt-6 grid gap-3 border-t border-surface-border pt-5 text-xs text-muted-foreground sm:grid-cols-3">
          <li>
            <span className="font-semibold text-foreground">1.</span> Share your
            link or code with anyone who owns or rents a place around here.
          </li>
          <li>
            <span className="font-semibold text-foreground">2.</span> They
            request a quote through it and get {friendCredit} off their first
            service.
          </li>
          <li>
            <span className="font-semibold text-foreground">3.</span> Once that
            first job is completed and paid, {formatPoints(rewardPoints)} points
            hit your ledger automatically.
          </li>
        </ol>
      </section>

      {/* ---- Invite by email ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Invite someone directly</h2>
        </div>
        <p className="mt-1.5 text-sm text-muted-foreground">
          We&apos;ll send them one email with your link, and add them to your
          list below so you know who you&apos;ve already asked.
        </p>
        <div className="mt-5">
          <ReferralInviteForm credit={friendCredit} />
        </div>
      </section>

      {/* ---- Referral list ---- */}
      <section>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your referrals</h2>
        </div>
        {referrals.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            No referrals yet. Petawawa talks, one share usually does it.
          </p>
        ) : (
          <div className="mt-3 surface-card divide-y divide-surface-border">
            {referrals.map((r) => {
              const meta = REFERRAL_STATUS_META[r.status];
              const points = r.rewardPoints ?? settings.pointsReferral;
              return (
                <div
                  key={r.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">
                      {r.referredName || maskEmail(r.referredEmail)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {referralStageLabel(r.status, r.source)} ·{" "}
                      {r.createdAt.toLocaleDateString("en-CA")}
                    </p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {r.status === "AWARDED" && (
                      <span className="text-xs font-semibold text-emerald-300">
                        +{formatPoints(points)} pts
                      </span>
                    )}
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-medium ${meta.cls}`}
                    >
                      {meta.label}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ---- The rules, in plain language ---- */}
      <section className="rounded-2xl border border-surface-border bg-surface/40 p-5">
        <div className="flex items-center gap-2">
          <ShieldCheck className="h-4 w-4 text-primary" />
          <h2 className="text-sm font-semibold">How it works, in full</h2>
        </div>
        <ul className="mt-3 space-y-2 text-xs text-muted-foreground">
          {[
            `Your friend has to be new to us. Someone we've already invoiced doesn't count.`,
            `Your reward posts after their first service is completed and paid, not when they book.`,
            `${friendCredit} comes off their first invoice. We apply it, they don't need a coupon.`,
            `One referral per person. If two people refer the same friend, the first link through wins.`,
            `Points are worth ${formatCents(100 * settings.centsPerPoint)} per 100 and never expire while you're an active customer.`,
            `Referral points stack with your military and veteran discount.`,
          ].map((line) => (
            <li key={line} className="flex gap-2">
              <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
              <span>{line}</span>
            </li>
          ))}
        </ul>
        <Link
          href="/account/rewards"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-medium text-primary"
        >
          See your points ledger
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </section>
    </div>
  );
}

function StatCard({
  label,
  value,
  sub,
  tone,
}: {
  label: string;
  value: string;
  sub: string;
  tone: "emerald" | "amber" | "sky";
}) {
  const tones = {
    emerald: "border-emerald-500/25 bg-emerald-500/5 text-emerald-300",
    amber: "border-amber-500/25 bg-amber-500/5 text-amber-200",
    sky: "border-sky-500/25 bg-sky-500/5 text-sky-300",
  } as const;
  return (
    <div className={`rounded-2xl border p-5 ${tones[tone]}`}>
      <p className="text-[11px] uppercase tracking-wider opacity-80">{label}</p>
      <p className="mt-1 text-3xl font-bold tabular-nums tracking-tight text-foreground">
        {value}
      </p>
      <p className="mt-1 text-xs text-muted-foreground">{sub}</p>
    </div>
  );
}

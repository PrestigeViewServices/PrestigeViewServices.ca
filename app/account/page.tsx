import Link from "next/link";
import {
  ArrowRight,
  CalendarClock,
  Gift,
  Medal,
  MessagesSquare,
  Sparkles,
  Star,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import {
  CATEGORY_LABELS,
  CLUB_NAME,
  POINTS,
  formatPoints,
  pointsBalance,
  rollingSpendCents,
} from "@/lib/loyalty";
import { TierBadge, TierProgress } from "@/components/account/tier-progress";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

/**
 * Dashboard — the first thing a member sees: points, tier, next visit,
 * quick actions. Mobile-first, most traffic lands here from social links.
 */
export default async function AccountDashboardPage() {
  const member = await getMember();
  if (!member) return null; // layout renders the auth screen
  const db = getDb();
  if (!db) return null;

  const [balance, spendCents, nextService, openTickets, categoriesUsed] =
    await Promise.all([
      pointsBalance(db, member.id),
      rollingSpendCents(db, member.id),
      db.serviceRecord.findFirst({
        where: {
          memberId: member.id,
          status: "SCHEDULED",
          serviceDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
        orderBy: { serviceDate: "asc" },
      }),
      db.clubTicket.count({
        where: { memberId: member.id, status: { not: "RESOLVED" } },
      }),
      db.serviceRecord.groupBy({
        by: ["category"],
        where: { memberId: member.id, paid: true },
      }),
    ]);

  const isVeteran = member.profile?.veteranStatus !== "NONE";
  const singleCategory = categoriesUsed.length === 1;
  const usedCategory = singleCategory ? categoriesUsed[0].category : null;

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            {CLUB_NAME}
          </p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
            Welcome back, {member.firstName}
          </h1>
        </div>
        <TierBadge spendCents={spendCents} />
      </header>

      {/* ---- Points + tier card ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-wider text-muted-foreground">
              Your points
            </p>
            <p className="mt-1 text-5xl font-bold tabular-nums tracking-tight">
              {formatPoints(balance)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              100 points = $5 in service credit
            </p>
          </div>
          <Link
            href="/account/rewards"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
          >
            View rewards
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="mt-6">
          <TierProgress spendCents={spendCents} />
        </div>
      </section>

      {/* ---- Veteran discount band ---- */}
      <section className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/5 p-5">
        <Medal className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden />
        <p className="text-sm leading-relaxed">
          {isVeteran ? (
            <>
              <span className="font-semibold">
                Your military &amp; veteran discount is on file.
              </span>{" "}
              10% off every service, always, it stacks with your points
              credits. That&apos;s the PVS difference.
            </>
          ) : (
            <>
              <span className="font-semibold">
                Military, veteran, or first responder?
              </span>{" "}
              You get 10% off every service, always.{" "}
              <Link
                href="/account/profile"
                className="font-medium text-primary hover:underline"
              >
                Set it in your profile
              </Link>{" "}
              and we&apos;ll verify it on your first service.
            </>
          )}
        </p>
      </section>

      {/* ---- Next service ---- */}
      <section className="surface-card p-5 sm:p-6">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Next scheduled service</h2>
        </div>
        {nextService ? (
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-medium">{nextService.title}</p>
              <p className="text-sm text-muted-foreground">
                {CATEGORY_LABELS[nextService.category]} ·{" "}
                {nextService.serviceDate.toLocaleDateString("en-CA", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
                {nextService.address ? ` · ${nextService.address}` : ""}
              </p>
            </div>
            <Link
              href="/account/history"
              className="inline-flex items-center gap-1.5 text-sm font-medium text-primary"
            >
              All appointments
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing on the books yet. Leave the hard work to us,{" "}
            <Link
              href="/account/requests?new=1"
              className="font-medium text-primary hover:underline"
            >
              request your next service
            </Link>{" "}
            and we&apos;ll take it from there.
          </p>
        )}
      </section>

      {/* ---- Cross-category bonus promo (the cross-sell engine) ---- */}
      <section className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-5 sm:p-7">
        <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
          <Star className="h-4 w-4" aria-hidden />
          Bonus points
        </p>
        <h2 className="mt-2 text-xl font-bold text-white text-balance">
          Try a second service, pocket {POINTS.CROSS_CATEGORY} bonus points
        </h2>
        <p className="mt-2 max-w-xl text-sm leading-relaxed text-sky-100/85">
          {usedCategory ? (
            <>
              You&apos;ve booked {CATEGORY_LABELS[usedCategory]} with us, your
              first booking in any other category earns a one-time{" "}
              {POINTS.CROSS_CATEGORY}-point bonus on top of your visit points.
            </>
          ) : (
            <>
              Book in a second service category, windows, lawn, or snow, and
              your first visit there earns a one-time {POINTS.CROSS_CATEGORY}
              -point bonus. One property, one crew, one account.
            </>
          )}
        </p>
        <Link
          href="/account/requests?new=1&type=BOOK_SERVICE"
          className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-blue-950 transition-transform hover:scale-[1.02]"
        >
          Book a service
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* ---- Quick actions ---- */}
      <div className="grid gap-4 sm:grid-cols-3">
        <QuickAction
          href="/account/requests?new=1"
          icon={<MessagesSquare className="h-5 w-5" />}
          title="Request a service"
          sub="Quotes, bookings, callbacks"
        />
        <QuickAction
          href="/account/rewards"
          icon={<Gift className="h-5 w-5" />}
          title="Redeem points"
          sub={`${formatPoints(balance)} points ready`}
        />
        <QuickAction
          href="/account/rewards#earn"
          icon={<Star className="h-5 w-5" />}
          title="Earn more"
          sub="Reviews, referrals, bonuses"
        />
      </div>

      {openTickets > 0 && (
        <p className="text-sm text-muted-foreground">
          You have {openTickets} open request{openTickets === 1 ? "" : "s"},{" "}
          <Link
            href="/account/requests"
            className="font-medium text-primary hover:underline"
          >
            check the latest
          </Link>
          . Or call us anytime: {siteConfig.phoneDisplay}.
        </p>
      )}
    </div>
  );
}

function QuickAction({
  href,
  icon,
  title,
  sub,
}: {
  href: string;
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <Link
      href={href}
      className="surface-card surface-card-hover group flex items-center gap-4 p-5"
    >
      <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold">{title}</span>
        <span className="block truncate text-xs text-muted-foreground">
          {sub}
        </span>
      </span>
      <ArrowRight className="ml-auto h-4 w-4 shrink-0 text-muted-foreground/50 transition-transform group-hover:translate-x-1" />
    </Link>
  );
}

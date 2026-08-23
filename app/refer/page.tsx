import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgePercent,
  Check,
  Gift,
  HandCoins,
  Share2,
  ShieldCheck,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { AccountSavingsBanner } from "@/components/account-savings-banner";
import { getDb } from "@/lib/db";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { CLUB_NAME, formatCents, formatPoints } from "@/lib/loyalty";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Refer a Friend, Earn Toward Your Next Service",
  description:
    "Send a friend, family member, or neighbour to Prestige View Services. They save on their first service and you earn credit toward your next one.",
  alternates: { canonical: "/refer" },
};

/**
 * The public referral page — the link members can share with someone who
 * wants to understand the program before joining, and the page search sends
 * people to when they look up "PVS referral".
 *
 * Every number is read from the club settings, so the owner changes the
 * program in one place and this page follows.
 */
export default async function ReferPage() {
  const db = getDb();
  const settings = await getClubSettingsSafe(db);
  const offer = accountOffer(settings);

  const friendCredit = formatCents(settings.referralFriendCents);
  const rewardPoints = settings.pointsReferral;
  const rewardValue = formatCents(rewardPoints * settings.centsPerPoint);

  const steps = [
    {
      icon: Users,
      title: "Create your free account",
      body: `Every account gets its own referral link and code the moment you join.${
        offer.enabled
          ? ` Joining also takes ${offer.label} off your own next service.`
          : ""
      }`,
    },
    {
      icon: Share2,
      title: "Send it to whoever you like",
      body: "Friends, family, neighbours, the guy at work who complains about his gutters. Text it, email it, or let them scan your QR code.",
    },
    {
      icon: Gift,
      title: "They save on their first service",
      body: `Anyone who books through your link gets ${friendCredit} off their first job. We apply it ourselves, there's no coupon to remember.`,
    },
    {
      icon: HandCoins,
      title: "You get paid toward your next one",
      body: `Once their first service is completed and paid, ${formatPoints(
        rewardPoints
      )} points (${rewardValue} of service credit) land in your account automatically.`,
    },
  ];

  return (
    <>
      <section className="container-max pt-14 sm:pt-20">
        <SectionHeading
          eyebrow={`${CLUB_NAME} · Free to join`}
          title={`Give ${friendCredit}, get ${rewardValue}`}
          description={`Word of mouth is how this company grew. So we pay for it: send someone our way, they save ${friendCredit} on their first service, and you earn ${rewardValue} toward your next one.`}
        />

        {/* ---- The two halves of the deal ---- */}
        <div className="mx-auto mt-12 grid max-w-3xl gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-emerald-500/25 bg-emerald-500/5 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-emerald-300">
              Your friend gets
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {friendCredit}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              off their first service
            </p>
          </div>
          <div className="rounded-2xl border border-sky-500/25 bg-sky-500/5 p-6 text-center">
            <p className="text-xs uppercase tracking-wider text-sky-300">
              You get
            </p>
            <p className="mt-2 text-4xl font-bold tracking-tight">
              {rewardValue}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatPoints(rewardPoints)} points toward your next service
            </p>
          </div>
        </div>

        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            href="/account/referrals"
            className="inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-glow transition-transform hover:scale-[1.02]"
          >
            Get my referral link
            <ArrowRight className="h-4 w-4" />
          </Link>
          <Link
            href="/request-service"
            className="inline-flex items-center gap-2 rounded-full border border-surface-border px-6 py-3 text-sm font-semibold transition-colors hover:bg-white/5"
          >
            Someone referred me
          </Link>
        </div>
      </section>

      {/* ---- How it works ---- */}
      <section className="container-max py-16 sm:py-20">
        <SectionHeading
          eyebrow="How it works"
          title="Four steps, no paperwork"
          align="left"
        />
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {steps.map((step, i) => {
            const Icon = step.icon;
            return (
              <div key={step.title} className="surface-card p-6">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                    <Icon className="h-5 w-5" />
                  </span>
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
                  </p>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{step.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {step.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ---- Account push ---- */}
      {offer.enabled && (
        <section className="container-max pb-16">
          <AccountSavingsBanner />
        </section>
      )}

      {/* ---- The fine print, stated plainly ---- */}
      <section className="container-max pb-16">
        <div className="surface-card p-6 sm:p-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-semibold">The rules, in plain English</h2>
          </div>
          <ul className="mt-4 grid gap-2.5 text-sm text-muted-foreground sm:grid-cols-2">
            {[
              "The person you refer has to be new to us. Someone we've already invoiced doesn't count.",
              "Your reward posts once their first service is completed and paid, not when they book.",
              `${friendCredit} comes off their first invoice automatically.`,
              "One referral per person. If two members refer the same friend, the first link through wins.",
              "You can refer as many people as you like.",
              `Points are worth ${formatCents(100 * settings.centsPerPoint)} per 100, and stack with the military and veteran discount.`,
            ].map((line) => (
              <li key={line} className="flex gap-2">
                <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>{line}</span>
              </li>
            ))}
          </ul>
          {offer.enabled && (
            <p className="mt-5 flex items-start gap-2 border-t border-surface-border pt-4 text-sm text-muted-foreground">
              <BadgePercent
                className="mt-0.5 h-4 w-4 shrink-0 text-primary"
                aria-hidden
              />
              <span>
                Referral rewards are separate from the {offer.label} account
                discount. Creating a free account gets you both.
              </span>
            </p>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Questions about the program? Call us at {siteConfig.phoneDisplay} and
            we&apos;ll sort it out.
          </p>
        </div>
      </section>

      <CtaBand
        eyebrow="Referred by a friend?"
        title="Claim your first-service credit"
        description={`Send us your request through their link and we'll take ${friendCredit} off the first job. Free quote, one business day, no obligation.`}
        primaryLabel="Request Service"
        primaryHref="/request-service"
      />
    </>
  );
}

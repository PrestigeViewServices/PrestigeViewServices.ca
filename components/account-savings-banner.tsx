import Link from "next/link";
import { ArrowRight, BadgePercent, Gift, Sparkles } from "lucide-react";
import { getDb } from "@/lib/db";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents, formatPoints } from "@/lib/loyalty";

/**
 * "Create a free account and save X%" — the site-wide push toward accounts.
 *
 * One component so the number lives in exactly one place: the owner changes
 * it at /admin/club/settings and every banner on the site follows, or turns
 * the whole offer off with a single toggle.
 *
 * Renders nothing when the offer is disabled, so callers can drop it in
 * without conditionals.
 */
export async function AccountSavingsBanner({
  variant = "card",
  className = "",
}: {
  /** "card" = full pitch. "strip" = one slim line above a form. */
  variant?: "card" | "strip";
  className?: string;
}) {
  const db = getDb();
  const settings = await getClubSettingsSafe(db);
  const offer = accountOffer(settings);
  if (!offer.enabled) return null;

  const referralCredit = formatCents(settings.referralFriendCents);
  const referralReward = formatCents(
    settings.pointsReferral * settings.centsPerPoint
  );

  if (variant === "strip") {
    return (
      <div
        className={`flex flex-wrap items-center gap-x-3 gap-y-1.5 rounded-xl border border-primary/30 bg-primary/10 px-4 py-3 text-sm ${className}`}
      >
        <BadgePercent className="h-4 w-4 shrink-0 text-primary" aria-hidden />
        <p className="min-w-0">
          <span className="font-semibold">
            Save {offer.label} on this service
          </span>{" "}
          <span className="text-muted-foreground">
            when you create a free PVS account.
          </span>
        </p>
        <Link
          href="/account"
          className="ml-auto inline-flex items-center gap-1 whitespace-nowrap text-sm font-semibold text-primary hover:underline"
        >
          Create account
          <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      </div>
    );
  }

  return (
    <section
      className={`relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-blue-950 via-blue-900 to-sky-900 p-6 sm:p-8 ${className}`}
    >
      <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
        <Sparkles className="h-4 w-4" aria-hidden />
        Free to join
      </p>
      <h2 className="mt-2 text-2xl font-bold text-white text-balance sm:text-3xl">
        Create an account, save {offer.label} on your next service
      </h2>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-sky-100/85">
        Members get {offer.label} off their next service, points on every paid
        visit, and their whole property history in one place. It takes about
        thirty seconds and costs nothing.
      </p>
      <ul className="mt-5 grid gap-2 text-sm text-sky-100/90 sm:grid-cols-2">
        {[
          `${offer.label} off your next service, just for joining`,
          `${formatPoints(settings.pointsPerVisit)} points every paid visit`,
          `Refer anyone: they save ${referralCredit}, you earn ${referralReward}`,
          `Book, reschedule, and see every past job in one place`,
        ].map((line) => (
          <li key={line} className="flex items-start gap-2">
            <Gift className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
            <span>{line}</span>
          </li>
        ))}
      </ul>
      <Link
        href="/account"
        className="mt-6 inline-flex items-center gap-1.5 rounded-full bg-white px-6 py-3 text-sm font-semibold text-blue-950 transition-transform hover:scale-[1.02]"
      >
        Create my free account
        <ArrowRight className="h-4 w-4" />
      </Link>
    </section>
  );
}

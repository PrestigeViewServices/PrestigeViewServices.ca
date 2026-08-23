import { PartyPopper } from "lucide-react";
import { getDb } from "@/lib/db";
import { getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";
import { normalizeCode } from "@/lib/referrals";

/**
 * Shown to a friend who arrived on a referral link: names the person who sent
 * them and states the credit up front, so the promise on the link is the same
 * promise on the page.
 *
 * Renders nothing without a valid code — a bad or expired link just shows the
 * normal form rather than a broken offer.
 */
export async function ReferralWelcomeBanner({
  code,
  from,
}: {
  code?: string;
  from?: string;
}) {
  const normalized = normalizeCode(code);
  if (!normalized) return null;

  const db = getDb();
  if (!db) return null;

  const referrer = await db.member
    .findUnique({
      where: { referralCode: normalized },
      select: { firstName: true },
    })
    .catch(() => null);
  if (!referrer) return null;

  const settings = await getClubSettingsSafe(db);
  const credit = formatCents(settings.referralFriendCents);
  const name = (from || referrer.firstName || "").trim();

  return (
    <div className="flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-5">
      <PartyPopper
        className="mt-0.5 h-5 w-5 shrink-0 text-emerald-300"
        aria-hidden
      />
      <div className="min-w-0 text-sm leading-relaxed">
        <p className="font-semibold text-emerald-100">
          {name ? `${name} sent you ${credit} off.` : `You've got ${credit} off.`}
        </p>
        <p className="mt-1 text-emerald-100/80">
          Send this request and we&apos;ll take {credit} off your first service.
          Nothing to enter, the credit is already attached to your quote.
        </p>
      </div>
    </div>
  );
}

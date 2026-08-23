import type { PrismaClient, Referral, ReferralStatus } from "@prisma/client";
import { generateReferralCode, formatCents } from "./loyalty";
import { getClubSettings, type ClubSettings } from "./club-settings";
import { siteConfig } from "./site";

/**
 * THE PRESTIGE CLUB REFERRAL ENGINE — one place for every rule.
 *
 * Funnel: INVITED → BOOKED → COMPLETED → AWARDED (or REJECTED).
 *
 *   INVITED    the referrer shared a link or emailed an invite
 *   BOOKED     the friend submitted a request carrying the code
 *   COMPLETED  the friend's first service is done and PAID
 *   AWARDED    the referrer's points are in the ledger
 *
 * Three rules the rest of the codebase depends on:
 *
 *  1. Nothing pays out before money is in the door. The referrer's reward
 *     posts only after the friend's first service is COMPLETED and PAID
 *     (settings.referralRequirePaid, on by default).
 *  2. Rewards are snapshot on the Referral row at attribution time, so a
 *     later settings change never re-prices a promise already made.
 *  3. Points come from the append-only PointsTransaction ledger, same as
 *     every other Prestige Club award. There is no separate balance.
 */

/** Attribution cookie dropped by /r/[code]. */
export const REF_COOKIE = "pvs_ref";

export type AttributionSource = "link" | "code" | "signup" | "invite" | "admin";

// ---- Codes -----------------------------------------------------------------

/** Normalize anything a human might paste or type into a comparable code. */
export function normalizeCode(raw: string | null | undefined): string {
  return (raw ?? "")
    .trim()
    .toUpperCase()
    .replace(/^.*\/R\//, "") // tolerate a pasted full link
    .replace(/[^A-Z0-9-]/g, "")
    .slice(0, 24);
}

/**
 * The member's shareable code, generated on first need and persisted.
 * Safe to call on every page load — it is a no-op once a code exists.
 */
export async function ensureReferralCode(
  db: PrismaClient,
  member: { id: string; firstName: string; referralCode: string | null }
): Promise<string | null> {
  if (member.referralCode) return member.referralCode;
  for (let attempt = 0; attempt < 6; attempt++) {
    const candidate = generateReferralCode(member.firstName);
    try {
      await db.member.update({
        where: { id: member.id },
        data: { referralCode: candidate },
      });
      return candidate;
    } catch {
      // Unique collision, try another suffix.
    }
  }
  return null;
}

/** The public link a member shares. */
export function referralUrl(code: string): string {
  return `${siteConfig.url}/r/${code}`;
}

/** Per-referral tracking code, derived from the referrer's share code. */
function trackingCode(shareCode: string): string {
  const suffix = Array.from({ length: 6 }, () =>
    "ABCDEFGHJKMNPQRSTUVWXYZ23456789".charAt(Math.floor(Math.random() * 31))
  ).join("");
  return `${shareCode}-${suffix}`;
}

// ---- Eligibility -----------------------------------------------------------

export type IneligibleReason =
  | "unknown-code"
  | "self-referral"
  | "already-referred"
  | "existing-customer";

export const INELIGIBLE_COPY: Record<IneligibleReason, string> = {
  "unknown-code": "That referral code isn't active.",
  "self-referral": "You can't refer yourself.",
  "already-referred": "This person has already been referred.",
  "existing-customer":
    "This person is already a PVS customer, so the referral bonus doesn't apply.",
};

/**
 * Every fraud guard, in one place:
 *  - the code must resolve to a real member
 *  - nobody refers themselves (email or phone match)
 *  - one referral per referred person, ever
 *  - the friend must be genuinely new: no paid service history under that
 *    email, on either the club side or the ops side
 */
export async function checkEligibility(
  db: PrismaClient,
  opts: {
    referrer: { id: string; email: string; phone: string | null };
    friendEmail: string;
    friendPhone?: string | null;
  }
): Promise<{ ok: true } | { ok: false; reason: IneligibleReason }> {
  const email = opts.friendEmail.trim().toLowerCase();
  const referrerEmail = opts.referrer.email.trim().toLowerCase();

  if (!email || email === referrerEmail) {
    return { ok: false, reason: "self-referral" };
  }
  const friendDigits = digits(opts.friendPhone);
  const referrerDigits = digits(opts.referrer.phone);
  if (friendDigits && friendDigits === referrerDigits) {
    return { ok: false, reason: "self-referral" };
  }

  const priorReferral = await db.referral.findFirst({
    where: { referredEmail: email, status: { not: "REJECTED" } },
    select: { id: true },
  });
  if (priorReferral) return { ok: false, reason: "already-referred" };

  // Already one of ours? A member with paid history, or a customer already in
  // the ops pipeline, is not a new referral.
  const existingMember = await db.member.findUnique({
    where: { email },
    select: { id: true },
  });
  if (existingMember) {
    const paid = await db.serviceRecord.findFirst({
      where: { memberId: existingMember.id, paid: true },
      select: { id: true },
    });
    if (paid) return { ok: false, reason: "existing-customer" };
  }
  const existingCustomer = await db.customer.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: { id: true },
  });
  if (existingCustomer) return { ok: false, reason: "existing-customer" };

  return { ok: true };
}

function digits(value: string | null | undefined): string {
  const d = (value ?? "").replace(/\D/g, "");
  return d.length >= 10 ? d.slice(-10) : "";
}

/** Rewarded referrals for this member inside the rolling cap window. */
export async function awardedInPastYear(
  db: PrismaClient,
  referrerId: string
): Promise<number> {
  return db.referral.count({
    where: {
      referrerId,
      status: "AWARDED",
      awardedAt: { gte: new Date(Date.now() - 365 * 24 * 3600 * 1000) },
    },
  });
}

// ---- Attribution -----------------------------------------------------------

export type AttributionResult =
  | { ok: true; referral: Referral; upgraded: boolean }
  | { ok: false; reason: IneligibleReason };

/**
 * THE single entry point for "someone came in through a referral".
 *
 * Called from lead intake, account sign-up, and the invite form. Creates the
 * Referral (or advances an existing INVITED row for the same friend), snapshots
 * the reward, and applies every eligibility guard.
 *
 * Never throws — a referral problem must never block an intake.
 */
export async function attributeReferral(
  db: PrismaClient,
  opts: {
    code: string;
    friendEmail: string;
    friendName?: string | null;
    friendPhone?: string | null;
    friendMemberId?: string | null;
    leadId?: string | null;
    source: AttributionSource;
    /** "invite" stays at INVITED; everything else means they acted. */
    status?: Extract<ReferralStatus, "INVITED" | "BOOKED">;
    settings?: ClubSettings;
  }
): Promise<AttributionResult> {
  const code = normalizeCode(opts.code);
  const email = opts.friendEmail.trim().toLowerCase();
  const status = opts.status ?? "BOOKED";

  const referrer = await db.member.findUnique({
    where: { referralCode: code },
    select: { id: true, email: true, phone: true },
  });
  if (!referrer) return { ok: false, reason: "unknown-code" };

  // An invite this referrer already sent to this friend gets upgraded rather
  // than duplicated — the friend clicking through later is the same referral.
  const pendingInvite = await db.referral.findFirst({
    where: {
      referrerId: referrer.id,
      referredEmail: email,
      status: "INVITED",
    },
  });

  if (!pendingInvite) {
    const eligible = await checkEligibility(db, {
      referrer,
      friendEmail: email,
      friendPhone: opts.friendPhone,
    });
    if (!eligible.ok) return eligible;
  }

  const settings = opts.settings ?? (await getClubSettings(db));

  if (pendingInvite) {
    const referral = await db.referral.update({
      where: { id: pendingInvite.id },
      data: {
        status,
        source: opts.source,
        referredName: opts.friendName || pendingInvite.referredName,
        referredPhone: opts.friendPhone || pendingInvite.referredPhone,
        referredMemberId:
          opts.friendMemberId ?? pendingInvite.referredMemberId ?? null,
        leadId: opts.leadId ?? pendingInvite.leadId,
        bookedAt:
          status === "BOOKED" ? (pendingInvite.bookedAt ?? new Date()) : null,
      },
    });
    return { ok: true, referral, upgraded: true };
  }

  const referral = await db.referral.create({
    data: {
      code: trackingCode(code),
      referrerId: referrer.id,
      referredEmail: email,
      referredName: opts.friendName || null,
      referredPhone: opts.friendPhone || null,
      referredMemberId: opts.friendMemberId ?? null,
      leadId: opts.leadId ?? null,
      source: opts.source,
      status,
      rewardPoints: settings.pointsReferral,
      friendCreditCents: settings.referralFriendCents,
      bookedAt: status === "BOOKED" ? new Date() : null,
    },
  });
  return { ok: true, referral, upgraded: false };
}

/** attributeReferral that swallows everything. For best-effort intake paths. */
export async function tryAttributeReferral(
  db: PrismaClient,
  opts: Parameters<typeof attributeReferral>[1]
): Promise<AttributionResult | null> {
  try {
    return await attributeReferral(db, opts);
  } catch {
    return null;
  }
}

/**
 * Link a friend's brand-new account to the referral we already recorded from
 * their quote request, so the portal can show them their welcome credit.
 */
export async function linkReferredMember(
  db: PrismaClient,
  opts: { memberId: string; email: string }
): Promise<void> {
  try {
    const email = opts.email.trim().toLowerCase();
    const referral = await db.referral.findFirst({
      where: {
        referredEmail: email,
        referredMemberId: null,
        status: { not: "REJECTED" },
      },
      select: { id: true },
    });
    if (!referral) return;
    await db.referral.update({
      where: { id: referral.id },
      data: { referredMemberId: opts.memberId },
    });
  } catch {
    // Cosmetic linkage only — never block sign-up.
  }
}

// ---- Completion + award ----------------------------------------------------

/**
 * Called after a member's paid service record syncs. If that member was
 * referred and this is their first paid visit, the referral becomes
 * COMPLETED, and pays out immediately when auto-award is on.
 *
 * Idempotent: a referral already past BOOKED is left alone.
 */
export async function maybeCompleteReferralForMember(
  db: PrismaClient,
  memberId: string,
  settings?: ClubSettings
): Promise<"completed" | "awarded" | null> {
  try {
    const member = await db.member.findUnique({
      where: { id: memberId },
      select: { id: true, email: true },
    });
    if (!member) return null;

    const referral = await db.referral.findFirst({
      where: {
        status: { in: ["INVITED", "BOOKED"] },
        OR: [
          { referredMemberId: member.id },
          { referredEmail: member.email.toLowerCase() },
        ],
      },
    });
    if (!referral) return null;

    const cfg = settings ?? (await getClubSettings(db));

    if (cfg.referralRequirePaid === 1) {
      const paid = await db.serviceRecord.findFirst({
        where: { memberId: member.id, paid: true },
        select: { id: true },
      });
      if (!paid) return null;
    }

    const completed = await db.referral.update({
      where: { id: referral.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        referredMemberId: referral.referredMemberId ?? member.id,
      },
    });

    if (cfg.referralAutoAward !== 1) return "completed";

    // Past the yearly cap, the referral waits for the owner in Approvals.
    if (cfg.referralMaxPerYear > 0) {
      const already = await awardedInPastYear(db, completed.referrerId);
      if (already >= cfg.referralMaxPerYear) {
        await db.referral.update({
          where: { id: completed.id },
          data: {
            note: `Held for review: referrer is at the ${cfg.referralMaxPerYear}/year cap.`,
          },
        });
        return "completed";
      }
    }

    const awarded = await awardReferral(db, completed.id, cfg);
    return awarded ? "awarded" : "completed";
  } catch {
    return null;
  }
}

/**
 * Post the referrer's reward and close the referral. Pays the SNAPSHOT amount
 * from the row, falling back to current settings for pre-snapshot rows.
 *
 * Idempotent — only a COMPLETED referral pays out, and the status flip happens
 * in the same transaction as the ledger entry.
 */
export async function awardReferral(
  db: PrismaClient,
  referralId: string,
  settings?: ClubSettings
): Promise<boolean> {
  const referral = await db.referral.findUnique({
    where: { id: referralId },
    include: { referrer: { include: { profile: true } } },
  });
  if (!referral || referral.status !== "COMPLETED") return false;

  const cfg = settings ?? (await getClubSettings(db));
  const points = referral.rewardPoints ?? cfg.pointsReferral;

  await db.$transaction([
    ...(points > 0
      ? [
          db.pointsTransaction.create({
            data: {
              memberId: referral.referrerId,
              type: "EARN_REFERRAL" as const,
              amount: points,
              sourceRef: referral.id,
              note: referral.referredName
                ? `Referral reward: ${referral.referredName} completed their first service`
                : "Referral completed their first service, thank you!",
            },
          }),
        ]
      : []),
    db.referral.update({
      where: { id: referral.id },
      data: { status: "AWARDED", awardedAt: new Date() },
    }),
  ]);

  // Tell the referrer. Best-effort: the ledger entry is what counts.
  try {
    if (referral.referrer.profile?.notifyPromos !== false) {
      const { sendClubEmail } = await import("./send-club-email");
      const value = formatCents(points * cfg.centsPerPoint);
      await sendClubEmail({
        to: referral.referrer.email,
        subject: `+${points} points — your referral came through!`,
        text: [
          `Hi ${referral.referrer.firstName},`,
          ``,
          `${referral.referredName || "Your friend"} just finished their first service with us, so ${points} points (${value} toward your next service) have landed in your Prestige Club account.`,
          ``,
          `Thanks for putting your name behind our work. Your referral link is always live if you know anyone else who could use a hand:`,
          `${siteConfig.url}/account/referrals`,
          ``,
          `Prestige View Services · ${siteConfig.phoneDisplay}`,
        ].join("\n"),
      });
    }
  } catch {
    // Email is never allowed to fail an award.
  }
  return true;
}

/** Close a referral we won't pay out, with the reason on the record. */
export async function rejectReferral(
  db: PrismaClient,
  referralId: string,
  note: string
): Promise<void> {
  await db.referral.updateMany({
    where: { id: referralId, status: { notIn: ["AWARDED", "REJECTED"] } },
    data: { status: "REJECTED", note },
  });
}

// ---- Member-facing stats ---------------------------------------------------

export type ReferralStats = {
  code: string | null;
  url: string | null;
  total: number;
  invited: number;
  booked: number;
  completed: number;
  awarded: number;
  /** Points already banked from referrals. */
  earnedPoints: number;
  /** Dollar value of those points at the current rate. */
  earnedCents: number;
  /** Points promised by referrals still in flight. */
  pendingPoints: number;
  pendingCents: number;
};

export async function referralStats(
  db: PrismaClient,
  memberId: string,
  settings: ClubSettings,
  code: string | null
): Promise<ReferralStats> {
  const referrals = await db.referral.findMany({
    where: { referrerId: memberId },
    select: { status: true, rewardPoints: true },
  });

  const count = (s: ReferralStatus) =>
    referrals.filter((r) => r.status === s).length;

  const pointsFor = (r: { rewardPoints: number | null }) =>
    r.rewardPoints ?? settings.pointsReferral;

  const earnedPoints = referrals
    .filter((r) => r.status === "AWARDED")
    .reduce((sum, r) => sum + pointsFor(r), 0);
  const pendingPoints = referrals
    .filter((r) => r.status === "BOOKED" || r.status === "COMPLETED")
    .reduce((sum, r) => sum + pointsFor(r), 0);

  return {
    code,
    url: code ? referralUrl(code) : null,
    total: referrals.filter((r) => r.status !== "REJECTED").length,
    invited: count("INVITED"),
    booked: count("BOOKED"),
    completed: count("COMPLETED"),
    awarded: count("AWARDED"),
    earnedPoints,
    earnedCents: earnedPoints * settings.centsPerPoint,
    pendingPoints,
    pendingCents: pendingPoints * settings.centsPerPoint,
  };
}

/** Status chip copy + colour, shared by the portal and the admin views. */
export const REFERRAL_STATUS_META: Record<
  ReferralStatus,
  { label: string; memberLabel: string; cls: string }
> = {
  INVITED: {
    label: "Invited",
    memberLabel: "Invite sent",
    cls: "bg-slate-500/15 text-slate-200 border-slate-500/25",
  },
  BOOKED: {
    label: "Booked",
    memberLabel: "They requested a quote",
    cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  },
  COMPLETED: {
    label: "Ready to award",
    memberLabel: "First service done, reward on the way",
    cls: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  },
  AWARDED: {
    label: "Awarded",
    memberLabel: "Reward paid",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
  REJECTED: {
    label: "Not eligible",
    memberLabel: "Not eligible",
    cls: "bg-rose-500/15 text-rose-200 border-rose-500/25",
  },
};

/**
 * What the MEMBER sees for a referral. Status alone isn't enough: an INVITED
 * row means "invite sent" when it came from the invite form, but "they made an
 * account" when it came from a sign-up.
 */
export function referralStageLabel(
  status: ReferralStatus,
  source: string
): string {
  if (status === "INVITED" && source === "signup") {
    return "They created an account";
  }
  if (status === "INVITED" && source !== "invite") {
    return "Clicked your link";
  }
  return REFERRAL_STATUS_META[status].memberLabel;
}

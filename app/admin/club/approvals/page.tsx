import Link from "next/link";
import { revalidatePath } from "next/cache";
import {
  ArrowLeft,
  BadgeCheck,
  Gift,
  MessageSquareHeart,
  Users,
} from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendClubEmail } from "@/lib/send-club-email";
import { POINTS, formatCents, formatPoints } from "@/lib/loyalty";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;

const PORTAL_URL = () =>
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca";

/**
 * Approvals hub: redemption requests, review-bonus claims, and referral
 * completions. Every award is an append-only ledger entry; nothing here
 * ever edits history.
 */
export default async function ApprovalsPage() {
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const [redemptions, reviewClaims, referrals] = await Promise.all([
    db.redemption.findMany({
      where: { status: { in: ["REQUESTED", "APPROVED"] } },
      include: { member: true },
      orderBy: { createdAt: "asc" },
    }),
    db.reviewClaim.findMany({
      where: { status: "PENDING" },
      include: { member: true },
      orderBy: { createdAt: "asc" },
    }),
    db.referral.findMany({
      where: { status: { in: ["BOOKED", "COMPLETED"] } },
      include: { referrer: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  return (
    <div className="space-y-8">
      <Link
        href="/admin/club"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Club home
      </Link>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Approvals</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Redemptions, review bonuses, and referral awards. Points post as
          ledger entries the moment you approve.
        </p>
      </header>

      {/* ---- Redemptions ---- */}
      <section>
        <div className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Redemption requests ({redemptions.length})
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Approving deducts the points immediately. Apply the credit to the
          member&apos;s next Jobber invoice, remember: combined promo
          discounts cap at 20% per invoice (the veteran discount is exempt
          and always stacks).
        </p>
        <div className="mt-3 space-y-3">
          {redemptions.length === 0 && (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              No pending redemptions.
            </p>
          )}
          {redemptions.map((r) => (
            <div key={r.id} className="surface-card p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">
                    {formatCents(r.creditCents)} credit ·{" "}
                    {formatPoints(r.points)} pts
                  </p>
                  <p className="text-xs text-muted-foreground">
                    <Link
                      href={`/admin/club/members/${r.memberId}`}
                      className="font-medium text-primary hover:underline"
                    >
                      {r.member.firstName} {r.member.lastName ?? ""}
                    </Link>{" "}
                    · {r.member.email} · requested{" "}
                    {r.createdAt.toLocaleDateString("en-CA")}
                  </p>
                </div>
                {r.status === "REQUESTED" ? (
                  <div className="flex gap-2">
                    <form action={approveRedemption}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" size="sm">
                        Approve
                      </Button>
                    </form>
                    <form action={declineRedemption}>
                      <input type="hidden" name="id" value={r.id} />
                      <Button type="submit" size="sm" variant="outline">
                        Decline
                      </Button>
                    </form>
                  </div>
                ) : (
                  <form action={markApplied} className="flex items-center gap-2">
                    <input type="hidden" name="id" value={r.id} />
                    <input
                      name="invoiceRef"
                      required
                      placeholder="Invoice #"
                      className="h-9 w-32 rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                    />
                    <Button type="submit" size="sm" variant="outline">
                      Mark applied
                    </Button>
                  </form>
                )}
              </div>
              {r.status === "APPROVED" && (
                <p className="mt-2 text-xs font-medium text-amber-200">
                  Approved, points deducted. Waiting to be applied to an
                  invoice.
                </p>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ---- Review claims ---- */}
      <section>
        <div className="flex items-center gap-2">
          <MessageSquareHeart className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Review bonus claims ({reviewClaims.length})
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          Check Google for the member&apos;s review, then approve the
          one-time +{POINTS.REVIEW}.{" "}
          <a
            href="https://business.google.com/reviews"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            Open Google reviews
          </a>
        </p>
        <div className="mt-3 space-y-3">
          {reviewClaims.length === 0 && (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              No pending claims.
            </p>
          )}
          {reviewClaims.map((c) => (
            <div
              key={c.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <p className="text-sm">
                <Link
                  href={`/admin/club/members/${c.memberId}`}
                  className="font-semibold text-primary hover:underline"
                >
                  {c.member.firstName} {c.member.lastName ?? ""}
                </Link>{" "}
                <span className="text-muted-foreground">
                  · {c.member.email} · claimed{" "}
                  {c.createdAt.toLocaleDateString("en-CA")}
                </span>
              </p>
              <div className="flex gap-2">
                <form action={approveReview}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" size="sm">
                    <BadgeCheck className="h-4 w-4" />
                    Verified, award {POINTS.REVIEW}
                  </Button>
                </form>
                <form action={rejectReview}>
                  <input type="hidden" name="id" value={c.id} />
                  <Button type="submit" size="sm" variant="outline">
                    Reject
                  </Button>
                </form>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Referrals ---- */}
      <section>
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">
            Referrals ({referrals.length})
          </h2>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          BOOKED = the friend submitted a quote through a referral link
          (their $25-off applies to their first invoice). Mark completed once
          their first service is done and paid, then award the{" "}
          {POINTS.REFERRAL} points.
        </p>
        <div className="mt-3 space-y-3">
          {referrals.length === 0 && (
            <p className="surface-card p-5 text-sm text-muted-foreground">
              No referrals in flight.
            </p>
          )}
          {referrals.map((r) => (
            <div
              key={r.id}
              className="surface-card flex flex-wrap items-center justify-between gap-3 p-5"
            >
              <div className="min-w-0 text-sm">
                <p className="font-semibold">{r.referredEmail ?? "Unknown friend"}</p>
                <p className="text-xs text-muted-foreground">
                  referred by{" "}
                  <Link
                    href={`/admin/club/members/${r.referrerId}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {r.referrer.firstName} {r.referrer.lastName ?? ""}
                  </Link>{" "}
                  · {r.status === "BOOKED" ? "booked" : "first service done"} ·{" "}
                  {r.createdAt.toLocaleDateString("en-CA")}
                </p>
              </div>
              {r.status === "BOOKED" ? (
                <form action={markReferralCompleted}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" size="sm" variant="outline">
                    First service done + paid
                  </Button>
                </form>
              ) : (
                <form action={awardReferral}>
                  <input type="hidden" name="id" value={r.id} />
                  <Button type="submit" size="sm">
                    Award {POINTS.REFERRAL} pts
                  </Button>
                </form>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function approveRedemption(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const redemption = await db.redemption.findUnique({
    where: { id },
    include: { member: { include: { profile: true } } },
  });
  if (!redemption || redemption.status !== "REQUESTED") return;

  // Points deduct HERE, at approval — one atomic transaction.
  await db.$transaction([
    db.pointsTransaction.create({
      data: {
        memberId: redemption.memberId,
        type: "REDEEM",
        amount: -redemption.points,
        sourceRef: redemption.id,
        note: `Redeemed for ${formatCents(redemption.creditCents)} service credit`,
      },
    }),
    db.redemption.update({ where: { id }, data: { status: "APPROVED" } }),
  ]);

  if (redemption.member.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: redemption.member.email,
      subject: `Your ${formatCents(redemption.creditCents)} PVS credit is approved`,
      text: [
        `Hi ${redemption.member.firstName},`,
        ``,
        `Your ${formatCents(redemption.creditCents)} service credit is approved and will be applied to your next invoice. Quality you can see, rewards you can feel.`,
        ``,
        `Track it: ${PORTAL_URL()}/account/rewards`,
        ``,
        `Prestige View Services · ${siteConfig.phoneDisplay}`,
      ].join("\n"),
    });
  }
  revalidatePath("/admin/club/approvals");
  revalidatePath("/admin/club");
}

async function declineRedemption(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const redemption = await db.redemption.findUnique({
    where: { id },
    include: { member: { include: { profile: true } } },
  });
  if (!redemption || redemption.status !== "REQUESTED") return;

  await db.redemption.update({ where: { id }, data: { status: "DECLINED" } });
  if (redemption.member.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: redemption.member.email,
      subject: `About your PVS credit request`,
      text: [
        `Hi ${redemption.member.firstName},`,
        ``,
        `We couldn't approve your ${formatCents(redemption.creditCents)} credit request this time — give us a call at ${siteConfig.phoneDisplay} and we'll sort it out. Your points are untouched.`,
        ``,
        `Prestige View Services`,
      ].join("\n"),
    });
  }
  revalidatePath("/admin/club/approvals");
}

async function markApplied(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const invoiceRef = String(formData.get("invoiceRef") ?? "").trim().slice(0, 60);
  if (!id || !invoiceRef) return;
  const redemption = await db.redemption.findUnique({ where: { id } });
  if (!redemption || redemption.status !== "APPROVED") return;
  await db.redemption.update({
    where: { id },
    data: { status: "APPLIED", appliedInvoiceRef: invoiceRef },
  });
  revalidatePath("/admin/club/approvals");
}

async function approveReview(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const claim = await db.reviewClaim.findUnique({
    where: { id },
    include: { member: { include: { profile: true } } },
  });
  if (!claim || claim.status !== "PENDING") return;

  // One-time bonus guard even if two claims somehow exist.
  const prior = await db.pointsTransaction.findFirst({
    where: { memberId: claim.memberId, type: "EARN_REVIEW" },
  });
  await db.$transaction([
    ...(prior
      ? []
      : [
          db.pointsTransaction.create({
            data: {
              memberId: claim.memberId,
              type: "EARN_REVIEW",
              amount: POINTS.REVIEW,
              sourceRef: claim.id,
              note: "Verified Google review, thank you!",
            },
          }),
        ]),
    db.reviewClaim.update({ where: { id }, data: { status: "AWARDED" } }),
  ]);

  if (!prior && claim.member.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: claim.member.email,
      subject: `+${POINTS.REVIEW} points for your review — thank you!`,
      text: [
        `Hi ${claim.member.firstName},`,
        ``,
        `Your Google review is verified and ${POINTS.REVIEW} points just landed in your Prestige Club account. Reviews keep a local crew rolling — thank you!`,
        ``,
        `Your points: ${PORTAL_URL()}/account/rewards`,
        ``,
        `Prestige View Services · ${siteConfig.phoneDisplay}`,
      ].join("\n"),
    });
  }
  revalidatePath("/admin/club/approvals");
}

async function rejectReview(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  await db.reviewClaim
    .update({ where: { id }, data: { status: "REJECTED" } })
    .catch(() => {});
  revalidatePath("/admin/club/approvals");
}

async function markReferralCompleted(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const referral = await db.referral.findUnique({ where: { id } });
  if (!referral || referral.status !== "BOOKED") return;
  await db.referral.update({ where: { id }, data: { status: "COMPLETED" } });
  revalidatePath("/admin/club/approvals");
}

async function awardReferral(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");
  const id = String(formData.get("id") ?? "");
  const referral = await db.referral.findUnique({
    where: { id },
    include: { referrer: { include: { profile: true } } },
  });
  if (!referral || referral.status !== "COMPLETED") return;

  await db.$transaction([
    db.pointsTransaction.create({
      data: {
        memberId: referral.referrerId,
        type: "EARN_REFERRAL",
        amount: POINTS.REFERRAL,
        sourceRef: referral.id,
        note: "Referral completed their first service, thank you!",
      },
    }),
    db.referral.update({ where: { id }, data: { status: "AWARDED" } }),
  ]);

  if (referral.referrer.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: referral.referrer.email,
      subject: `+${POINTS.REFERRAL} points — your referral came through!`,
      text: [
        `Hi ${referral.referrer.firstName},`,
        ``,
        `Your friend finished their first PVS service, so ${POINTS.REFERRAL} points just hit your Prestige Club account. Know anyone else who could use a hand? Your link's always live.`,
        ``,
        `Your referrals: ${PORTAL_URL()}/account/referrals`,
        ``,
        `Prestige View Services · ${siteConfig.phoneDisplay}`,
      ].join("\n"),
    });
  }
  revalidatePath("/admin/club/approvals");
  revalidatePath("/admin/club");
}

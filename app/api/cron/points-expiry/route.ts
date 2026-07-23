import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import {
  EXPIRY_MONTHS,
  formatPoints,
  pointsBalance,
} from "@/lib/loyalty";
import { sendClubEmail } from "@/lib/send-club-email";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Points expiry cron (monthly, vercel.json).
 *
 * Policy: points expire after 24 months of account inactivity (no paid
 * service). Anchor = last paid service, or account creation if the member
 * has never had one.
 *
 *  - Inside the final 60 days → warning email ("book any service to reset
 *    the clock"). Runs monthly, so a member gets at most two reminders.
 *  - Past the deadline → post a single EXPIRE ledger entry for the full
 *    balance (append-only; history stays intact) + a goodbye-points email.
 */
export async function GET(req: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, reason: "DB not configured" });

  const now = Date.now();
  const members = await db.member.findMany({
    include: { profile: true },
  });

  let expired = 0;
  let warned = 0;

  for (const m of members) {
    const balance = await pointsBalance(db, m.id);
    if (balance <= 0) continue;

    const lastPaid = await db.serviceRecord.findFirst({
      where: { memberId: m.id, paid: true },
      orderBy: { paidAt: "desc" },
      select: { paidAt: true },
    });
    const anchor = lastPaid?.paidAt ?? m.createdAt;
    const expiresAt = new Date(anchor);
    expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);

    if (expiresAt.getTime() <= now) {
      // Expire the full balance in one append-only entry.
      await db.pointsTransaction.create({
        data: {
          memberId: m.id,
          type: "EXPIRE",
          amount: -balance,
          note: `Points expired after ${EXPIRY_MONTHS} months of inactivity`,
        },
      });
      expired++;
      if (m.profile?.notifyServiceReminders !== false) {
        await sendClubEmail({
          to: m.email,
          subject: "Your Prestige Club points have expired",
          text: [
            `Hi ${m.firstName},`,
            ``,
            `It's been ${EXPIRY_MONTHS} months since your last service, so ${formatPoints(balance)} points have expired per the program rules.`,
            `The good news: your account is still active, and your next visit starts earning again from day one.`,
            ``,
            `Book anytime: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/account/requests?new=1`,
            ``,
            `Prestige View Services · ${siteConfig.phoneDisplay}`,
          ].join("\n"),
        });
      }
    } else if (expiresAt.getTime() - now < 60 * DAY_MS) {
      warned++;
      if (m.profile?.notifyServiceReminders !== false) {
        await sendClubEmail({
          to: m.email,
          subject: `Heads up: ${formatPoints(balance)} points expire ${expiresAt.toLocaleDateString("en-CA", { month: "long", year: "numeric" })}`,
          text: [
            `Hi ${m.firstName},`,
            ``,
            `Your ${formatPoints(balance)} Prestige Club points are set to expire around ${expiresAt.toLocaleDateString("en-CA", { month: "long", day: "numeric", year: "numeric" })} — points lapse after ${EXPIRY_MONTHS} months without a paid service.`,
            `Any completed visit resets the clock completely. Leave the hard work to us:`,
            ``,
            `${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/account/requests?new=1`,
            ``,
            `Prestige View Services · ${siteConfig.phoneDisplay}`,
          ].join("\n"),
        });
      }
    }
  }

  return NextResponse.json({ ok: true, checked: members.length, expired, warned });
}

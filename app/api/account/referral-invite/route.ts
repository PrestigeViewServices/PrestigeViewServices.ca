import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { getMember } from "@/lib/customer-auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { getClubSettings } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";
import {
  INELIGIBLE_COPY,
  attributeReferral,
  ensureReferralCode,
  referralUrl,
} from "@/lib/referrals";
import { sendClubEmail } from "@/lib/send-club-email";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * POST — a signed-in member invites a friend by email.
 *
 * The referral is recorded at INVITED whether or not the email actually goes
 * out (Resend may not be configured), so the member always has an honest list
 * of who they've reached out to and the attribution still works when the
 * friend uses the link.
 */
export async function POST(req: Request) {
  const member = await getMember();
  if (!member) {
    return NextResponse.json({ error: "Please sign in." }, { status: 401 });
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Invites are temporarily unavailable." },
      { status: 503 }
    );
  }

  // Two guards: per-account and per-IP. An invite sends mail on our domain.
  const perMember = await rateLimit("referral-invite", member.id, 20, 86_400);
  if (!perMember.ok) return tooMany();
  const perIp = await rateLimit("referral-invite-ip", clientIp(req), 40, 86_400);
  if (!perIp.ok) return tooMany();

  const body = (await req.json().catch(() => null)) as {
    name?: string;
    email?: string;
  } | null;

  const friendName = (body?.name ?? "").trim().slice(0, 60);
  const friendEmail = (body?.email ?? "").trim().toLowerCase();

  if (!EMAIL_RE.test(friendEmail)) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 }
    );
  }

  const code = await ensureReferralCode(db, member);
  if (!code) {
    return NextResponse.json(
      { error: "Couldn't generate your referral code, please try again." },
      { status: 500 }
    );
  }

  const settings = await getClubSettings(db);
  const result = await attributeReferral(db, {
    code,
    friendEmail,
    friendName: friendName || null,
    source: "invite",
    status: "INVITED",
    settings,
  });

  if (!result.ok) {
    return NextResponse.json(
      { error: INELIGIBLE_COPY[result.reason] },
      { status: 409 }
    );
  }

  const url = referralUrl(code);
  const credit = formatCents(
    result.referral.friendCreditCents ?? settings.referralFriendCents
  );

  const { sent } = await sendClubEmail({
    to: friendEmail,
    replyTo: member.email,
    subject: `${member.firstName} thinks you'd like Prestige View Services`,
    text: [
      friendName ? `Hi ${friendName},` : `Hi,`,
      ``,
      `${member.firstName} ${member.lastName ?? ""}`.trim() +
        ` has us looking after their property and passed your name along.`,
      ``,
      `We're Prestige View Services, a local crew handling windows, gutters, pressure washing, lawn care, and snow removal across ${siteConfig.serviceArea}.`,
      ``,
      `Because ${member.firstName} sent you, your first service is ${credit} off. Grab a free quote here:`,
      url,
      ``,
      `No obligation, and we answer within one business day.`,
      ``,
      `Prestige View Services · ${siteConfig.phoneDisplay}`,
      siteConfig.url,
      ``,
      `Don't want to hear from us? Just ignore this, it's a one-time note from ${member.firstName}, not a mailing list.`,
    ].join("\n"),
  });

  return NextResponse.json({ ok: true, emailed: sent });
}

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import {
  MEMBER_COOKIE,
  MEMBER_SESSION_MAX_AGE_SECONDS,
  createMemberToken,
  hashPassword,
  isCustomerAuthConfigured,
} from "@/lib/customer-auth";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import {
  REF_COOKIE,
  ensureReferralCode,
  linkReferredMember,
  normalizeCode,
  tryAttributeReferral,
} from "@/lib/referrals";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** POST — create a Prestige Club account and sign the member in. */
export async function POST(req: Request) {
  if (!isCustomerAuthConfigured()) {
    return NextResponse.json(
      { error: "Account sign-up isn't configured yet. Please call us at 613-334-5858." },
      { status: 500 }
    );
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Accounts are temporarily unavailable. Please try again soon." },
      { status: 500 }
    );
  }

  const ip = clientIp(req);
  const limited = await rateLimit("register-ip", ip, 6, 3600);
  if (!limited.ok) return tooMany();

  const body = (await req.json().catch(() => null)) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    /** Prestige Club code from a friend, typed in or prefilled from /r/[code]. */
    referralCode?: string;
    hp?: string; // honeypot
  } | null;

  if (body?.hp) return NextResponse.json({ ok: true }); // silently drop bots

  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const phone = (body?.phone ?? "").trim();
  const password = (body?.password ?? "").slice(0, 200);

  if (!firstName) {
    return NextResponse.json({ error: "Please enter your first name." }, { status: 400 });
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const existing = await db.member.findUnique({ where: { email } });
  if (existing) {
    // NEVER let sign-up take over an existing row — claimed or not.
    //
    // A pre-provisioned (Jobber-imported) account carries a real customer's
    // service history, points, addresses and profile, and is marked
    // unclaimed by an empty passwordHash. Claiming it must prove control of
    // the mailbox, which is what the emailed /claim/<inviteToken> link is
    // for. Letting sign-up claim it on the strength of a KNOWN EMAIL handed
    // that customer's records to anyone who could guess their address.
    //
    // Both cases answer identically so sign-up cannot be used to tell a
    // claimed account from an unclaimed one.
    if (existing.passwordHash === "" && existing.inviteToken) {
      // Real customers land here too, so make it recoverable: tell the owner
      // to send this person their claim link. Best-effort, never blocking.
      const { notifyOwner } = await import("@/lib/notify");
      const base =
        process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca";
      await notifyOwner({
        kind: "member",
        subject: `Send a Club claim link: ${email}`,
        text: [
          `${firstName} ${lastName}`.trim() ||
            `Someone using ${email}`,
          `tried to sign up for the Prestige Club, but that email already has`,
          `an unclaimed pre-provisioned account.`,
          ``,
          `If this is really them, send their claim link:`,
          `${base}/claim/${existing.inviteToken}`,
          ``,
          `Do NOT send it anywhere except the address on file — the link sets`,
          `the password on that account.`,
          ``,
          `Account: /admin/club/members/${existing.id}`,
        ].join("\n"),
        sms: `PVS: ${email} needs their Club claim link sent.`,
      }).catch(() => {});
    }
    return NextResponse.json(
      {
        error:
          "An account with this email already exists. Try signing in — or if you've never set a password, call us at 613-334-5858 and we'll send your setup link.",
      },
      { status: 409 }
    );
  }

  const passwordHash = await hashPassword(password);
  const member = await db.member.create({
    data: {
      email,
      passwordHash,
      firstName,
      lastName: lastName || null,
      phone: phone || null,
      profile: { create: {} },
    },
  });

  // Pre-existing Jobber history is claimed on the next scheduled sync
  // (email match) or via the admin "link account" tool.

  // Referral plumbing — all best-effort, none of it can block a sign-up.
  try {
    // Their own shareable code, ready the moment they land in the portal.
    await ensureReferralCode(db, {
      id: member.id,
      firstName: member.firstName,
      referralCode: member.referralCode,
    });

    // Did a friend send them? Typed code wins over the /r/[code] cookie.
    const store = await cookies();
    const code =
      normalizeCode(body?.referralCode) ||
      normalizeCode(store.get(REF_COOKIE)?.value);
    if (code) {
      await tryAttributeReferral(db, {
        code,
        friendEmail: email,
        friendName: `${firstName} ${lastName}`.trim(),
        friendPhone: phone || null,
        friendMemberId: member.id,
        source: "signup",
        // An account isn't a booking. It stays at INVITED until they
        // actually request service, and pays out on their first paid job.
        status: "INVITED",
      });
    }
    // A referral already recorded from their quote request now gets the
    // account attached, so their welcome credit shows up in the portal.
    await linkReferredMember(db, { memberId: member.id, email });
  } catch {
    // Never block account creation on referral bookkeeping.
  }

  // Welcome bonus (one-time, admin-tunable, 0 disables).
  try {
    const { getClubSettings } = await import("@/lib/club-settings");
    const { awardOnce } = await import("@/lib/loyalty");
    const settings = await getClubSettings(db);
    await awardOnce(db, {
      memberId: member.id,
      type: "EARN_WELCOME",
      amount: settings.pointsWelcome,
      note: "Welcome to The Prestige Club!",
    });
  } catch {
    // Bonus is best-effort — never block account creation.
  }

  // Owner alert, best-effort, never blocks sign-up.
  const { notifyOwner } = await import("@/lib/notify");
  await notifyOwner({
    kind: "member",
    subject: `New Prestige Club member: ${firstName} ${lastName}`.trim(),
    text: [
      `Name: ${firstName} ${lastName}`.trim(),
      `Email: ${email}`,
      phone ? `Phone: ${phone}` : null,
      `Brand new sign-up.`,
      ``,
      `Manage: /admin/club`,
    ]
      .filter(Boolean)
      .join("\n"),
    sms: `PVS new club member: ${firstName} ${lastName} · ${email}`.trim(),
    replyTo: email,
  });

  const token = await createMemberToken(member.id);
  const store = await cookies();
  store.set(MEMBER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MEMBER_SESSION_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true });
}

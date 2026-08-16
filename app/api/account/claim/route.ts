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

export const runtime = "nodejs";

/** POST { token, password } → claims a pre-provisioned account. */
export async function POST(req: Request) {
  if (!isCustomerAuthConfigured()) {
    return NextResponse.json({ error: "Unavailable" }, { status: 500 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ error: "Unavailable" }, { status: 500 });

  const ip = clientIp(req);
  const limited = await rateLimit("claim-ip", ip, 10, 3600);
  if (!limited.ok) return tooMany();

  const body = (await req.json().catch(() => null)) as {
    token?: string;
    password?: string;
  } | null;
  const token = (body?.token ?? "").trim().slice(0, 100);
  const password = (body?.password ?? "").slice(0, 200);

  if (!token) return NextResponse.json({ error: "Invalid link" }, { status: 400 });
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 }
    );
  }

  const member = await db.member.findUnique({ where: { inviteToken: token } });
  if (!member || member.passwordHash !== "") {
    return NextResponse.json(
      { error: "This invite link is no longer valid. Try signing in, or call us." },
      { status: 404 }
    );
  }

  await db.member.update({
    where: { id: member.id },
    data: { passwordHash: await hashPassword(password), inviteToken: null },
  });

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
    // Best-effort.
  }

  // Owner alert, best-effort, never blocks the claim.
  const { notifyOwner } = await import("@/lib/notify");
  await notifyOwner({
    kind: "member",
    subject: `Prestige Club account claimed: ${member.firstName} ${member.lastName ?? ""}`.trim(),
    text: [
      `Name: ${member.firstName} ${member.lastName ?? ""}`.trim(),
      `Email: ${member.email}`,
      member.phone ? `Phone: ${member.phone}` : null,
      `An invited member set their password and activated their account.`,
      ``,
      `Manage: /admin/club`,
    ]
      .filter(Boolean)
      .join("\n"),
    sms: `PVS account claimed: ${member.firstName} · ${member.email}`,
    replyTo: member.email,
  });

  const session = await createMemberToken(member.id);
  const store = await cookies();
  store.set(MEMBER_COOKIE, session, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MEMBER_SESSION_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true });
}

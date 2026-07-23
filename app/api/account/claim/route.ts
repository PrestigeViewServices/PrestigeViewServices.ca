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

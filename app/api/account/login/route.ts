import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getDb } from "@/lib/db";
import {
  MEMBER_COOKIE,
  MEMBER_SESSION_MAX_AGE_SECONDS,
  createMemberToken,
  isCustomerAuthConfigured,
  verifyPassword,
} from "@/lib/customer-auth";

export const runtime = "nodejs";

/** POST { email, password } → member session cookie. */
export async function POST(req: Request) {
  if (!isCustomerAuthConfigured()) {
    return NextResponse.json(
      { error: "Sign-in isn't configured yet. Please call us at 613-334-5858." },
      { status: 500 }
    );
  }
  const db = getDb();
  if (!db) {
    return NextResponse.json(
      { error: "Sign-in is temporarily unavailable. Please try again soon." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as {
    email?: string;
    password?: string;
  } | null;
  const email = (body?.email ?? "").trim().toLowerCase();
  const password = body?.password ?? "";

  const member = email
    ? await db.member.findUnique({ where: { email } })
    : null;
  const ok = member ? await verifyPassword(password, member.passwordHash) : false;

  if (!member || !ok) {
    // Fixed delay blunts credential-stuffing without hurting real sign-ins.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { error: "Wrong email or password." },
      { status: 401 }
    );
  }

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

/** DELETE → sign out. */
export async function DELETE() {
  const store = await cookies();
  store.set(MEMBER_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}

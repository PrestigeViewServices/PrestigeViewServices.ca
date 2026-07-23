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

  const body = (await req.json().catch(() => null)) as {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    password?: string;
    hp?: string; // honeypot
  } | null;

  if (body?.hp) return NextResponse.json({ ok: true }); // silently drop bots

  const firstName = (body?.firstName ?? "").trim();
  const lastName = (body?.lastName ?? "").trim();
  const email = (body?.email ?? "").trim().toLowerCase();
  const phone = (body?.phone ?? "").trim();
  const password = body?.password ?? "";

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
    return NextResponse.json(
      { error: "An account with this email already exists. Try signing in instead." },
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

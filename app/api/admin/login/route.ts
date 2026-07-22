import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  ADMIN_SESSION_MAX_AGE_SECONDS,
  checkAdminEmail,
  checkAdminPassword,
  createAdminToken,
  isAdminAuthConfigured,
} from "@/lib/admin-session";

export const runtime = "nodejs";

/** POST { email, password } → sets the signed admin session cookie. */
export async function POST(req: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin login isn't configured. Set ADMIN_PASSWORD." },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = body?.email ?? "";
  const password = body?.password ?? "";

  const ok = checkAdminEmail(email) && (await checkAdminPassword(password));
  if (!ok) {
    // Small fixed delay blunts brute-force loops without hurting real logins.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { error: "Wrong email or password." },
      { status: 401 }
    );
  }

  const token = await createAdminToken();
  const store = await cookies();
  store.set(ADMIN_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE_SECONDS,
  });
  return NextResponse.json({ ok: true });
}

/** DELETE → clears the session (logout). */
export async function DELETE() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}

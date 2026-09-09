import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  ADMIN_COOKIE,
  checkAdminLogin,
  isAdminAuthConfigured,
  setAdminSessionCookie,
} from "@/lib/admin-session";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** POST { email, password } → sets the signed admin session cookie. */
export async function POST(req: Request) {
  if (!isAdminAuthConfigured()) {
    return NextResponse.json(
      {
        error:
          "Admin sign-in isn't configured on this deployment. Set ADMIN_PASSWORD (and ADMIN_EMAIL) in the hosting environment.",
      },
      { status: 500 }
    );
  }

  const body = (await req.json().catch(() => null)) as
    | { email?: string; password?: string }
    | null;
  const email = (body?.email ?? "").slice(0, 200);
  const password = (body?.password ?? "").slice(0, 200);

  if (!email.trim() || !password) {
    return NextResponse.json(
      { error: "Enter both your email and password." },
      { status: 400 }
    );
  }

  // Brute-force protection: this is the owner's front door. The per-IP
  // allowance is generous enough that fat-fingering the password on a phone
  // in a truck doesn't lock the owner out for 15 minutes; the per-email
  // limit is the one that actually blunts a targeted attack.
  const ip = clientIp(req);
  const perIp = await rateLimit("admin-login-ip", ip, 15, 900);
  if (!perIp.ok) {
    return tooMany(
      "Too many sign-in attempts from this connection. Wait 15 minutes and try again."
    );
  }

  const perEmail = await rateLimit(
    "admin-login-email",
    email.toLowerCase(),
    12,
    3600
  );
  if (!perEmail.ok) {
    return tooMany(
      "Too many sign-in attempts for this email. Wait an hour, or reset the password with `npm run admin`."
    );
  }

  // Resolves the account by email (any stored sign-in) and verifies the
  // password against that account's own hash, then falls back to the
  // ADMIN_EMAIL/ADMIN_PASSWORD recovery login.
  const result = await checkAdminLogin(email, password);
  if (!result.ok) {
    // Small fixed delay blunts brute-force loops without hurting real logins.
    await new Promise((r) => setTimeout(r, 600));
    return NextResponse.json(
      { error: "That email and password don't match a dashboard sign-in." },
      { status: 401 }
    );
  }

  await setAdminSessionCookie();
  return NextResponse.json({ ok: true, via: result.via });
}

/** DELETE → clears the session (logout). */
export async function DELETE() {
  const store = await cookies();
  store.set(ADMIN_COOKIE, "", { path: "/", maxAge: 0 });
  return NextResponse.json({ ok: true });
}

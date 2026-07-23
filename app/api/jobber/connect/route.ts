import { NextResponse, type NextRequest } from "next/server";
import { randomBytes } from "crypto";
import { getSession } from "@/lib/auth";
import { isAdminLike } from "@/lib/roles";
import {
  JOBBER_AUTHORIZE_URL,
  jobberClientCreds,
  jobberRedirectUri,
} from "@/lib/jobber";

export const runtime = "nodejs";

/**
 * Starts the Jobber OAuth dance (admin only). Sets a CSRF state cookie and
 * sends the browser to Jobber's authorize screen; Jobber redirects back to
 * /api/jobber/callback with a code.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }
  const creds = jobberClientCreds();
  if (!creds) {
    return NextResponse.json(
      { error: "Set JOBBER_CLIENT_ID and JOBBER_CLIENT_SECRET first." },
      { status: 500 }
    );
  }

  const state = randomBytes(16).toString("hex");
  const url = new URL(JOBBER_AUTHORIZE_URL);
  url.searchParams.set("client_id", creds.id);
  url.searchParams.set("redirect_uri", jobberRedirectUri());
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);

  const res = NextResponse.redirect(url);
  res.cookies.set("pvs_jobber_state", state, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });
  return res;
}

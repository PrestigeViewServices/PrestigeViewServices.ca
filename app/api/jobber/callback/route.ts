import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { isAdminLike } from "@/lib/roles";
import { exchangeJobberCode } from "@/lib/jobber";

export const runtime = "nodejs";

/**
 * Jobber OAuth callback: verifies the CSRF state, exchanges the code for
 * tokens (persisted in IntegrationToken), and lands back on the club admin
 * with a status flag.
 */
export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session || !isAdminLike(session.role)) {
    return NextResponse.redirect(new URL("/admin", req.nextUrl.origin));
  }

  const code = req.nextUrl.searchParams.get("code");
  const state = req.nextUrl.searchParams.get("state");
  const expected = req.cookies.get("pvs_jobber_state")?.value;

  const back = (flag: string) =>
    NextResponse.redirect(
      new URL(`/admin/club?jobber=${flag}`, req.nextUrl.origin)
    );

  if (!code || !state || !expected || state !== expected) {
    return back("state-mismatch");
  }

  const db = getDb();
  if (!db) return back("no-db");

  const result = await exchangeJobberCode(db, code);
  const res = back(result.ok ? "connected" : "error");
  res.cookies.set("pvs_jobber_state", "", { path: "/", maxAge: 0 });
  if (!result.ok) {
    // eslint-disable-next-line no-console
    console.error("[jobber oauth]", result.reason);
  }
  return res;
}

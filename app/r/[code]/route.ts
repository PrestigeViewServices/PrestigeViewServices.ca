import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { REF_COOKIE, normalizeCode } from "@/lib/referrals";
import { getClubSettingsSafe } from "@/lib/club-settings";

export const runtime = "nodejs";

/**
 * Referral landing: /r/JORDAN-4X2K
 *
 * Validates the code, drops the attribution cookie for the configured window,
 * and lands the friend on the NATIVE request form (/request-service). That
 * matters: /api/leads is what turns the cookie into a Referral, and only the
 * native form posts there — the Aurora iframe on /quote never would.
 *
 * An unknown code still lands on the form. A referral link is a lead; it is
 * never a dead end.
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const normalized = normalizeCode(decodeURIComponent(code ?? ""));

  const db = getDb();
  const referrer =
    db && normalized
      ? await db.member.findUnique({
          where: { referralCode: normalized },
          select: { firstName: true },
        })
      : null;

  const dest = new URL("/request-service", req.nextUrl.origin);
  if (referrer) {
    dest.searchParams.set("ref", normalized);
    dest.searchParams.set("from", referrer.firstName);
  }
  // Carry a service preselect through the link (/r/CODE?service=snow-removal).
  const service = req.nextUrl.searchParams.get("service");
  if (service) dest.searchParams.set("service", service);

  const res = NextResponse.redirect(dest);

  if (referrer) {
    const settings = await getClubSettingsSafe(db);
    res.cookies.set(REF_COOKIE, normalized, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: Math.max(1, settings.referralWindowDays) * 24 * 60 * 60,
    });
  }
  return res;
}

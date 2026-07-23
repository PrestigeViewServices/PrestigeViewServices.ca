import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/** Days the referral attribution cookie lives. */
const REF_COOKIE_DAYS = 30;

/**
 * Referral landing: /r/JORDAN-4X2K
 * Validates the code, drops the attribution cookie, and lands the friend on
 * the quote form with the ref carried in the URL. When the friend submits
 * the form, /api/leads turns the cookie into a Referral (status BOOKED).
 */
export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ code: string }> }
) {
  const { code } = await ctx.params;
  const normalized = decodeURIComponent(code ?? "").trim().toUpperCase();

  const db = getDb();
  const referrer =
    db && normalized
      ? await db.member.findUnique({
          where: { referralCode: normalized },
          select: { id: true },
        })
      : null;

  // Unknown code still lands on /quote — never a dead end for a lead.
  const dest = new URL(
    referrer ? `/quote?ref=${encodeURIComponent(normalized)}` : "/quote",
    req.nextUrl.origin
  );
  const res = NextResponse.redirect(dest);
  if (referrer) {
    res.cookies.set("pvs_ref", normalized, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: REF_COOKIE_DAYS * 24 * 60 * 60,
    });
  }
  return res;
}

import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { POINTS } from "@/lib/loyalty";
import { sendClubEmail } from "@/lib/send-club-email";
import { siteConfig } from "@/lib/site";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Birthday bonus cron — runs monthly (vercel.json). Members whose
 * birthdayMonth matches the current month get +100 once per rolling year;
 * a prior EARN_BIRTHDAY entry inside 11 months blocks a duplicate.
 */
export async function GET(req: NextRequest) {
  const secret = (process.env.CRON_SECRET ?? "").trim();
  const auth = req.headers.get("authorization") ?? "";
  if (!secret || auth !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const db = getDb();
  if (!db) return NextResponse.json({ ok: false, reason: "DB not configured" });

  const month = new Date().getMonth() + 1; // 1-12
  const elevenMonthsAgo = new Date();
  elevenMonthsAgo.setMonth(elevenMonthsAgo.getMonth() - 11);

  const profiles = await db.customerProfile.findMany({
    where: { birthdayMonth: month },
    include: { member: true },
  });

  let awarded = 0;
  for (const p of profiles) {
    const recent = await db.pointsTransaction.findFirst({
      where: {
        memberId: p.memberId,
        type: "EARN_BIRTHDAY",
        createdAt: { gte: elevenMonthsAgo },
      },
    });
    if (recent) continue;

    await db.pointsTransaction.create({
      data: {
        memberId: p.memberId,
        type: "EARN_BIRTHDAY",
        amount: POINTS.BIRTHDAY,
        note: "Happy birthday from the PVS crew!",
      },
    });
    awarded++;

    if (p.notifyPromos) {
      await sendClubEmail({
        to: p.member.email,
        subject: `Happy birthday month, ${p.member.firstName}! +${POINTS.BIRTHDAY} points`,
        text: [
          `Hi ${p.member.firstName},`,
          ``,
          `It's your birthday month, so ${POINTS.BIRTHDAY} Prestige Club points just landed in your account, from all of us at PVS.`,
          ``,
          `Your points: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/account/rewards`,
          ``,
          `Prestige View Services · ${siteConfig.phoneDisplay}`,
        ].join("\n"),
      });
    }
  }

  return NextResponse.json({ ok: true, month, candidates: profiles.length, awarded });
}

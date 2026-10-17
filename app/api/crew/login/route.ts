import { NextResponse } from "next/server";
import { findMemberByPin, isCrewAuthConfigured, setCrewCookie, touchMember } from "@/lib/crew-app";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

/** POST { pin } with a personal PIN → sets the crew cookie. One step. */
export async function POST(req: Request) {
  if (!isCrewAuthConfigured()) {
    return NextResponse.json(
      { error: "Crew sign-in isn't set up on this deployment yet." },
      { status: 500 }
    );
  }
  const ip = clientIp(req);
  const limit = await rateLimit("crew-login-ip", ip, 20, 900);
  if (!limit.ok) return tooMany("Too many tries. Wait 15 minutes.");

  const body = (await req.json().catch(() => null)) as { pin?: string } | null;
  const pin = (body?.pin ?? "").replace(/\D/g, "").slice(0, 6);
  if (pin.length < 4) {
    return NextResponse.json({ error: "Enter your PIN." }, { status: 400 });
  }
  const member = await findMemberByPin(pin);
  if (!member) {
    return NextResponse.json(
      { error: "That PIN doesn't match anyone. Ask your supervisor." },
      { status: 401 }
    );
  }
  await setCrewCookie(member.crew.id, member.id);
  await touchMember(member.id, null);
  return NextResponse.json({ ok: true, name: member.name, crew: member.crew.name });
}

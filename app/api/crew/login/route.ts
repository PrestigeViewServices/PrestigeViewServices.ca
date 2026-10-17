import { NextResponse } from "next/server";
import { findCrewByPin, isCrewAuthConfigured, setCrewCookie } from "@/lib/crew-app";
import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";

export const runtime = "nodejs";

/**
 * Two-step crew sign-in.
 *   POST { pin }            → { crew: { id, name, members[] } }  (pick a name next)
 *   POST { pin, memberId }  → sets the crew cookie, { ok: true }
 */
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

  const body = (await req.json().catch(() => null)) as
    | { pin?: string; memberId?: string }
    | null;
  const pin = (body?.pin ?? "").replace(/\D/g, "").slice(0, 6);
  if (pin.length < 4) {
    return NextResponse.json({ error: "Enter your crew PIN." }, { status: 400 });
  }
  const crew = await findCrewByPin(pin);
  if (!crew) {
    return NextResponse.json(
      { error: "That PIN doesn't match a crew. Ask your supervisor." },
      { status: 401 }
    );
  }
  if (!body?.memberId) {
    return NextResponse.json({
      crew: { id: crew.id, name: crew.name, members: crew.members },
    });
  }
  const member = crew.members.find((m) => m.id === body.memberId);
  if (!member) {
    return NextResponse.json({ error: "Pick your name." }, { status: 400 });
  }
  await setCrewCookie(crew.id, member.id);
  return NextResponse.json({ ok: true, name: member.name, crew: crew.name });
}

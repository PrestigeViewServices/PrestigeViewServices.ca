import { NextResponse } from "next/server";
import { clearCrewCookie } from "@/lib/crew-app";

export const runtime = "nodejs";

export async function POST() {
  await clearCrewCookie();
  return NextResponse.json({ ok: true });
}

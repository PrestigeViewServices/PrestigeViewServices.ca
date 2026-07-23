import { clientIp, rateLimit } from "@/lib/rate-limit";
import { NextResponse, type NextRequest } from "next/server";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";

/**
 * First-party page-view tracking. The TrackPageview component beacons here
 * on every client-side navigation. Stores one row per view in our own
 * Postgres — no external analytics service.
 *
 * Privacy: we never store the IP or user-agent. The visitor id is an
 * HMAC of (ip + user-agent + UTC day) so daily uniques are countable while
 * the inputs stay unrecoverable, and it rotates every day by design.
 */

const BOT_RE =
  /bot|crawler|spider|crawling|preview|scan|lighthouse|pingdom|headless/i;

async function hmacHex(secret: string, message: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(message));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("")
    .slice(0, 32);
}

function deviceFromUa(ua: string): string {
  if (/tablet|ipad/i.test(ua)) return "tablet";
  if (/mobi|android|iphone/i.test(ua)) return "mobile";
  return "desktop";
}

function referrerHost(raw: unknown, ownHost: string | null): string | null {
  if (typeof raw !== "string" || !raw) return null;
  try {
    const host = new URL(raw).hostname.replace(/^www\./, "");
    if (ownHost && host === ownHost.replace(/^www\./, "")) return null;
    return host.slice(0, 100);
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const limited = await rateLimit("track", clientIp(req), 150, 600);
  if (!limited.ok) return new NextResponse(null, { status: 204 });
  const db = getDb();
  if (!db) return new NextResponse(null, { status: 204 });

  const ua = req.headers.get("user-agent") ?? "";
  if (!ua || BOT_RE.test(ua)) return new NextResponse(null, { status: 204 });

  const body = (await req.json().catch(() => null)) as {
    path?: string;
    referrer?: string;
  } | null;

  let path = typeof body?.path === "string" ? body.path : "";
  // Pathname only, cap length, and never record the admin area.
  path = path.split("?")[0].split("#")[0].slice(0, 200);
  if (!path.startsWith("/") || path.startsWith("/admin")) {
    return new NextResponse(null, { status: 204 });
  }

  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    req.headers.get("x-real-ip") ??
    "unknown";
  const day = new Date().toISOString().slice(0, 10);
  const secret =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.ADMIN_PASSWORD ||
    "pvs-analytics";
  const visitorId = await hmacHex(secret, `${ip}|${ua}|${day}`);

  const country =
    req.headers.get("x-vercel-ip-country")?.slice(0, 2) ?? null;

  try {
    await db.pageView.create({
      data: {
        path,
        referrer: referrerHost(body?.referrer, req.nextUrl.hostname),
        visitorId,
        device: deviceFromUa(ua),
        country,
      },
    });
  } catch {
    // Analytics must never break the site — swallow storage errors.
  }
  return new NextResponse(null, { status: 204 });
}

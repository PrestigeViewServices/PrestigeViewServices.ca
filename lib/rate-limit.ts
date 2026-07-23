import type { PrismaClient } from "@prisma/client";
import { getDb } from "./db";

/**
 * Fixed-window rate limiter backed by Postgres, so limits hold across
 * serverless instances. Fail-open on DB trouble (availability over
 * strictness for a marketing site), fail-CLOSED is the caller's choice by
 * checking `ok` strictly.
 *
 * Usage: const { ok } = await rateLimit("admin-login", ip, 5, 900);
 */
export async function rateLimit(
  scope: string,
  key: string,
  limit: number,
  windowSeconds: number,
  db: PrismaClient | null = getDb()
): Promise<{ ok: boolean; count: number }> {
  if (!db) return { ok: true, count: 0 };
  const window = Math.floor(Date.now() / (windowSeconds * 1000));
  const id = `${scope}:${key}:${window}`.slice(0, 200);
  try {
    const row = await db.rateLimitBucket.upsert({
      where: { id },
      create: { id },
      update: { count: { increment: 1 } },
    });
    // Opportunistic pruning of stale buckets (~2% of calls).
    if (Math.random() < 0.02) {
      db.rateLimitBucket
        .deleteMany({
          where: { updatedAt: { lt: new Date(Date.now() - 24 * 3600 * 1000) } },
        })
        .catch(() => {});
    }
    return { ok: row.count <= limit, count: row.count };
  } catch {
    return { ok: true, count: 0 };
  }
}

/** Best client IP available behind Vercel's proxy. */
export function clientIp(req: Request): string {
  const h = (name: string) => req.headers.get(name) ?? "";
  return (
    h("x-real-ip") ||
    h("x-forwarded-for").split(",")[0].trim() ||
    "unknown"
  );
}

/** Standard 429 response. */
export function tooMany(message = "Too many attempts — please wait a few minutes and try again.") {
  return new Response(JSON.stringify({ error: message }), {
    status: 429,
    headers: { "Content-Type": "application/json", "Retry-After": "600" },
  });
}

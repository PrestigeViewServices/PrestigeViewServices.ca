import { PrismaClient } from "@prisma/client";

/**
 * Lazy Prisma client. We only instantiate when DATABASE_URL is set so the
 * app boots cleanly in dev before Postgres is wired up. Pages call
 * `getDb()` and render a "DB not configured" state when it returns null.
 *
 * In dev, we cache the client on globalThis to survive HMR reloads —
 * otherwise every edit spawns a new connection pool.
 */
const globalForPrisma = globalThis as unknown as {
  __pvsPrisma__: PrismaClient | undefined;
};

let client: PrismaClient | null = null;

function init(): PrismaClient | null {
  if (!process.env.DATABASE_URL) return null;
  if (globalForPrisma.__pvsPrisma__) return globalForPrisma.__pvsPrisma__;

  const c = new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["error", "warn"]
        : ["error"],
  });

  if (process.env.NODE_ENV !== "production") {
    globalForPrisma.__pvsPrisma__ = c;
  }
  return c;
}

export function getDb(): PrismaClient | null {
  if (!client) client = init();
  return client;
}

export function isDbReady(): boolean {
  return !!process.env.DATABASE_URL;
}

export const DB_ENV_VARS = ["DATABASE_URL"] as const;

export function missingDbEnvVars(): string[] {
  return DB_ENV_VARS.filter((k) => !process.env[k]);
}

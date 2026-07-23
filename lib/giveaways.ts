import { randomInt } from "crypto";
import type { Giveaway, PrismaClient } from "@prisma/client";
import { TIERS, tierDef } from "./loyalty";

/**
 * Quarterly giveaway engine.
 *
 * Entries per draw:
 *   - Tier entries: Member/Insider 1, Elite 2, Prestige 3 (TIERS config).
 *   - +1 bonus entry per referral AWARDED inside the giveaway window.
 *   - No-purchase entries from the free public form (/giveaway-entry) —
 *     required for Canadian contest compliance; equal odds per entry.
 *
 * The draw is auditable: every entry becomes a GiveawayEntry row BEFORE the
 * winner is picked with crypto-grade randomness, so the pool that produced
 * the winner is preserved exactly as drawn.
 */

export type EntryBreakdown = {
  tierEntries: number;
  referralEntries: number;
  total: number;
};

/** A member's entry projection for a giveaway (portal display + draw). */
export async function memberEntryBreakdown(
  db: PrismaClient,
  giveaway: Pick<Giveaway, "opensAt" | "closesAt">,
  member: { id: string; tier: string }
): Promise<EntryBreakdown> {
  const tierEntries = tierDef(member.tier as (typeof TIERS)[number]["key"])
    .giveawayEntries;
  const referralEntries = await db.referral.count({
    where: {
      referrerId: member.id,
      status: "AWARDED",
      updatedAt: {
        gte: giveaway.opensAt ?? undefined,
        lte: giveaway.closesAt ?? undefined,
      },
    },
  });
  return {
    tierEntries,
    referralEntries,
    total: tierEntries + referralEntries,
  };
}

export type DrawResult = {
  ok: boolean;
  reason?: string;
  totalEntries?: number;
  winnerEntryId?: string;
};

/**
 * Close-out draw: snapshots every member's tier + referral entries as rows,
 * merges them with the stored no-purchase entries, and picks one winner
 * uniformly at random (crypto). Refuses to run twice.
 */
export async function runDraw(
  db: PrismaClient,
  giveawayId: string
): Promise<DrawResult> {
  const giveaway = await db.giveaway.findUnique({ where: { id: giveawayId } });
  if (!giveaway) return { ok: false, reason: "Giveaway not found" };
  if (giveaway.status === "DRAWN") {
    return { ok: false, reason: "Already drawn" };
  }

  // Snapshot member entries. Delete any prior generated snapshot first so a
  // retried draw can't double-count (no-purchase rows are preserved).
  await db.giveawayEntry.deleteMany({
    where: { giveawayId, source: { in: ["tier", "referral"] } },
  });

  const members = await db.member.findMany({
    include: { profile: { select: { tier: true } } },
  });
  for (const m of members) {
    const breakdown = await memberEntryBreakdown(db, giveaway, {
      id: m.id,
      tier: m.profile?.tier ?? "MEMBER",
    });
    const rows = [
      ...Array.from({ length: breakdown.tierEntries }, () => "tier"),
      ...Array.from({ length: breakdown.referralEntries }, () => "referral"),
    ];
    if (rows.length > 0) {
      await db.giveawayEntry.createMany({
        data: rows.map((source) => ({ giveawayId, memberId: m.id, source })),
      });
    }
  }

  const entries = await db.giveawayEntry.findMany({
    where: { giveawayId },
    select: { id: true },
    orderBy: { createdAt: "asc" },
  });
  if (entries.length === 0) {
    return { ok: false, reason: "No entries to draw from" };
  }

  const winner = entries[randomInt(entries.length)];
  await db.giveaway.update({
    where: { id: giveawayId },
    data: {
      status: "DRAWN",
      drawnAt: new Date(),
      winnerEntryId: winner.id,
    },
  });
  return { ok: true, totalEntries: entries.length, winnerEntryId: winner.id };
}

/** Mathematical skill-testing question (CA contest requirement). */
export function generateSkillQuestion(): { question: string; answer: number } {
  const a = randomInt(3, 10);
  const b = randomInt(3, 10);
  const c = randomInt(5, 21);
  const d = randomInt(1, 10);
  return {
    question: `(${a} × ${b}) + ${c} − ${d} = ?`,
    answer: a * b + c - d,
  };
}

/** Winner display info: first name + town only (privacy). */
export async function winnerDisplay(
  db: PrismaClient,
  winnerEntryId: string
): Promise<string | null> {
  const entry = await db.giveawayEntry.findUnique({
    where: { id: winnerEntryId },
    include: { member: { include: { profile: true } } },
  });
  if (!entry) return null;
  const name = entry.member?.firstName ?? entry.entrantName ?? "Winner";
  const town = entry.member?.profile?.city ?? entry.entrantTown ?? null;
  const first = name.split(" ")[0];
  return town ? `${first} from ${town}` : first;
}

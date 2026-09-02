import type { PrismaClient } from "@prisma/client";
import {
  DRIVEWAY_SIZE_LABELS,
  getDrivewayTier,
} from "@/lib/content/winter-packages";

/**
 * The follow-up queue: one prioritized list of every inbound item that is
 * waiting on the business, pulled from the same tables the inbox pages use.
 *
 * The website promises replies "within 24 hours" in several places, so the
 * thresholds here are deliberately tighter than that promise: an item shows
 * as DUE while there is still time to keep the promise and OVERDUE once it
 * has been broken. The Command Center tile and /admin/follow-ups both read
 * from this module so the numbers always agree.
 */

export type FollowUpUrgency = "overdue" | "due" | "fresh";

export type FollowUpItem = {
  kind: "lead" | "winter" | "support";
  id: string;
  name: string;
  phone: string | null;
  email: string | null;
  /** One line of context, e.g. "Platinum pass · Double · Petawawa". */
  summary: string;
  /** Why this item is in the queue, e.g. "New quote request". */
  reason: string;
  /** Admin page where the work happens. */
  href: string;
  createdAt: Date;
  urgency: FollowUpUrgency;
};

const HOUR_MS = 60 * 60 * 1000;

function urgencyFor(
  createdAt: Date,
  dueAfterHours: number,
  overdueAfterHours: number
): FollowUpUrgency {
  const age = Date.now() - createdAt.getTime();
  if (age >= overdueAfterHours * HOUR_MS) return "overdue";
  if (age >= dueAfterHours * HOUR_MS) return "due";
  return "fresh";
}

/** Human age like "3h" or "2d". */
export function ageLabel(createdAt: Date): string {
  const hours = Math.floor((Date.now() - createdAt.getTime()) / HOUR_MS);
  if (hours < 1) return "just now";
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

const URGENCY_ORDER: Record<FollowUpUrgency, number> = {
  overdue: 0,
  due: 1,
  fresh: 2,
};

/**
 * Everything currently waiting on a reply, most urgent first, oldest first
 * within the same urgency. Capped per source so one busy week cannot bury
 * the others.
 */
export async function getFollowUps(db: PrismaClient): Promise<FollowUpItem[]> {
  const [leads, reservations, support] = await Promise.all([
    db.lead.findMany({
      where: { status: "NEW" },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.winterReservation.findMany({
      where: { status: { in: ["NEW", "CONTACTED"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
    db.supportRequest.findMany({
      where: { status: { in: ["NEW", "IN_PROGRESS"] } },
      orderBy: { createdAt: "asc" },
      take: 50,
    }),
  ]);

  const items: FollowUpItem[] = [
    ...leads.map((l): FollowUpItem => ({
      kind: "lead",
      id: l.id,
      name: l.name,
      phone: l.phone || null,
      email: l.email || null,
      summary: Array.isArray(l.serviceSlugs)
        ? (l.serviceSlugs as string[]).join(", ") || "General inquiry"
        : "General inquiry",
      reason: "New quote request, needs a quote",
      href: "/admin/leads",
      createdAt: l.createdAt,
      // Promise: quotes within one business day.
      urgency: urgencyFor(l.createdAt, 12, 24),
    })),
    ...reservations.map((r): FollowUpItem => ({
      kind: "winter",
      id: r.id,
      name: r.name,
      phone: r.phone || null,
      email: r.email || null,
      summary: `${getDrivewayTier(r.drivewayTier).name} pass · ${
        DRIVEWAY_SIZE_LABELS[r.drivewaySize]
      } · ${r.city}`,
      reason:
        r.status === "NEW"
          ? "New snow pass request, confirm the route spot"
          : "Contacted, waiting on confirmation",
      href: "/admin/winter-reservations",
      createdAt: r.createdAt,
      // Promise: route spot confirmed within 24 hours.
      urgency:
        r.status === "NEW"
          ? urgencyFor(r.createdAt, 12, 24)
          : urgencyFor(r.createdAt, 72, 120),
    })),
    ...support.map((s): FollowUpItem => ({
      kind: "support",
      id: s.id,
      name: s.name,
      phone: s.phone || null,
      email: s.email || null,
      summary: s.details.slice(0, 80) || "Support request",
      reason:
        s.status === "NEW" ? "New support request" : "Support in progress",
      href: "/admin/support",
      createdAt: s.createdAt,
      urgency: urgencyFor(s.createdAt, 12, 24),
    })),
  ];

  items.sort((a, b) => {
    const u = URGENCY_ORDER[a.urgency] - URGENCY_ORDER[b.urgency];
    if (u !== 0) return u;
    return a.createdAt.getTime() - b.createdAt.getTime();
  });
  return items;
}

/** Count of items that are due or overdue, for the Command Center tile. */
export async function followUpsDueCount(db: PrismaClient): Promise<number> {
  const items = await getFollowUps(db);
  return items.filter((i) => i.urgency !== "fresh").length;
}

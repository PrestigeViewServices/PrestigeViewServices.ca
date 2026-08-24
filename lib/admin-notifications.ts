import type { PrismaClient } from "@prisma/client";
import { getDb } from "./db";

/**
 * In-app notification feed for the admin dashboard.
 *
 * Every event the website generates lands here — the same fan-out that
 * emails/texts the owner (lib/notify.ts) also records a row, plus referral
 * events that have no email of their own. The bell in the admin sidebar
 * shows the unread count, and /admin/notifications is the feed.
 *
 * This is deliberately independent of Resend/Twilio: the feed works even
 * while the email keys are missing, so nothing the website captures can go
 * unnoticed again.
 */

export type NotificationKind =
  | "lead"
  | "winter"
  | "application"
  | "support"
  | "member"
  | "referral"
  | "giveaway"
  | "ticket"
  | "redemption"
  | "claim"
  | "system";

export const KIND_META: Record<
  NotificationKind,
  { label: string; href: string; cls: string }
> = {
  lead: {
    label: "Quote request",
    href: "/admin/leads",
    cls: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  },
  winter: {
    label: "Winter reservation",
    href: "/admin/winter-reservations",
    cls: "bg-cyan-500/15 text-cyan-200 border-cyan-500/25",
  },
  application: {
    label: "Job application",
    href: "/admin/applications",
    cls: "bg-violet-500/15 text-violet-300 border-violet-500/25",
  },
  support: {
    label: "Support",
    href: "/admin/support",
    cls: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  },
  member: {
    label: "New member",
    href: "/admin/club",
    cls: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  },
  referral: {
    label: "Referral",
    href: "/admin/club/referrals",
    cls: "bg-pink-500/15 text-pink-300 border-pink-500/25",
  },
  giveaway: {
    label: "Giveaway entry",
    href: "/admin/club/giveaways",
    cls: "bg-fuchsia-500/15 text-fuchsia-300 border-fuchsia-500/25",
  },
  ticket: {
    label: "Club request",
    href: "/admin/club/tickets",
    cls: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  },
  redemption: {
    label: "Redemption",
    href: "/admin/club/approvals",
    cls: "bg-yellow-500/15 text-yellow-200 border-yellow-500/25",
  },
  claim: {
    label: "Bonus claim",
    href: "/admin/club/approvals",
    cls: "bg-orange-500/15 text-orange-200 border-orange-500/25",
  },
  system: {
    label: "System",
    href: "/admin",
    cls: "bg-slate-500/15 text-slate-200 border-slate-500/25",
  },
};

export function kindMeta(kind: string) {
  return KIND_META[(kind as NotificationKind) in KIND_META ? (kind as NotificationKind) : "system"];
}

/**
 * Record a notification. Best-effort by design: this is called from intake
 * routes where nothing — not even a broken notifications table — is allowed
 * to fail the customer's submission.
 */
export async function recordNotification(opts: {
  kind: NotificationKind;
  title: string;
  body?: string | null;
  href?: string | null;
  db?: PrismaClient | null;
}): Promise<void> {
  try {
    const db = opts.db ?? getDb();
    if (!db) return;
    await db.adminNotification.create({
      data: {
        kind: opts.kind,
        title: opts.title.slice(0, 200),
        body: opts.body?.slice(0, 2000) || null,
        href: opts.href ?? KIND_META[opts.kind].href,
      },
    });
  } catch {
    // Never let the feed break an intake.
  }
}

/** Unread count for the sidebar badge. Safe to call anywhere server-side. */
export async function unreadNotificationCount(): Promise<number> {
  try {
    const db = getDb();
    if (!db) return 0;
    return await db.adminNotification.count({ where: { readAt: null } });
  } catch {
    return 0;
  }
}

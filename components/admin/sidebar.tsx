"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  LifeBuoy,
  Settings,
  Image as ImageIcon,
  MessageSquareQuote,
  Snowflake,
  KanbanSquare,
  Contact,
  Truck,
  Inbox,
  BarChart3,
  Award,
  MessageCircle,
  BadgeCheck,
  SlidersHorizontal,
  PartyPopper,
  TrendingUp,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavGroup = { title: string; items: NavItem[] };

/**
 * Single-owner dashboard, the password unlocks everything, so there is no
 * per-role filtering. Grouped so the daily surfaces sit on top.
 */
const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Command Center", icon: LayoutDashboard },
      { href: "/admin/traffic", label: "Website Traffic", icon: BarChart3 },
    ],
  },
  {
    title: "Prestige Club",
    items: [
      { href: "/admin/club", label: "Members", icon: Award },
      { href: "/admin/club/approvals", label: "Approvals", icon: BadgeCheck },
      { href: "/admin/club/tickets", label: "Club Requests", icon: MessageCircle },
      { href: "/admin/club/giveaways", label: "Giveaways", icon: PartyPopper },
      { href: "/admin/club/metrics", label: "Metrics", icon: TrendingUp },
      { href: "/admin/club/settings", label: "Program Settings", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Inbound",
    items: [
      { href: "/admin/leads", label: "Quote Requests", icon: Inbox },
      {
        href: "/admin/winter-reservations",
        label: "Winter Reservations",
        icon: Snowflake,
      },
      { href: "/admin/applications", label: "Applications", icon: Briefcase },
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/pipeline", label: "Job Pipeline", icon: KanbanSquare },
      { href: "/admin/accounts", label: "Accounts", icon: Contact },
      { href: "/admin/dispatch", label: "Crew Dispatch", icon: Truck },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/site/photos", label: "Photos", icon: ImageIcon },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
      { href: "/admin/site", label: "Site Settings", icon: Settings },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active =
              item.href === "/admin"
                ? pathname === "/admin"
                : pathname.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-2.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  active
                    ? "bg-primary/15 text-foreground"
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
      <div className="border-t border-surface-border pt-3">
        <AdminLogoutButton />
      </div>
    </nav>
  );
}

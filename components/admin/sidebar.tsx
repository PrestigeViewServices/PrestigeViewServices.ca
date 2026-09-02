"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  FileEdit,
  Gift,
  LayoutDashboard,
  Briefcase,
  LifeBuoy,
  Settings,
  Image as ImageIcon,
  MessageSquareQuote,
  Snowflake,
  KanbanSquare,
  Contact,
  PhoneCall,
  Truck,
  Inbox,
  BarChart3,
  Award,
  MessageCircle,
  BadgeCheck,
  SlidersHorizontal,
  PartyPopper,
  TrendingUp,
  UserCog,
} from "lucide-react";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Show the unread-notifications badge on this item. */
  badge?: boolean;
};

type NavGroup = { title: string; items: NavItem[] };

/**
 * Both dashboard passwords unlock everything, so there is no per-role
 * filtering. Grouped by how the owner actually works the business:
 * leads (money coming in) and requests (people waiting on an answer) are
 * separate groups so neither ever hides inside the other.
 */
const groups: NavGroup[] = [
  {
    title: "Overview",
    items: [
      { href: "/admin", label: "Command Center", icon: LayoutDashboard },
      { href: "/admin/follow-ups", label: "Follow-Ups", icon: PhoneCall },
      {
        href: "/admin/notifications",
        label: "Notifications",
        icon: Bell,
        badge: true,
      },
      { href: "/admin/traffic", label: "Website Traffic", icon: BarChart3 },
    ],
  },
  {
    title: "Leads & Sales",
    items: [
      { href: "/admin/leads", label: "Leads Inbox", icon: Inbox },
      { href: "/admin/pipeline", label: "Job Pipeline", icon: KanbanSquare },
      {
        href: "/admin/winter-reservations",
        label: "Winter Reservations",
        icon: Snowflake,
      },
      { href: "/admin/marketing", label: "Marketing & SEO", icon: TrendingUp },
    ],
  },
  {
    title: "Requests",
    items: [
      { href: "/admin/support", label: "Support", icon: LifeBuoy },
      { href: "/admin/club/tickets", label: "Club Requests", icon: MessageCircle },
      { href: "/admin/applications", label: "Applications", icon: Briefcase },
    ],
  },
  {
    title: "Prestige Club",
    items: [
      { href: "/admin/club", label: "Members", icon: Award },
      { href: "/admin/club/approvals", label: "Approvals", icon: BadgeCheck },
      { href: "/admin/club/referrals", label: "Referrals", icon: Gift },
      { href: "/admin/club/giveaways", label: "Giveaways", icon: PartyPopper },
      { href: "/admin/club/metrics", label: "Metrics", icon: BarChart3 },
      { href: "/admin/club/settings", label: "Program Settings", icon: SlidersHorizontal },
    ],
  },
  {
    title: "Operations",
    items: [
      { href: "/admin/accounts", label: "Accounts", icon: Contact },
      { href: "/admin/dispatch", label: "Crew Dispatch", icon: Truck },
    ],
  },
  {
    title: "Website",
    items: [
      { href: "/admin/site/content", label: "Page Content", icon: FileEdit },
      { href: "/admin/site/photos", label: "Photos", icon: ImageIcon },
      { href: "/admin/reviews", label: "Reviews", icon: MessageSquareQuote },
      { href: "/admin/site", label: "Site Settings", icon: Settings },
    ],
  },
  {
    title: "Account",
    items: [{ href: "/admin/account", label: "Sign-ins", icon: UserCog }],
  },
];

export function AdminSidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();

  // Longest matching href wins, so /admin/club/tickets lights up "Club
  // Requests" and not also "Members" (/admin/club).
  const activeHref = groups
    .flatMap((g) => g.items)
    .filter((i) =>
      i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href)
    )
    .sort((a, b) => b.href.length - a.href.length)[0]?.href;

  return (
    <nav className="space-y-5">
      {groups.map((group) => (
        <div key={group.title} className="space-y-1">
          <p className="px-3 pb-1 text-[11px] uppercase tracking-wider text-muted-foreground">
            {group.title}
          </p>
          {group.items.map((item) => {
            const active = item.href === activeHref;
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
                <span className="flex-1">{item.label}</span>
                {item.badge && unread > 0 && (
                  <span className="ml-auto grid h-5 min-w-5 place-items-center rounded-full bg-primary px-1 text-[10px] font-bold text-white">
                    {unread > 99 ? "99+" : unread}
                  </span>
                )}
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

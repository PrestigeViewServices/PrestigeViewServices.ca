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
  UserPlus,
  Upload,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Show the unread-notifications badge on this item. */
  badge?: boolean;
};

export type NavGroup = { title: string; items: NavItem[] };

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
      { href: "/admin/leads/new", label: "New Lead", icon: UserPlus },
      { href: "/admin/leads/import", label: "Import Leads", icon: Upload },
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
      {
        href: "/admin/club/tickets",
        label: "Club Requests",
        icon: MessageCircle,
      },
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
      {
        href: "/admin/club/settings",
        label: "Program Settings",
        icon: SlidersHorizontal,
      },
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

/**
 * The nav item that owns `pathname`. Longest matching href wins, so
 * /admin/club/tickets lights up "Club Requests" and not also "Members"
 * (/admin/club). Shared with the mobile bar so both agree on "where am I".
 */
export function activeAdminItem(pathname: string): NavItem | undefined {
  return groups
    .flatMap((g) => g.items)
    .filter((i) =>
      i.href === "/admin" ? pathname === "/admin" : pathname.startsWith(i.href),
    )
    .sort((a, b) => b.href.length - a.href.length)[0];
}

/** Group + item for the current page, for the top-bar breadcrumb. */
export function adminBreadcrumb(pathname: string): {
  group?: string;
  item?: NavItem;
} {
  const item = activeAdminItem(pathname);
  const group = item
    ? groups.find((g) => g.items.some((i) => i.href === item.href))?.title
    : undefined;
  return { group, item };
}

/**
 * The nav list itself. Rendered in the fixed desktop sidebar and inside the
 * phone drawer, so both stay identical.
 */
export function AdminSidebar({ unread = 0 }: { unread?: number }) {
  const pathname = usePathname();
  const activeHref = activeAdminItem(pathname)?.href;

  return (
    <nav aria-label="Admin" className="space-y-5">
      {groups.map((group) => (
        <div key={group.title}>
          <p className="px-3 pb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.12em] text-slate-500">
            {group.title}
          </p>
          <ul className="space-y-px">
            {group.items.map((item) => {
              const active = item.href === activeHref;
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-sm px-3 py-[7px] text-[13px] font-medium transition-colors",
                      active
                        ? "bg-white/[0.07] text-white"
                        : "text-slate-400 hover:bg-white/[0.04] hover:text-slate-100",
                    )}
                  >
                    {active && (
                      <span className="absolute inset-y-1.5 left-0 w-[3px] rounded-r bg-primary" />
                    )}
                    <Icon
                      className={cn(
                        "h-4 w-4 shrink-0",
                        active
                          ? "text-primary"
                          : "text-slate-500 group-hover:text-slate-300",
                      )}
                    />
                    <span className="flex-1 truncate">{item.label}</span>
                    {item.badge && unread > 0 && (
                      <span className="ml-auto grid h-[18px] min-w-[18px] place-items-center rounded-full bg-primary px-1 text-[10px] font-bold tabular-nums text-white">
                        {unread > 99 ? "99+" : unread}
                      </span>
                    )}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

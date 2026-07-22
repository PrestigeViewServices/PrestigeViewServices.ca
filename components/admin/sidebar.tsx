"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Briefcase,
  LifeBuoy,
  Users,
  Star,
  Settings,
  Image as ImageIcon,
  MessageSquareQuote,
  Snowflake,
  KanbanSquare,
  Contact,
  Truck,
} from "lucide-react";
import { canDispatch, type Role } from "@/lib/roles";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** If set, the item only renders when the predicate returns true. */
  show?: (role: Role | null) => boolean;
};

const items: NavItem[] = [
  {
    href: "/admin",
    label: "Command Center",
    icon: LayoutDashboard,
  },
  {
    href: "/admin/pipeline",
    label: "Job Pipeline",
    icon: KanbanSquare,
    // Ops roles: ultimate_admin, admin, manager (super_admin is photos/hiring only).
    show: (r) => canDispatch(r),
  },
  {
    href: "/admin/accounts",
    label: "Accounts",
    icon: Contact,
    show: (r) => canDispatch(r),
  },
  {
    href: "/admin/dispatch",
    label: "Crew Dispatch",
    icon: Truck,
    show: (r) => canDispatch(r),
  },
  {
    href: "/admin/applications",
    label: "Applications",
    icon: Briefcase,
  },
  {
    href: "/admin/winter-reservations",
    label: "Winter Reservations",
    icon: Snowflake,
    show: (r) => r === "ultimate_admin" || r === "admin",
  },
  {
    href: "/admin/site/photos",
    label: "Photos",
    icon: ImageIcon,
    // super_admin + ultimate_admin only, admin doesn't manage photos.
    show: (r) => r === "ultimate_admin" || r === "super_admin",
  },
  {
    href: "/admin/reviews",
    label: "Reviews",
    icon: MessageSquareQuote,
    // QR + templates are useful for everyone in the admin family.
    show: (r) =>
      r === "ultimate_admin" || r === "admin" || r === "super_admin",
  },
  {
    href: "/admin/support",
    label: "Support",
    icon: LifeBuoy,
    // admin + ultimate_admin only, super_admin is intentionally excluded.
    show: (r) => r === "ultimate_admin" || r === "admin",
  },
  {
    href: "/admin/loyalty",
    label: "Loyalty",
    icon: Star,
    // Billing-adjacent, same gate as support, super_admin excluded.
    show: (r) => r === "ultimate_admin" || r === "admin",
  },
  {
    href: "/admin/users",
    label: "Users",
    icon: Users,
    show: (r) => r === "ultimate_admin",
  },
  {
    href: "/admin/site",
    label: "Site Modifications",
    icon: Settings,
    show: (r) => r === "ultimate_admin",
  },
];

export function AdminSidebar({ role }: { role: Role | null }) {
  const pathname = usePathname();
  const visible = items.filter((i) => !i.show || i.show(role));

  return (
    <nav className="space-y-1">
      <p className="px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground">
        Admin
      </p>
      {visible.map((item) => {
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
    </nav>
  );
}

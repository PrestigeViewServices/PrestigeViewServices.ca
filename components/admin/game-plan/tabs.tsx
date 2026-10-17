"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const TABS = [
  { href: "/admin/game-plan", label: "Plan" },
  { href: "/admin/game-plan/live", label: "Live" },
  { href: "/admin/game-plan/points", label: "Points" },
  { href: "/admin/game-plan/photos", label: "Photos" },
  { href: "/admin/game-plan/leads", label: "Leads" },
  { href: "/admin/game-plan/issues", label: "Issues" },
  { href: "/admin/game-plan/team", label: "Team" },
];

/** Sub-navigation shared by every Crew App admin page. */
export function GamePlanTabs() {
  const pathname = usePathname();
  return (
    <nav className="-mx-1 flex gap-1 overflow-x-auto border-b border-white/[0.06] px-1">
      {TABS.map((t) => {
        const active =
          t.href === "/admin/game-plan" ? pathname === t.href : pathname.startsWith(t.href);
        return (
          <Link
            key={t.href}
            href={t.href}
            className={cn(
              "-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-[13px] font-medium transition-colors",
              active
                ? "border-primary text-white"
                : "border-transparent text-slate-400 hover:text-slate-200"
            )}
          >
            {t.label}
          </Link>
        );
      })}
    </nav>
  );
}

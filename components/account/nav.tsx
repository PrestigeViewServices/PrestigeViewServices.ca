"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Gift,
  History,
  MessagesSquare,
  UserRound,
  Building2,
  LogOut,
  Users,
  Ticket,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/account", label: "Dashboard", icon: LayoutDashboard },
  { href: "/account/rewards", label: "Points & Rewards", icon: Gift },
  { href: "/account/history", label: "Service History", icon: History },
  { href: "/account/requests", label: "Requests", icon: MessagesSquare },
  { href: "/account/referrals", label: "Refer a Friend", icon: Users },
  { href: "/account/giveaways", label: "Giveaways", icon: Ticket },
  { href: "/account/profile", label: "Profile", icon: UserRound },
  { href: "/account/about", label: "About PVS", icon: Building2 },
];

/**
 * Portal nav: horizontal scroll strip on mobile (most visitors arrive from
 * a Facebook/Instagram link on a phone), sidebar list on desktop.
 */
export function AccountNav({
  firstName,
  isOwner = false,
}: {
  firstName: string;
  isOwner?: boolean;
}) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await fetch("/api/account/login", { method: "DELETE" });
    router.refresh();
  }

  return (
    <nav aria-label="Account">
      <p className="hidden px-3 pb-2 text-sm font-semibold lg:block">
        Hi, {firstName}
      </p>
      <div className="flex gap-1 overflow-x-auto pb-1 lg:flex-col lg:overflow-visible lg:pb-0">
        {items.map((item) => {
          const active =
            item.href === "/account"
              ? pathname === "/account"
              : pathname.startsWith(item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors lg:shrink",
                active
                  ? "bg-primary/15 text-foreground"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{item.label}</span>
            </Link>
          );
        })}
        {isOwner && (
          <a
            href="/admin"
            className="flex shrink-0 items-center gap-2 rounded-lg bg-gradient-primary px-3 py-2 text-sm font-semibold text-white shadow-glow lg:mt-2 lg:shrink"
          >
            <LayoutDashboard className="h-4 w-4" />
            <span className="whitespace-nowrap">Admin Dashboard</span>
          </a>
        )}
        <button
          type="button"
          onClick={signOut}
          className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground lg:mt-2 lg:shrink lg:border-t lg:border-surface-border lg:pt-3"
        >
          <LogOut className="h-4 w-4" />
          <span className="whitespace-nowrap">Sign out</span>
        </button>
      </div>
    </nav>
  );
}

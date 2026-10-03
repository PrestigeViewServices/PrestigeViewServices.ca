"use client";

import { Suspense } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Bell, ChevronRight, ExternalLink, Plus, Search } from "lucide-react";
import { adminBreadcrumb } from "@/components/admin/sidebar";
import { AdminMobileNav } from "@/components/admin/admin-mobile-nav";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { cn } from "@/lib/utils";

const iconBtn =
  "relative grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-white/[0.08] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white";

/**
 * Sticky application top bar: breadcrumb, global lead search, quick
 * "New lead", notification bell, view-site and sign-out. On phones it also
 * carries the hamburger that opens the nav drawer.
 */
export function AdminTopbar({
  unread = 0,
  brand,
}: {
  unread?: number;
  brand?: React.ReactNode;
}) {
  const pathname = usePathname() ?? "/admin";
  const { group, item } = adminBreadcrumb(pathname);

  return (
    <header className="sticky top-0 z-30 border-b border-white/[0.06] bg-[#0A0E18]/90 backdrop-blur-md">
      <div className="mx-auto flex h-14 max-w-[1400px] items-center gap-3 px-4 sm:px-6 lg:px-8">
        <AdminMobileNav unread={unread} brand={brand} />

        <nav
          aria-label="Breadcrumb"
          className="flex min-w-0 flex-1 items-center gap-1.5 text-[13px]"
        >
          <Link
            href="/admin"
            className="hidden shrink-0 text-slate-500 hover:text-slate-300 sm:inline"
          >
            PVS
          </Link>
          {group && (
            <>
              <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-600 sm:block" />
              <span className="hidden shrink-0 text-slate-500 sm:inline">
                {group}
              </span>
            </>
          )}
          <ChevronRight className="hidden h-3.5 w-3.5 shrink-0 text-slate-600 sm:block" />
          <span className="truncate font-semibold text-slate-100">
            {item?.label ?? "Dashboard"}
          </span>
        </nav>

        <Suspense fallback={<SearchBox q="" />}>
          <TopbarSearch />
        </Suspense>
        <Link
          href="/admin/leads"
          className={cn(iconBtn, "md:hidden")}
          aria-label="Search leads"
        >
          <Search className="h-4 w-4" />
        </Link>

        <Link
          href="/admin/leads/new"
          className="inline-flex h-9 shrink-0 items-center gap-1.5 rounded-sm bg-primary px-2.5 text-[13px] font-semibold text-white shadow-sm transition-colors hover:bg-blue-500 sm:px-3"
        >
          <Plus className="h-4 w-4" />
          <span className="hidden sm:inline">New lead</span>
          <span className="sr-only sm:hidden">New lead</span>
        </Link>

        <Link
          href="/admin/notifications"
          className={iconBtn}
          aria-label={
            unread > 0 ? `${unread} unread notifications` : "Notifications"
          }
        >
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute -right-1.5 -top-1.5 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-[#0A0E18] bg-rose-500 px-1 text-[9.5px] font-bold tabular-nums text-white">
              {unread > 99 ? "99+" : unread}
            </span>
          )}
        </Link>

        <Link
          href="/"
          target="_blank"
          className={cn(iconBtn, "hidden sm:grid")}
          title="View public site"
          aria-label="View public site (new tab)"
        >
          <ExternalLink className="h-4 w-4" />
        </Link>

        <div className="hidden sm:block">
          <AdminLogoutButton compact />
        </div>
      </div>
    </header>
  );
}

/** Keeps the box filled with the active query while on the leads inbox. */
function TopbarSearch() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const q = pathname === "/admin/leads" ? (searchParams?.get("q") ?? "") : "";
  return <SearchBox q={q} />;
}

function SearchBox({ q }: { q: string }) {
  return (
    <form
      action="/admin/leads"
      method="GET"
      role="search"
      className="relative hidden md:block"
    >
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
      <input
        key={q}
        type="search"
        name="q"
        defaultValue={q}
        placeholder="Search leads: name, phone, address"
        aria-label="Search leads"
        className="h-9 w-60 rounded-sm border border-white/[0.08] bg-white/[0.03] pl-8 pr-3 text-[13px] text-slate-100 placeholder:text-slate-500 focus:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/25 lg:w-72"
      />
    </form>
  );
}

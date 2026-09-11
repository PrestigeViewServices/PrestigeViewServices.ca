"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { AdminSidebar, activeAdminItem } from "@/components/admin/sidebar";

/**
 * Phone-sized admin navigation. Below the `lg` breakpoint the layout used to
 * stack the full 25-link sidebar ABOVE the page, so the owner scrolled past
 * every link on every page before reaching a single lead. Now a slim bar
 * shows where you are and opens the same sidebar in a drawer.
 */
export function AdminMobileNav({ unread = 0 }: { unread?: number }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const current = activeAdminItem(pathname);

  // Navigating inside the drawer closes it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <div className="sticky top-[4.25rem] z-30 flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface/85 px-3 py-2 backdrop-blur-md lg:hidden">
      <div className="flex min-w-0 items-center gap-2">
        {current && <current.icon className="h-4 w-4 shrink-0 text-primary" />}
        <span className="truncate text-sm font-semibold">
          {current?.label ?? "PVS Admin"}
        </span>
      </div>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <button
            type="button"
            className="relative inline-flex shrink-0 items-center gap-1.5 rounded-full border border-surface-border px-3 py-1.5 text-sm font-medium transition-colors hover:border-white/15 hover:bg-white/5"
            aria-label="Open admin menu"
          >
            <Menu className="h-4 w-4" />
            Menu
            {unread > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-primary px-1 text-[9px] font-bold text-white">
                {unread > 99 ? "99+" : unread}
              </span>
            )}
          </button>
        </SheetTrigger>
        <SheetContent side="left" className="w-[85vw] max-w-xs overflow-y-auto p-0">
          <SheetHeader className="border-b border-surface-border py-4">
            <SheetTitle className="text-base">PVS Admin</SheetTitle>
          </SheetHeader>
          <div className="p-4">
            <AdminSidebar unread={unread} />
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}

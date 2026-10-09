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
import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminLogoutButton } from "@/components/admin/logout-button";

/**
 * Phone/tablet navigation (below `lg`). The top bar shows a hamburger that
 * opens the same nav list as the desktop sidebar in a left drawer, so the
 * owner never scrolls past 25 links to reach a lead. `brand` is the server-
 * rendered wordmark, passed in so the drawer header matches the sidebar.
 */
export function AdminMobileNav({
  unread = 0,
  brand,
}: {
  unread?: number;
  brand?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  // Navigating inside the drawer closes it.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          className="relative grid h-9 w-9 shrink-0 place-items-center rounded-sm border border-white/[0.08] text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white lg:hidden"
          aria-label="Open admin menu"
        >
          <Menu className="h-[18px] w-[18px]" />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full border-2 border-[#0A0E18] bg-primary" />
          )}
        </button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-[85vw] max-w-[288px] flex-col gap-0 border-r border-white/[0.06] bg-[#070A12] p-0"
      >
        <SheetHeader className="space-y-0 border-b border-white/[0.06] px-4 py-3.5 text-left">
          <SheetTitle className="sr-only">PVS Operations menu</SheetTitle>
          {brand}
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-2 py-4">
          <AdminSidebar unread={unread} />
        </div>
        <div className="border-t border-white/[0.06] p-2">
          <AdminLogoutButton />
        </div>
      </SheetContent>
    </Sheet>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Ends the owner session. `compact` renders an icon-only button for the
 * top bar; the default is a full-width row for the sidebar footer.
 */
export function AdminLogoutButton({ compact = false }: { compact?: boolean }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/login", { method: "DELETE" });
    router.refresh();
  }
  return (
    <button
      type="button"
      onClick={logout}
      title="Sign out"
      aria-label={compact ? "Sign out" : undefined}
      className={cn(
        "flex items-center gap-2.5 text-slate-400 transition-colors hover:text-white",
        compact
          ? "h-9 w-9 justify-center rounded-sm border border-white/[0.08] hover:bg-white/[0.06]"
          : "w-full rounded-sm px-3 py-2 text-[13px] font-medium hover:bg-white/[0.04]",
      )}
    >
      <LogOut className="h-4 w-4" />
      {!compact && "Sign out"}
    </button>
  );
}

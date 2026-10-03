"use client";

import { usePathname } from "next/navigation";

/**
 * True for routes that render their own application shell instead of the
 * public marketing chrome. The owner's dashboard (/admin) is a standalone
 * app: no marketing header, footer, offer modal, sticky CTA or ambience.
 */
export function isAppShellPath(pathname: string | null | undefined): boolean {
  const p = pathname ?? "/";
  return p === "/admin" || p.startsWith("/admin/");
}

/**
 * Renders its children only on public pages. Server components (e.g. the
 * Footer) are passed in as children, so they stay server-rendered; this
 * client wrapper only decides whether to show them.
 */
export function HideOnAdmin({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (isAppShellPath(pathname)) return null;
  return <>{children}</>;
}

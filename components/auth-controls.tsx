"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

/**
 * Renders only when Clerk is configured (publishable key is exposed to the
 * client via NEXT_PUBLIC_*). The marketing site is fully usable without
 * Clerk; we simply hide this UI in that mode.
 */
export function AuthControls({ compact = false }: { compact?: boolean }) {
  const configured = !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  if (!configured) return null;

  return (
    <div className="flex items-center gap-2">
      <SignedOut>
        <Link
          href="/sign-in"
          className={
            compact
              ? "text-[11px] uppercase tracking-wider text-muted-foreground/80 hover:text-muted-foreground transition-colors"
              : "text-sm font-medium text-foreground/90 hover:text-foreground rounded-full px-3 py-1.5 hover:bg-surface transition-colors"
          }
        >
          Sign in
        </Link>
      </SignedOut>
      <SignedIn>
        <UserButton
          afterSignOutUrl="/"
          appearance={{
            elements: {
              userButtonAvatarBox: { width: "32px", height: "32px" },
            },
          }}
        />
      </SignedIn>
    </div>
  );
}

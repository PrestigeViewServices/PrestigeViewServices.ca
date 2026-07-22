"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";

/**
 * Header sign-in / user button. Renders the Clerk widget when signed in,
 * a "Sign in" link to /sign-in when signed out.
 *
 * Skipped when no NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY, without ClerkProvider
 * mounted, the SignedIn/SignedOut components would crash at runtime.
 */
export function AuthControls({ compact = false }: { compact?: boolean }) {
  if (!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY) return null;

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

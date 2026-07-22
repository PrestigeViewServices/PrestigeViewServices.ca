import { redirect } from "next/navigation";
import { auth, currentUser, clerkClient } from "@clerk/nextjs/server";
import { isClerkConfigured } from "@/lib/auth";
import {
  homePathForRole,
  isUltimateAdminEmail,
  parseRole,
  type Role,
} from "@/lib/roles";

export const metadata = {
  title: "Signing you in…",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Central role-router after Clerk sign-in / sign-up. The user is
 * server-side redirected to /admin, /portal, or /account based on their
 * role.
 *
 * **JIT role assignment.** If the user's primary email is on
 * `ULTIMATE_ADMIN_EMAILS`, we promote them to `ultimate_admin` on first
 * arrival. That removes the dependency on the Clerk webhook for the
 * happy path, the webhook still does the same thing in the background
 * once it's configured.
 *
 * Users cannot self-select a portal. Clerk's after-sign-in URL points
 * here, and the role decides the destination.
 */
export default async function PostSignInPage() {
  if (!isClerkConfigured()) redirect("/");
  const { userId } = await auth();
  if (!userId) redirect("/sign-in");

  const user = await currentUser();
  if (!user) redirect("/sign-in");

  const email = user.primaryEmailAddress?.emailAddress ?? "";
  let role: Role =
    parseRole((user.publicMetadata as { role?: unknown } | null)?.role) ??
    "customer";

  if (isUltimateAdminEmail(email) && role !== "ultimate_admin") {
    try {
      const client = await clerkClient();
      await client.users.updateUserMetadata(userId, {
        publicMetadata: { role: "ultimate_admin" },
      });
      role = "ultimate_admin";
    } catch (err) {
      // eslint-disable-next-line no-console
      console.error("[post-sign-in] role assignment failed", err);
    }
  }

  redirect(homePathForRole(role));
}

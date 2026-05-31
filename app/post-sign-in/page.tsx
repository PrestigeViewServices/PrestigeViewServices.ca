import { redirect } from "next/navigation";
import { getSession, isClerkConfigured } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";

export const metadata = {
  title: "Signing you in…",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

/**
 * Central role-based redirect after Clerk sign-in or sign-up.
 *
 * Clerk's NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL + NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL
 * point here. The middleware also bounces wrong-role visitors here.
 * From here, the user is server-side redirected to /admin, /portal, or /account
 * based on the role in their Clerk session claims.
 *
 * Users cannot self-select a portal — they only ever land on the one their
 * role allows.
 */
export default async function PostSignInPage() {
  if (!isClerkConfigured()) redirect("/");
  const session = await getSession();
  if (!session) redirect("/sign-in");
  redirect(homePathForRole(session.role));
}

import { redirect } from "next/navigation";

/**
 * Legacy auth route from the Clerk era. All sign-in is in-house now:
 * customers at /account, staff at /admin. Old links land on the portal.
 */
export default function LegacyAuthRedirect() {
  redirect("/account");
}

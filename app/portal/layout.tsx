import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { isAdminLike } from "@/lib/roles";

export const metadata = {
  title: "Employee Portal",
  robots: { index: false, follow: false },
};

/**
 * Crew portal — currently accessible to the OWNER's internal session only.
 * Clerk has been removed site-wide; when per-employee logins are needed,
 * they'll be built in-house on the same pattern as the member auth
 * (lib/customer-auth.ts). Everyone else lands on the customer portal.
 */
export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();
  if (!session || !isAdminLike(session.role)) redirect("/account");

  return (
    <section className="container-max py-10 sm:py-12">{children}</section>
  );
}

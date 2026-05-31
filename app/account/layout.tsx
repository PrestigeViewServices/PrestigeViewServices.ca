import { redirect } from "next/navigation";
import { getSession, isClerkConfigured } from "@/lib/auth";
import { homePathForRole } from "@/lib/roles";
import { NotConfigured } from "@/components/admin/not-configured";

export const metadata = {
  title: "My Account",
  robots: { index: false, follow: false },
};

const ACCOUNT_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return (
      <section className="container-max py-16">
        <NotConfigured
          service="Clerk"
          reason="The customer account area is gated by Clerk. Open SETUP.md for the click-by-click setup."
          envVars={ACCOUNT_ENV_VARS}
          missing={ACCOUNT_ENV_VARS.filter((k) => !process.env[k])}
        />
      </section>
    );
  }

  const session = await getSession();
  if (!session) redirect("/sign-in");

  // Customers only. Any other role gets sent to their proper landing.
  if (session.role !== "customer") {
    redirect(homePathForRole(session.role));
  }

  return (
    <section className="container-max py-10 sm:py-12">{children}</section>
  );
}

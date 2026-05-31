import { redirect } from "next/navigation";
import { getSession, isClerkConfigured } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";

export const metadata = {
  title: "Employee Portal",
  robots: { index: false, follow: false },
};

const PORTAL_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
];

export default async function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return (
      <section className="container-max py-16">
        <NotConfigured
          service="Clerk"
          reason="The employee portal is gated by Clerk. Open SETUP.md for the click-by-click setup."
          envVars={PORTAL_ENV_VARS}
          missing={PORTAL_ENV_VARS.filter((k) => !process.env[k])}
        />
      </section>
    );
  }

  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (session.role !== "employee") redirect("/post-sign-in");

  return <section className="container-max py-10 sm:py-12">{children}</section>;
}

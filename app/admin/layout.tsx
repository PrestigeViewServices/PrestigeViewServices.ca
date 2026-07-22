import { redirect } from "next/navigation";
import { getSession, isClerkConfigured } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/sidebar";
import { NotConfigured } from "@/components/admin/not-configured";
import { isAdminLike } from "@/lib/roles";

const ADMIN_ENV_VARS = [
  "NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY",
  "CLERK_SECRET_KEY",
  "CLERK_WEBHOOK_SECRET",
  "ULTIMATE_ADMIN_EMAILS",
];

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isClerkConfigured()) {
    return (
      <section className="container-max py-16">
        <NotConfigured
          service="Clerk"
          reason="Admin authentication is provided by Clerk. Open SETUP.md for the click-by-click setup, about 10 minutes."
          envVars={ADMIN_ENV_VARS}
          missing={ADMIN_ENV_VARS.filter((k) => !process.env[k])}
          docHref="https://clerk.com/docs/quickstarts/nextjs"
        />
      </section>
    );
  }

  const session = await getSession();
  if (!session) redirect("/sign-in");
  if (!isAdminLike(session.role)) redirect("/post-sign-in");

  return (
    <section className="container-max py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start surface-card p-4">
          <AdminSidebar role={session.role} />
        </aside>
        <div>{children}</div>
      </div>
    </section>
  );
}

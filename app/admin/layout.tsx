import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminLoginForm } from "@/components/admin/login-form";
import { hasAdminSession, isAdminAuthConfigured } from "@/lib/admin-session";

export const metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Internal admin shell. Auth is fully in-house: one owner password
 * (ADMIN_PASSWORD) and a signed session cookie, no external auth service.
 * Signed-out visitors see the login screen on any /admin URL; the URL is
 * preserved so a successful login lands exactly where they were headed.
 */
export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isAdminAuthConfigured()) {
    return (
      <section className="container-max py-16">
        <div className="mx-auto max-w-lg surface-card p-8 text-center">
          <h1 className="text-xl font-bold">Admin password not set</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            The dashboard is locked until an owner password exists. Add{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
              ADMIN_PASSWORD=your-strong-password
            </code>{" "}
            to <code className="rounded bg-surface px-1.5 py-0.5 text-xs">.env.local</code>{" "}
            (and to the Vercel project&apos;s environment variables for the
            live site), then reload this page.
          </p>
        </div>
      </section>
    );
  }

  const signedIn = await hasAdminSession();
  if (!signedIn) {
    return (
      <section className="container-max flex min-h-[70vh] items-center py-16">
        <AdminLoginForm />
      </section>
    );
  }

  return (
    <section className="container-max py-10 sm:py-12">
      <div className="grid gap-8 lg:grid-cols-[230px_1fr]">
        <aside className="lg:sticky lg:top-24 lg:self-start surface-card p-4">
          <AdminSidebar />
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

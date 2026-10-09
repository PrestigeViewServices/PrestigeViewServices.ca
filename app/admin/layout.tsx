import { AdminSidebar } from "@/components/admin/sidebar";
import { AdminTopbar } from "@/components/admin/topbar";
import { AdminBrand } from "@/components/admin/brand";
import { AdminLogoutButton } from "@/components/admin/logout-button";
import { AdminLoginForm } from "@/components/admin/login-form";
import {
  adminAuthDiagnostics,
  hasAdminSession,
  isAdminAuthConfigured,
} from "@/lib/admin-session";
import { unreadNotificationCount } from "@/lib/admin-notifications";
import { getMember } from "@/lib/customer-auth";
import { isAdminEmail } from "@/lib/admin-credentials";

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
      <AuthScreen>
        <div className="w-full max-w-lg rounded-xl border border-white/[0.08] bg-[#0E1322] p-8 text-center">
          <h1 className="text-xl font-bold">Admin password not set</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            The dashboard is locked until an owner password exists. Add{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
              ADMIN_PASSWORD=your-strong-password
            </code>{" "}
            to{" "}
            <code className="rounded bg-surface px-1.5 py-0.5 text-xs">
              .env.local
            </code>{" "}
            (and to the Vercel project&apos;s environment variables for the live
            site), then reload this page.
          </p>
        </div>
      </AuthScreen>
    );
  }

  const signedIn = await hasAdminSession();
  if (!signedIn) {
    // The owner usually arrives here already signed in to the club portal.
    // When that member's email is a dashboard login, pre-fill it so the
    // only thing left to type is the dashboard password.
    const member = await getMember().catch(() => null);
    const knownEmail =
      member && (await isAdminEmail(member.email)) ? member.email : null;
    return (
      <AuthScreen>
        <AdminLoginForm
          diagnostics={adminAuthDiagnostics()}
          initialEmail={knownEmail}
        />
      </AuthScreen>
    );
  }

  const unread = await unreadNotificationCount();

  // Standalone app shell (the public header/footer are hidden on /admin by
  // components/site-chrome.tsx). Desktop: fixed 256px sidebar + sticky top
  // bar. Below `lg`: top bar with a hamburger that opens the nav drawer.
  return (
    <div className="relative isolate min-h-screen bg-[#0A0E18] text-slate-200">
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col border-r border-white/[0.06] bg-[#070A12] lg:flex">
        <div className="flex h-14 shrink-0 items-center border-b border-white/[0.06] px-4">
          <AdminBrand />
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-4 [scrollbar-width:thin]">
          <AdminSidebar unread={unread} />
        </div>
        <div className="shrink-0 border-t border-white/[0.06] p-2">
          <div className="flex items-center gap-2.5 px-3 py-2">
            <span className="grid h-7 w-7 place-items-center rounded-full bg-primary/20 text-[11px] font-bold text-primary">
              PV
            </span>
            <span className="min-w-0 leading-tight">
              <span className="block truncate text-[12.5px] font-medium text-slate-200">
                Owner
              </span>
              <span className="block text-[11px] text-slate-500">
                Full access
              </span>
            </span>
          </div>
          <AdminLogoutButton />
        </div>
      </aside>

      <div className="flex min-h-screen flex-col lg:pl-64">
        <AdminTopbar unread={unread} brand={<AdminBrand />} />
        <div className="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 sm:px-6 sm:py-6 lg:px-8 lg:py-8">
          {children}
        </div>
      </div>
    </div>
  );
}

/** Full-screen centered frame for the login + "not configured" screens. */
function AuthScreen({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center gap-8 bg-[#0A0E18] px-4 py-16">
      <AdminBrand />
      {children}
      <p className="text-[11px] text-slate-600">
        Internal system. Authorized Prestige View Services staff only.
      </p>
    </div>
  );
}

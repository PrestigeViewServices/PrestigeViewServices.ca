import { Sparkles } from "lucide-react";
import { getMember, isCustomerAuthConfigured } from "@/lib/customer-auth";
import { AccountAuth } from "@/components/account/auth-form";
import { AccountNav } from "@/components/account/nav";
import { CLUB_NAME, CLUB_TAGLINE } from "@/lib/loyalty";
import { siteConfig } from "@/lib/site";

export const metadata = {
  title: "My Account · The Prestige Club",
  robots: { index: false, follow: false },
};

/**
 * Prestige Club portal shell. Auth is fully in-house (email + password,
 * signed member cookie — lib/customer-auth.ts). Signed-out visitors see the
 * sign-in / create-account screen on any /account URL, so deep links
 * survive the login.
 */
export default async function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!isCustomerAuthConfigured()) {
    return (
      <section className="container-max py-16">
        <div className="mx-auto max-w-lg surface-card p-8 text-center">
          <h1 className="text-xl font-bold">Accounts aren&apos;t open yet</h1>
          <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
            The customer portal needs a session secret
            (CUSTOMER_SESSION_SECRET) before accounts can be created. In the
            meantime, call us at {siteConfig.phoneDisplay}, we&apos;re happy to
            help directly.
          </p>
        </div>
      </section>
    );
  }

  const member = await getMember();

  if (!member) {
    return (
      <section className="container-max flex min-h-[70vh] flex-col items-center justify-center py-12">
        <div className="mb-8 text-center">
          <p className="eyebrow text-primary justify-center">
            <Sparkles className="h-3.5 w-3.5" />
            {CLUB_NAME}
          </p>
          <h1 className="heading-section mt-2 text-balance">
            Quality you can see.
            <br />
            <span className="text-gradient">Rewards you can feel.</span>
          </h1>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground">
            Earn points on every visit, unlock member perks, and keep your
            whole property handled in one place. Free to join.
          </p>
        </div>
        <AccountAuth />
      </section>
    );
  }

  return (
    <section className="container-max py-8 sm:py-12">
      <div className="grid gap-6 lg:grid-cols-[230px_1fr] lg:gap-8">
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="surface-card p-3 lg:p-4">
            <p className="hidden px-3 pb-2 text-[11px] uppercase tracking-wider text-muted-foreground lg:block">
              {CLUB_TAGLINE}
            </p>
            <AccountNav firstName={member.firstName} />
          </div>
        </aside>
        <div className="min-w-0">{children}</div>
      </div>
    </section>
  );
}

import { Star, Sparkles, AlertTriangle } from "lucide-react";
import { requireRole, isClerkConfigured } from "@/lib/auth";

export const dynamic = "force-dynamic";

// =============================================================================
// PHASE 2 — Loyalty / Subscriptions
// =============================================================================
// TODO: integrate Stripe for subscription/loyalty billing (pending confirmation
// of paid-membership vs points-based program).
//
// When the program model is locked in:
//   - Add `Subscription` + `LoyaltyAccount` Prisma models
//   - Wire Stripe Checkout for paid memberships, or a points ledger model
//   - Render plan summary, MRR, churn, top loyalty members on this page
//   - Add webhook handler at /api/stripe/webhook for subscription events
//
// Do NOT build billing logic here in Phase 1. We render a clear placeholder
// so admins can see the planned surface but can't act on it yet.
// =============================================================================

export default async function LoyaltyPage() {
  await requireRole(["ultimate_admin", "admin"]);

  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-primary">Phase 2 · Coming Soon</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          Loyalty &amp; Subscriptions
        </h1>
        <p className="mt-1.5 text-muted-foreground">
          Recurring memberships and customer rewards live here once the
          program model and billing provider are locked in.
        </p>
      </header>

      <div className="rounded-2xl border border-yellow-500/30 bg-yellow-500/5 p-5 flex items-start gap-3">
        <AlertTriangle className="h-5 w-5 text-yellow-300 mt-0.5 shrink-0" />
        <div className="text-sm text-yellow-100/90">
          <p className="font-semibold">Not yet wired</p>
          <p className="mt-1 text-yellow-200/80">
            Stripe integration is deferred until the team confirms whether the
            program is paid-membership or points-based. No billing logic runs
            from this page in Phase 1.
          </p>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <PlaceholderCard
          icon={<Star className="h-5 w-5" />}
          title="Membership tiers"
          body="Plan summary, monthly recurring revenue, churn rate."
          note="Stripe — Phase 2"
        />
        <PlaceholderCard
          icon={<Sparkles className="h-5 w-5" />}
          title="Loyalty points"
          body="Points ledger, top earners, redemption history."
          note="Custom ledger or LoyaltyLion — Phase 2"
        />
      </div>

      <div className="surface-card p-6 text-sm text-muted-foreground">
        <p className="font-semibold text-foreground">Phase 2 checklist</p>
        <ul className="mt-3 space-y-1.5 list-disc list-inside marker:text-primary">
          <li>Confirm program model: paid subscription vs points-based</li>
          <li>Add <code className="text-foreground/90">Subscription</code> / <code className="text-foreground/90">LoyaltyAccount</code> Prisma models</li>
          <li>Wire Stripe Checkout (subscriptions) or build a points ledger</li>
          <li>Add <code className="text-foreground/90">/api/stripe/webhook</code> for subscription events</li>
          <li>Replace this page with MRR + cohort + redemption views</li>
        </ul>
      </div>
    </div>
  );
}

function PlaceholderCard({
  icon,
  title,
  body,
  note,
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
  note: string;
}) {
  if (!isClerkConfigured()) return null;
  return (
    <div className="surface-card p-6 opacity-90">
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
        {icon}
      </div>
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
        {body}
      </p>
      <p className="mt-4 text-xs uppercase tracking-wider text-muted-foreground/70">
        {note}
      </p>
    </div>
  );
}

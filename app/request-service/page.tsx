import type { Metadata } from "next";
import { Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import { LeadForm } from "@/components/lead-form";
import { SectionHeading } from "@/components/section-heading";
import { ReferralWelcomeBanner } from "@/components/referral-welcome-banner";
import { getDb } from "@/lib/db";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request Service, Lawn, Window & Snow Care",
  description:
    "Tell us about your property and the service you need. We respond within one business day with a transparent quote, no obligation.",
  alternates: { canonical: "/request-service" },
};

/**
 * Native lead-capture page. Submissions land directly in the PVS pipeline
 * (no third-party embed). Distinct from /quote, which keeps the Aurora form.
 *
 * This is also where /r/[code] referral links land, because /api/leads is
 * what turns a referral cookie into a tracked Referral.
 */
export default async function RequestServicePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; from?: string; service?: string }>;
}) {
  const { ref, from, service } = await searchParams;
  const settings = await getClubSettingsSafe(getDb());
  const offer = accountOffer(settings);
  return (
    <section className="container-max pt-14 sm:pt-20 pb-20">
      <SectionHeading
        eyebrow="Free · No Obligation"
        title="Request Service"
        description="Fully insured. Local to the Ottawa Valley. We respond within one business day, no pressure, no surprise fees."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-5">
          <ReferralWelcomeBanner code={ref} from={from} />
          <LeadForm
            service={service ?? null}
            referralCode={ref ?? null}
            accountDiscountLabel={offer.enabled ? offer.label : null}
            referralCredit={formatCents(settings.referralFriendCents)}
          />
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Prefer to talk?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Skip the form, call or email us directly.
            </p>
            <ul className="mt-5 space-y-3 text-sm">
              <li className="flex items-center gap-3">
                <Phone className="h-4 w-4 text-primary" />
                <a
                  href={`tel:${formatPhone(siteConfig.phone)}`}
                  className="font-medium hover:underline"
                >
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="h-4 w-4 text-primary" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="font-medium hover:underline"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-center gap-3 text-muted-foreground">
                <Clock className="h-4 w-4 text-primary" />
                {siteConfig.hours}
              </li>
            </ul>
          </div>

          <div className="surface-card p-6">
            <div className="flex items-start gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400 shrink-0">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold">What happens next</h3>
                <ol className="mt-2 space-y-1.5 text-sm text-muted-foreground list-decimal list-inside marker:text-primary">
                  <li>Your request lands in our queue instantly.</li>
                  <li>A team lead calls or emails to confirm scope and timing.</li>
                  <li>You get a clear, written quote, no surprise fees.</li>
                </ol>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

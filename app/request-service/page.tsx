import type { Metadata } from "next";
import { Phone, Mail, Clock, ShieldCheck } from "lucide-react";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { QuotePhoto } from "@/components/quote-photo";
import { SamTip } from "@/components/sam";
import { SectionHeading } from "@/components/section-heading";
import { ReferralWelcomeBanner } from "@/components/referral-welcome-banner";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Request Service, Lawn, Window & Snow Care",
  description:
    "Tell us about your property and the service you need. We respond within one business day with a transparent quote, no obligation.",
  alternates: { canonical: "/request-service" },
};

/**
 * Lead-capture page using the Aurora Suite form, same as /quote.
 *
 * /r/[code] referral links still land here and show the welcome banner,
 * but the Aurora form cannot read the referral cookie, so the office
 * matches the referral by the friend's name.
 */
export default async function RequestServicePage({
  searchParams,
}: {
  searchParams: Promise<{ ref?: string; from?: string }>;
}) {
  const { ref, from } = await searchParams;
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
          <AuroraLeadForm />
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <QuotePhoto
            src="/images/gallery/snow-removal/tractor-snowblowing-sunrise-residential.webp"
            alt="PVS tractor snow-blowing a Petawawa driveway at sunrise"
            caption="Local crews, fully insured."
            className="hidden lg:block"
          />
          <SamTip pose="hero" eyebrow="Sam's booking tip">
            Bundling saves you money. Add gutter cleaning or a snow pass to
            your request and we price everything together in one quote.
          </SamTip>
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
              <li className="flex items-start gap-3 text-muted-foreground">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <span>
                  {siteConfig.hours}
                  <span className="mt-0.5 block text-xs opacity-80">
                    {siteConfig.hoursNote}
                  </span>
                </span>
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

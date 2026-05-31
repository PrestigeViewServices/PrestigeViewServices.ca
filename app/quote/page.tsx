import type { Metadata } from "next";
import { Phone, Mail, Clock, ShieldCheck, Sparkles } from "lucide-react";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Get a Free Quote — Lawn, Window, Snow Services",
  description:
    "Tell us about your property and the service you need. We'll respond within one business day with a transparent quote — no obligation.",
  alternates: { canonical: "/quote" },
};

// Popular service combos surfaced as a hint below the form. Aurora controls
// the form's service field, so this is text-only — mention add-ons in the
// form's notes field and the team will price them together.
const popularBundles = [
  "Lawn Mowing + Window Cleaning",
  "Spring Cleanup + Gutter Cleaning",
  "Window Cleaning + Pressure Washing",
  "Lawn Mowing + Seasonal Snow Contract",
];

export default function QuotePage() {
  return (
    <section className="container-max pt-14 sm:pt-20 pb-20">
      <SectionHeading
        eyebrow="Free · No Obligation"
        title="Request a Quote"
        description="Fully insured. Local to the Ottawa Valley. We respond within one business day — no pressure, no surprise fees."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-6">
          <AuroraLeadForm />

          <aside
            aria-label="Popular service combinations"
            className="mx-auto w-full max-w-[750px] rounded-2xl border border-primary/25 bg-primary/5 p-5"
          >
            <p className="eyebrow text-primary mb-2">
              <Sparkles className="h-3.5 w-3.5" />
              Customers often add
            </p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Bundle two or more services for better recurring rates.
              Popular pairings:
            </p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {popularBundles.map((b) => (
                <li
                  key={b}
                  className="text-xs rounded-full border border-surface-border bg-surface/70 px-3 py-1.5 text-foreground/90"
                >
                  {b}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-xs text-muted-foreground">
              Add any extras in the form's notes — we'll price them together.
            </p>
          </aside>
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Prefer to talk?</h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              Skip the form — call or email us directly.
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
                  <li>We review your request within one business day.</li>
                  <li>
                    A team lead calls or emails to confirm scope and timing.
                  </li>
                  <li>You get a clear, written quote — no surprise fees.</li>
                </ol>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </section>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Gift,
  Phone,
  Smartphone,
  Snowflake,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SnowCrossSell } from "@/components/winter/snow-cross-sell";
import { LEAD_SERVICES } from "@/lib/lead-schema";
import { getDb } from "@/lib/db";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Request Received",
  description: "Your quote request is in. Here is what happens next.",
  robots: { index: false, follow: false },
};

/**
 * Post-submission page. The request is already saved and the office already
 * notified; this page's whole job is the next step: get the customer into
 * their Aurora portal account, and put the referral program in front of
 * them while they are warm.
 */
export default async function ThankYouPage({
  searchParams,
}: {
  searchParams: Promise<{ service?: string; bundle?: string }>;
}) {
  const { service, bundle } = await searchParams;
  const serviceLabel =
    LEAD_SERVICES.find((s) => s.value === service)?.label ?? null;
  const bundledSnow = bundle === "snow";
  const snowRelated = service === "snow-removal" || bundledSnow;

  const settings = await getClubSettingsSafe(getDb());
  const offer = accountOffer(settings);

  return (
    <>
      <section className="container-max pt-14 sm:pt-20">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
            <CheckCircle2 className="h-8 w-8" aria-hidden />
          </div>
          <h1 className="heading-section mt-6 text-balance">
            Your request is in
          </h1>
          <p className="mx-auto mt-4 max-w-lg text-base leading-relaxed text-muted-foreground">
            {serviceLabel ? (
              <>
                We have your <strong className="text-foreground">{serviceLabel}</strong>
                {bundledSnow ? (
                  <>
                    {" "}
                    request <strong className="text-foreground">with seasonal snow removal</strong>
                  </>
                ) : (
                  " request"
                )}{" "}
                and a team lead will reach out within one business day.
              </>
            ) : (
              "We have your request and a team lead will reach out within one business day."
            )}
          </p>
        </div>
      </section>

      <section className="container-max py-10">
        <div className="mx-auto grid max-w-3xl gap-5 sm:grid-cols-2">
          {/* ── Portal push, the primary next step ── */}
          <div className="surface-card flex flex-col p-6 sm:col-span-2 sm:flex-row sm:items-center sm:gap-6">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
              <Smartphone className="h-6 w-6" aria-hidden />
            </div>
            <div className="mt-4 min-w-0 flex-1 sm:mt-0">
              <h2 className="text-lg font-bold">
                Next step: create your Aurora portal account
              </h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                Sign up with the same email as your request and your quote,
                service history, and{" "}
                {snowRelated ? "storm alerts" : "visit records"} will be
                waiting in it.
                {offer.enabled
                  ? ` Account holders also save ${offer.label} on this service.`
                  : ""}
              </p>
            </div>
            <Button asChild size="lg" className="mt-4 shrink-0 sm:mt-0">
              <Link href="/account">
                Create my free account
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
          </div>

          {/* ── Referral prompt ── */}
          <div className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                <Gift className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="text-base font-bold">Know a neighbour?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Refer a friend and you both come out ahead: they get a credit on
              their first service and you earn points toward yours.
            </p>
            <Link
              href="/refer"
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              See the referral program
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </div>

          {/* ── Talk to us ── */}
          <div className="surface-card p-6">
            <div className="flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
                <Phone className="h-5 w-5" aria-hidden />
              </span>
              <h2 className="text-base font-bold">Need it sooner?</h2>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
              Call or text and mention you just sent a request. {siteConfig.hours}.
            </p>
            <a
              href={`tel:${formatPhone(siteConfig.phone)}`}
              className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
            >
              {siteConfig.phoneDisplay}
            </a>
          </div>
        </div>
      </section>

      {/* ── Winter cross-sell for anyone who did not just ask for snow ── */}
      {!snowRelated && <SnowCrossSell source="thank-you" />}

      {snowRelated && (
        <section className="container-max pb-14">
          <p className="mx-auto flex max-w-2xl items-start justify-center gap-2 text-center text-sm text-muted-foreground">
            <Snowflake className="mt-0.5 h-4 w-4 shrink-0 text-sky-300" aria-hidden />
            Winter routes are confirmed in the order requests arrive. We will
            confirm your route spot when we call.
          </p>
        </section>
      )}
    </>
  );
}

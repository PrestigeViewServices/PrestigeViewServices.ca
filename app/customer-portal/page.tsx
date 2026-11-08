import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BellRing,
  Camera,
  Check,
  LogIn,
  Crown,
  History,
  Minus,
  Radar,
  Receipt,
  Send,
  ShieldCheck,
  Smartphone,
  Sparkles,
  UserCheck,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { FaqSection } from "@/components/faq-section";
import { ServiceAmbience } from "@/components/service-ambience";
import { PhoneMockup } from "@/components/winter/portal-showcase";
import {
  DRIVEWAY_TIERS,
  PORTAL_FEATURES,
  PORTAL_LOGIN_URL,
  getDrivewayTier,
  portalTierLabel,
} from "@/lib/content/winter-packages";

/**
 * Public landing page for the Aurora customer portal. Every feature claim and
 * tier gate comes from PORTAL_FEATURES in lib/content/winter-packages.ts, so
 * this page, the /winter-packages showcase and the comparison table can never
 * disagree. Edit claims there, not here.
 */

export const metadata: Metadata = {
  title: "Customer Portal | Track Your Snow Removal Live",
  description:
    "Every Silver, Gold and Platinum snow pass includes a private Aurora customer portal: live storm map, driveway-cleared alerts, photo proof of every visit, and billing in one place.",
  alternates: { canonical: "/customer-portal" },
  openGraph: {
    title: "Customer Portal | Prestige View Services",
    description:
      "Watch the tractor head to your driveway, get a cleared alert, and see the photo that proves it.",
    url: "/customer-portal",
    type: "website",
  },
};

const FEATURE_ICONS: Record<string, LucideIcon> = {
  "live-map": Radar,
  "cleared-alerts": BellRing,
  "photo-proof": Camera,
  "visit-history": History,
  "one-tap-requests": Send,
  billing: Receipt,
  "priority-line": Crown,
};

const WHO_FOR = [
  {
    title: "Early commuters",
    body: "Check that the driveway is open before you put your boots on.",
  },
  {
    title: "Deployed or away",
    body: "Serving, travelling, or snowbirding? See every visit from anywhere.",
  },
  {
    title: "Landlords & rentals",
    body: "Photo-stamped visit records for tenants, insurers, and peace of mind.",
  },
];

const STEPS = [
  {
    icon: ShieldCheck,
    title: "Pick Silver, Gold or Platinum",
    body: "Every pass from Silver up includes the portal at no extra cost.",
  },
  {
    icon: UserCheck,
    title: "We set it up for you",
    body: "When we confirm your route spot, we create your portal account and send you the login.",
  },
  {
    icon: Smartphone,
    title: "Open it on your phone",
    body: "Works in any phone or computer browser. Nothing to install.",
  },
];

const FAQS = [
  {
    q: "Which passes include the customer portal?",
    a: "Silver, Gold and Platinum seasonal passes all include it at no extra cost. Silver gets the live storm map and billing. Gold and Platinum unlock the full experience: cleared alerts, photo proof, visit history and one-tap requests. Bronze passes do not include portal access.",
  },
  {
    q: "Do I need to download an app?",
    a: "No. The portal runs in your phone or computer browser. Save it to your home screen and it opens like an app.",
  },
  {
    q: "How is this different from the public live map?",
    a: "The public live map shows the whole fleet. Your portal is private to your property: it shows your route, tells you when your driveway is done, and keeps a record of every visit.",
  },
  {
    q: "How do I get my login?",
    a: "We set up your portal account when we confirm your route spot and send you the login details. Sign in any time with the Customer login button on this page. Missing your details? Call or text us and we will resend them.",
  },
  {
    q: "Can I upgrade my pass to get more portal features?",
    a: "Yes. Contact us and we will move you up a tier, and the extra portal features switch on with it.",
  },
];

export default function CustomerPortalPage() {
  return (
    <>
      <ServiceAmbience theme="snow" />

      {/* ── Hero ── */}
      <section className="container-max grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.2fr_1fr] lg:gap-14">
        <div>
          <p className="inline-flex items-center gap-2 rounded-full border border-sky-400/30 bg-sky-500/10 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-sky-200">
            <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
            Customer portal · powered by Aurora
          </p>
          <h1 className="heading-section mt-5 text-balance sm:text-5xl">
            Your driveway, <span className="text-sky-300">live on your phone</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
            Watch the tractor work toward your driveway, get told the moment
            you are clear, and see the photo that proves it. From the kitchen,
            the office, or a beach in February.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild size="xl">
              <Link href="/winter-packages#packages">
                Get a pass with the portal
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Link>
            </Button>
            <Button asChild size="xl" variant="outline">
              <a href={PORTAL_LOGIN_URL} target="_blank" rel="noopener noreferrer">
                <LogIn className="h-4 w-4" aria-hidden />
                Customer login
              </a>
            </Button>
          </div>
          <p className="mt-5 flex items-start gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" aria-hidden />
            Included with Silver, Gold and Platinum passes at no extra cost.
          </p>
        </div>
        <PhoneMockup />
      </section>

      {/* ── Features ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">What you get</p>
          <h2 className="heading-section mt-2 text-balance">
            Everything about your snow service, in one place
          </h2>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {PORTAL_FEATURES.map((f) => {
            const Icon = FEATURE_ICONS[f.key] ?? Sparkles;
            return (
              <div key={f.key} className="surface-card p-6">
                <div className="flex items-start justify-between gap-3">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
                    <Icon className="h-5 w-5" aria-hidden />
                  </span>
                  <span className="rounded-full border border-white/15 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                    {portalTierLabel(f)}
                  </span>
                </div>
                <h3 className="mt-4 text-lg font-semibold">{f.title}</h3>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {f.body}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* ── Who it's for ── */}
      <section className="container-max py-12">
        <div className="grid gap-5 md:grid-cols-3">
          {WHO_FOR.map((w) => (
            <div
              key={w.title}
              className="rounded-2xl border border-sky-400/20 bg-gradient-to-br from-sky-500/10 to-transparent p-6"
            >
              <h3 className="text-lg font-semibold">{w.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {w.body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparison ── */}
      <section id="compare" className="container-max scroll-mt-24 py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">By pass</p>
          <h2 className="heading-section mt-2 text-balance">
            What each pass unlocks in the portal
          </h2>
          <p className="mt-3 text-muted-foreground">
            Gold and Platinum get the full experience.
          </p>
        </div>
        <div className="mt-8 overflow-x-auto rounded-2xl border border-white/10">
          <table className="w-full min-w-[560px] text-sm">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.03]">
                <th scope="col" className="p-4 text-left font-semibold">
                  Portal feature
                </th>
                {DRIVEWAY_TIERS.map((t) => {
                  const tier = getDrivewayTier(t);
                  return (
                    <th
                      key={t}
                      scope="col"
                      className="p-4 text-center font-bold"
                      style={{ color: tier.accent }}
                    >
                      {tier.name}
                    </th>
                  );
                })}
              </tr>
            </thead>
            <tbody>
              {PORTAL_FEATURES.map((f) => (
                <tr key={f.key} className="border-b border-white/5 last:border-0">
                  <th scope="row" className="p-4 text-left font-medium">
                    {f.title}
                  </th>
                  {DRIVEWAY_TIERS.map((t) => (
                    <td key={t} className="p-4 text-center">
                      {f.tiers.includes(t) ? (
                        <Check
                          className="mx-auto h-5 w-5 text-emerald-400"
                          strokeWidth={3}
                          aria-label="Included"
                        />
                      ) : (
                        <Minus
                          className="mx-auto h-4 w-4 text-white/25"
                          aria-label="Not included"
                        />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">
          Bronze passes do not include portal access.
        </p>
      </section>

      {/* ── How to get it ── */}
      <section className="container-max py-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">Getting started</p>
          <h2 className="heading-section mt-2 text-balance">
            Up and running in three steps
          </h2>
        </div>
        <ol className="mt-8 grid gap-5 md:grid-cols-3">
          {STEPS.map((s, i) => (
            <li key={s.title} className="surface-card relative p-6">
              <span className="absolute right-5 top-5 text-3xl font-black text-white/10">
                {String(i + 1).padStart(2, "0")}
              </span>
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-400/15 text-emerald-300">
                <s.icon className="h-5 w-5" aria-hidden />
              </span>
              <h3 className="mt-4 font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {s.body}
              </p>
            </li>
          ))}
        </ol>
        <div className="mt-10 flex flex-wrap items-center gap-3">
          <Button asChild size="lg">
            <Link href="/winter-packages#packages">
              See snow passes
              <ArrowRight className="h-4 w-4" aria-hidden />
            </Link>
          </Button>
          <a
            href={PORTAL_LOGIN_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-sky-300 hover:underline"
          >
            Already a customer? Log in
          </a>
        </div>
      </section>

      <FaqSection
        items={FAQS}
        eyebrow="Portal FAQs"
        title="Questions about the customer portal"
        description="Access, devices, and what each pass includes."
      />
    </>
  );
}

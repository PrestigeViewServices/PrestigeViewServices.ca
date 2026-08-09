import type { Metadata } from "next";
import Link from "next/link";
import { Phone, Mail, Clock, ArrowRight, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SupportForm } from "@/components/support-form";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Customer Support",
  description:
    "Existing customer? Report an issue, request dispatch, or get help with your PVS service.",
  alternates: { canonical: "/support" },
};

export default function SupportPage() {
  return (
    <section className="container-max pt-14 sm:pt-20 pb-20">
      <SectionHeading
        eyebrow="Existing Customers"
        title="Customer Support"
        description="If you're already a PVS customer and need help with a service, use this form. New quote? Try the Get a Quote page instead, it gets a faster response."
      />

      <div className="mt-12 grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-7">
          <SupportForm />
        </div>

        <aside className="lg:col-span-5 space-y-5">
          <div className="surface-card p-6">
            <h2 className="text-lg font-semibold">Reach a human directly</h2>
            <ul className="mt-4 space-y-3 text-sm">
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
            <h3 className="font-semibold">What you can use this for</h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground list-disc list-inside marker:text-primary">
              <li><strong className="text-foreground/90">Issue</strong>, something wasn't right with a visit</li>
              <li><strong className="text-foreground/90">Dispatch</strong>, need a crew sooner than scheduled</li>
              <li><strong className="text-foreground/90">Quote</strong>, adjusting an existing recurring service</li>
              <li><strong className="text-foreground/90">General</strong>, anything else</li>
            </ul>
          </div>

          {/* Staff shortcut into the admin ticket queue (sign-in required). */}
          <Link
            href="/admin/support"
            className="group flex items-center justify-between gap-3 rounded-2xl border border-surface-border bg-surface/40 p-5 transition-colors hover:border-primary/40 hover:bg-primary/5"
          >
            <span className="flex items-center gap-3">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary">
                <ShieldCheck className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-semibold">PVS staff</span>
                <span className="block text-xs text-muted-foreground">
                  View and manage all support tickets
                </span>
              </span>
            </span>
            <ArrowRight className="h-4 w-4 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>
        </aside>
      </div>
    </section>
  );
}

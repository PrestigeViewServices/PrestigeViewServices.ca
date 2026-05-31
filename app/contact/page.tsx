import type { Metadata } from "next";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { AuroraLeadForm } from "@/components/AuroraLeadForm";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Contact PVS — Petawawa & Pembroke Property Care",
  description:
    "Call, email, or request a callback. Prestige View Services is local to the Ottawa Valley and responds within one business day.",
  alternates: { canonical: "/contact" },
};

export default function ContactPage() {
  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="We're Local"
          title="Get in Touch"
          description="Reach us by phone, email, or send your details below — we'll be in touch within one business day."
        />
      </section>

      <section className="container-max py-12">
        <div className="grid gap-8 lg:grid-cols-12">
          <div className="lg:col-span-5 space-y-4">
            <ContactCard
              icon={<Phone className="h-5 w-5" />}
              label="Phone"
              value={siteConfig.phoneDisplay}
              href={`tel:${formatPhone(siteConfig.phone)}`}
            />
            <ContactCard
              icon={<Mail className="h-5 w-5" />}
              label="Email"
              value={siteConfig.email}
              href={`mailto:${siteConfig.email}`}
            />
            <ContactCard
              icon={<MapPin className="h-5 w-5" />}
              label="Service Area"
              value={siteConfig.serviceArea}
            />
            <ContactCard
              icon={<Clock className="h-5 w-5" />}
              label="Hours"
              value={siteConfig.hours}
            />
          </div>

          <div className="lg:col-span-7">
            <h2 className="text-lg font-semibold mb-4">Request a callback</h2>
            <AuroraLeadForm id="callback-form" />
          </div>
        </div>
      </section>
    </>
  );
}

function ContactCard({
  icon,
  label,
  value,
  href,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  href?: string;
}) {
  const inner = (
    <>
      <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        <p className="mt-0.5 font-semibold">{value}</p>
      </div>
    </>
  );

  const classes =
    "surface-card surface-card-hover flex items-center gap-4 p-5";

  return href ? (
    <a href={href} className={classes}>
      {inner}
    </a>
  ) : (
    <div className={classes}>{inner}</div>
  );
}

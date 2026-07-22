import type { Metadata } from "next";
import Link from "next/link";
import {
  ShieldCheck,
  Database,
  Share2,
  Cookie,
  Lock,
  UserCheck,
  Clock,
  Mail,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Privacy Policy, Prestige View Services",
  description:
    "How Prestige View Services collects, uses, and protects personal information from customers across Petawawa, Pembroke, and the Ottawa Valley.",
  alternates: { canonical: "/privacy" },
};

const EFFECTIVE_DATE = "June 4, 2026";

const sections = [
  { id: "information-we-collect", label: "Information We Collect", icon: Database },
  { id: "how-we-use", label: "How We Use Your Information", icon: ShieldCheck },
  { id: "sharing", label: "When We Share Information", icon: Share2 },
  { id: "cookies", label: "Cookies & Analytics", icon: Cookie },
  { id: "security", label: "How We Protect Your Information", icon: Lock },
  { id: "your-rights", label: "Your Rights & Choices", icon: UserCheck },
  { id: "retention", label: "Data Retention", icon: Clock },
  { id: "contact", label: "Contact Us", icon: Mail },
];

export default function PrivacyPage() {
  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Privacy Policy"
          title="How We Handle Your Information"
          description={`${siteConfig.name} respects your privacy. This policy explains what personal information we collect, why we collect it, and the choices you have. We follow Canada's Personal Information Protection and Electronic Documents Act (PIPEDA).`}
        />
        <p className="mt-6 text-center text-sm text-muted-foreground">
          Effective date: {EFFECTIVE_DATE}
        </p>
      </section>

      <section className="container-max py-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <aside className="lg:col-span-4">
            <div className="surface-card p-6 lg:sticky lg:top-24">
              <p className="eyebrow text-primary mb-3">On this page</p>
              <ul className="space-y-2.5 text-sm">
                {sections.map(({ id, label }) => (
                  <li key={id}>
                    <a
                      href={`#${id}`}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>

          <div className="lg:col-span-8 space-y-10">
            <Policy id="information-we-collect" icon={Database} title="Information We Collect">
              <p>
                We collect only the personal information we need to quote, schedule,
                deliver, and follow up on the services you request. That typically
                includes:
              </p>
              <ul>
                <li>
                  <strong>Contact details</strong>, your name, phone number, email
                  address, and the service address where work will be performed.
                </li>
                <li>
                  <strong>Service details</strong>, the property type, lot size,
                  service history, photos you upload, access notes, and any
                  preferences you share with us.
                </li>
                <li>
                  <strong>Payment information</strong>, when you pay an invoice, our
                  payment processor handles your card or bank details. We do not
                  store full card numbers on our servers.
                </li>
                <li>
                  <strong>Account information</strong>, if you create a customer
                  portal account, we store your login credentials, communication
                  preferences, and quote/invoice history.
                </li>
                <li>
                  <strong>Job site information</strong>, before-and-after photos
                  taken by our crews to document completed work. We will not publish
                  identifiable photos of your property without your consent.
                </li>
                <li>
                  <strong>Website usage</strong>, pages viewed, device type,
                  approximate location, and referral source, collected through
                  cookies and analytics tools described below.
                </li>
              </ul>
            </Policy>

            <Policy id="how-we-use" icon={ShieldCheck} title="How We Use Your Information">
              <p>We use your information to:</p>
              <ul>
                <li>Prepare quotes and respond to inquiries.</li>
                <li>Schedule, dispatch, and complete the services you book.</li>
                <li>Invoice you and process payments.</li>
                <li>
                  Send service reminders, seasonal updates, and follow-ups related to
                  your account. You can opt out of marketing emails at any time.
                </li>
                <li>Improve our website, services, and customer experience.</li>
                <li>
                  Meet our legal, tax, insurance, and safety obligations as an
                  Ontario business.
                </li>
              </ul>
              <p>
                We do not sell your personal information, and we do not share it with
                third parties for their own marketing purposes.
              </p>
            </Policy>

            <Policy id="sharing" icon={Share2} title="When We Share Information">
              <p>
                We share personal information only with trusted service providers
                who help us run our business, and only to the extent they need it.
                These include:
              </p>
              <ul>
                <li>
                  <strong>Payment processing</strong>, secure third-party
                  processors that handle card and bank payments on our behalf.
                </li>
                <li>
                  <strong>Scheduling, CRM, and field-service tools</strong>, to
                  manage quotes, jobs, routes, and invoices.
                </li>
                <li>
                  <strong>Email and SMS providers</strong>, to deliver booking
                  confirmations, service reminders, and account messages.
                </li>
                <li>
                  <strong>Website hosting and analytics</strong>, to operate
                  prestigeviewservices.ca and understand how visitors use it.
                </li>
                <li>
                  <strong>Insurance, legal, and accounting professionals</strong>, when needed to manage claims, disputes, or tax obligations.
                </li>
              </ul>
              <p>
                We may also disclose information when required by law, by court
                order, or to protect the safety, property, or rights of our
                customers, our crews, or the public.
              </p>
            </Policy>

            <Policy id="cookies" icon={Cookie} title="Cookies & Analytics">
              <p>
                Our website uses cookies and similar technologies for two purposes:
              </p>
              <ul>
                <li>
                  <strong>Essential cookies</strong> keep the site working, for
                  example, remembering that you're signed in to the customer portal
                  or that you've dismissed a banner.
                </li>
                <li>
                  <strong>Analytics cookies</strong> help us understand which pages
                  are useful, where visitors come from, and where the site can be
                  improved. The data is aggregated and does not identify you
                  personally.
                </li>
              </ul>
              <p>
                You can block or delete cookies through your browser settings. Some
                parts of the site, such as the customer portal, may not work
                properly without essential cookies.
              </p>
            </Policy>

            <Policy id="security" icon={Lock} title="How We Protect Your Information">
              <p>
                We use reasonable administrative, technical, and physical
                safeguards to protect your information against loss, theft, and
                unauthorized access. These include encrypted connections (HTTPS),
                restricted access to customer records, secure password storage, and
                vetted third-party providers.
              </p>
              <p>
                No method of transmission or storage is 100% secure. If we ever
                experience a breach that puts your personal information at real risk,
                we will notify you and the Office of the Privacy Commissioner of
                Canada as required by law.
              </p>
            </Policy>

            <Policy id="your-rights" icon={UserCheck} title="Your Rights & Choices">
              <p>Under PIPEDA, you have the right to:</p>
              <ul>
                <li>
                  Ask what personal information we hold about you and request a
                  copy.
                </li>
                <li>
                  Ask us to correct information that is inaccurate or incomplete.
                </li>
                <li>
                  Withdraw consent for non-essential uses (such as marketing
                  emails). Withdrawing consent for essential uses may mean we can
                  no longer provide service.
                </li>
                <li>
                  Ask us to delete information we no longer need to keep for legal
                  or operational reasons.
                </li>
                <li>
                  File a complaint with us or with the{" "}
                  <a
                    href="https://www.priv.gc.ca"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    Office of the Privacy Commissioner of Canada
                  </a>
                  .
                </li>
              </ul>
              <p>
                To exercise any of these rights, contact us using the details below.
                We will respond within 30 days.
              </p>
            </Policy>

            <Policy id="retention" icon={Clock} title="Data Retention">
              <p>
                We keep personal information only as long as we need it for the
                purpose we collected it, plus any period required by law. In
                practice that means:
              </p>
              <ul>
                <li>
                  <strong>Quote requests that don't become customers</strong>, typically deleted within 24 months.
                </li>
                <li>
                  <strong>Active customer records</strong>, kept for the life of
                  the account and for as long as we continue to provide service.
                </li>
                <li>
                  <strong>Invoices, tax records, and insurance records</strong>, kept for at least seven years to meet Canadian tax and
                  recordkeeping requirements.
                </li>
                <li>
                  <strong>Job site photos</strong>, kept indefinitely for our
                  internal records, unless you ask us to delete photos of your
                  property.
                </li>
              </ul>
            </Policy>

            <Policy id="contact" icon={Mail} title="Contact Us">
              <p>
                Questions about this policy, or want to access or correct your
                information? Reach our Privacy Officer:
              </p>
              <ul>
                <li>
                  <strong>Email:</strong>{" "}
                  <a
                    href={`mailto:${siteConfig.email}`}
                    className="text-primary hover:underline"
                  >
                    {siteConfig.email}
                  </a>
                </li>
                <li>
                  <strong>Phone:</strong>{" "}
                  <a
                    href={`tel:${formatPhone(siteConfig.phone)}`}
                    className="text-primary hover:underline"
                  >
                    {siteConfig.phoneDisplay}
                  </a>
                </li>
                <li>
                  <strong>Mail:</strong> {siteConfig.name},{" "}
                  {siteConfig.address.streetAddress},{" "}
                  {siteConfig.address.locality}, {siteConfig.address.region},{" "}
                  {siteConfig.address.country}
                </li>
              </ul>
              <p>
                We may update this policy from time to time as our services change
                or as required by law. Material changes will be posted here with a
                new effective date. For ongoing customers, we will also send a
                notice by email.
              </p>
              <p className="text-sm text-muted-foreground">
                See also our{" "}
                <Link href="/contact" className="text-primary hover:underline">
                  contact page
                </Link>{" "}
                for general inquiries.
              </p>
            </Policy>
          </div>
        </div>
      </section>
    </>
  );
}

function Policy({
  id,
  icon: Icon,
  title,
  children,
}: {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
          <Icon className="h-5 w-5" />
        </div>
        <h2 className="text-2xl font-semibold">{title}</h2>
      </div>
      <div className="prose prose-invert mt-5 max-w-none text-muted-foreground leading-relaxed prose-headings:text-foreground prose-strong:text-foreground prose-a:text-primary prose-li:my-1 prose-p:my-3 prose-ul:my-3">
        {children}
      </div>
    </section>
  );
}

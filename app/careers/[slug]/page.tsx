import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import {
  ArrowLeft,
  Briefcase,
  Check,
  Clock,
  DollarSign,
  MapPin,
  Sparkles,
} from "lucide-react";
import {
  activeRoles,
  getRole,
  divisionLabel,
} from "@/lib/content/careers";
import { siteConfig } from "@/lib/site";
import { DivisionBadge } from "@/components/careers/division-badge";
import { ApplicationForm } from "@/components/application-form";
import { Button } from "@/components/ui/button";

type Params = { slug: string };

export function generateStaticParams() {
  return activeRoles().map((r) => ({ slug: r.slug }));
}

export function generateMetadata({
  params,
}: {
  params: Params;
}): Metadata {
  const role = getRole(params.slug);
  if (!role || !role.active) return {};
  return {
    title: `${role.title}, ${divisionLabel[role.division]}`,
    description: role.shortPitch,
    alternates: { canonical: `/careers/${role.slug}` },
  };
}

export default function RoleDetailPage({ params }: { params: Params }) {
  const role = getRole(params.slug);
  if (!role || !role.active) notFound();

  // JobPosting JSON-LD, pages Google Jobs can pick up.
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "JobPosting",
    title: role.title,
    description: `<p>${role.longPitch}</p><h3>Responsibilities</h3><ul>${role.responsibilities
      .map((r) => `<li>${r}</li>`)
      .join("")}</ul><h3>Requirements</h3><ul>${role.requirements
      .map((r) => `<li>${r}</li>`)
      .join("")}</ul>`,
    datePosted: role.datePosted,
    employmentType: employmentTypeFor(role.type),
    hiringOrganization: {
      "@type": "Organization",
      name: siteConfig.name,
      sameAs: siteConfig.url,
    },
    jobLocation: {
      "@type": "Place",
      address: {
        "@type": "PostalAddress",
        streetAddress: siteConfig.address.streetAddress,
        addressLocality: siteConfig.address.locality,
        addressRegion: siteConfig.address.region,
        addressCountry: siteConfig.address.country,
      },
    },
    applicantLocationRequirements: {
      "@type": "Country",
      name: "Canada",
    },
    directApply: true,
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-10 sm:pt-14 pb-4">
        <Link
          href="/careers"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          All open roles
        </Link>
      </section>

      <section className="container-max pt-6 pb-10">
        <div className="flex items-center gap-2 flex-wrap">
          <DivisionBadge division={role.division} />
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
            {role.type}
          </span>
        </div>
        <h1 className="mt-4 heading-display max-w-3xl text-balance">
          {role.title}
        </h1>
        <p className="mt-5 max-w-2xl text-base sm:text-lg text-muted-foreground leading-relaxed">
          {role.longPitch}
        </p>

        <div className="mt-6 flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg">
            <Link href="#apply">
              <Briefcase className="h-4 w-4" />
              Apply for this role
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/careers#open-roles">View other roles</Link>
          </Button>
        </div>

        <dl className="mt-10 grid gap-3 sm:grid-cols-3">
          <Meta icon={<DollarSign className="h-4 w-4" />} label="Pay" value={role.payRange} />
          <Meta icon={<MapPin className="h-4 w-4" />} label="Location" value={role.location} />
          <Meta icon={<Clock className="h-4 w-4" />} label="Type" value={role.type} />
        </dl>
      </section>

      <section className="container-max py-10 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-7 space-y-8">
          <ListBlock
            heading="Responsibilities"
            items={role.responsibilities}
          />
          <ListBlock heading="Requirements" items={role.requirements} />
          {role.niceToHave.length > 0 && (
            <ListBlock
              heading="Nice to have"
              items={role.niceToHave}
              icon={<Sparkles className="h-4 w-4 text-primary" />}
            />
          )}
        </div>

        <div className="lg:col-span-5">
          <ApplicationForm defaultRoleSlug={role.slug} />
        </div>
      </section>
    </>
  );
}

function Meta({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="surface-card flex items-center gap-3 p-4">
      <div className="grid h-9 w-9 place-items-center rounded-xl bg-primary/15 text-primary shrink-0">
        {icon}
      </div>
      <div>
        <dt className="text-[11px] uppercase tracking-wider text-muted-foreground">
          {label}
        </dt>
        <dd className="mt-0.5 text-sm font-semibold">{value}</dd>
      </div>
    </div>
  );
}

function ListBlock({
  heading,
  items,
  icon,
}: {
  heading: string;
  items: string[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="surface-card p-6">
      <h2 className="text-lg font-semibold">{heading}</h2>
      <ul className="mt-4 space-y-2.5">
        {items.map((it) => (
          <li key={it} className="flex items-start gap-2.5 text-sm">
            <span className="mt-0.5 shrink-0">
              {icon ?? <Check className="h-4 w-4 text-emerald-400" strokeWidth={3} />}
            </span>
            <span className="text-foreground/90">{it}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Maps our internal CareerType to schema.org employmentType values. */
function employmentTypeFor(type: string): string[] {
  switch (type) {
    case "Full-time":
      return ["FULL_TIME"];
    case "Part-time":
      return ["PART_TIME"];
    case "Seasonal":
      return ["TEMPORARY"];
    case "Flexible":
      return ["FULL_TIME", "PART_TIME", "TEMPORARY"];
    default:
      return ["OTHER"];
  }
}

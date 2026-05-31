import type { Metadata } from "next";
import { CareersHero } from "@/components/careers/hero";
import { WhyPVS } from "@/components/careers/why-pvs";
import { GrowthPath } from "@/components/careers/growth-path";
import { OpenRoles } from "@/components/careers/open-roles";
import { Qualifier } from "@/components/careers/qualifier";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = {
  title: "Careers — Lawn Care, Property & Snow Removal Jobs in Petawawa",
  description:
    "Join Prestige View Services and build a year-round career in property care across Petawawa, Pembroke, and the Ottawa Valley. Lawn, exterior, and snow removal jobs hiring now.",
  alternates: { canonical: "/careers" },
  keywords: [
    "lawn care jobs Petawawa",
    "property maintenance jobs Pembroke",
    "seasonal snow removal jobs Ottawa Valley",
    "landscaping jobs Petawawa",
    "outdoor jobs Pembroke",
    "exterior cleaning jobs Ottawa Valley",
  ],
};

export default function CareersPage() {
  return (
    <>
      <CareersHero />
      <WhyPVS />
      <GrowthPath />
      <OpenRoles />
      <Qualifier />
      <CtaBand
        eyebrow="Ready?"
        title="Apply to Join the PVS Team"
        description="3-minute application. No résumé required to start. We respond to qualified applicants within a few business days."
        primaryLabel="Apply Now"
        primaryHref="/careers/general-application#apply"
      />
    </>
  );
}

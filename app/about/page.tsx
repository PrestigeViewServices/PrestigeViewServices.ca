import type { Metadata } from "next";
import { ShieldCheck, MapPin, HeartHandshake, Users } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About PVS, Locally Owned Ottawa Valley Property Care",
  description:
    "Prestige View Services is a locally owned property care company serving Petawawa, Pembroke, and the Ottawa Valley year-round.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    icon: MapPin,
    title: "Local to the Ottawa Valley",
    body: "Owned and run by neighbours. Crews you recognize, on roads we drive every day.",
  },
  {
    icon: ShieldCheck,
    title: "Insured & Professional",
    body: "Liability coverage on every job, uniformed crews, and transparent quotes, no surprises.",
  },
  {
    icon: HeartHandshake,
    title: "Satisfaction Guarantee",
    body: "If something isn't right, we come back. Your trust is the whole point of this business.",
  },
  {
    icon: Users,
    title: "One Account, Every Season",
    body: "Lawn, exterior, and snow, coordinated under one team, one point of contact, one bill.",
  },
];

export default function AboutPage() {
  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="About PVS"
          title="Property Care, Modernized for the Ottawa Valley"
          description={`${siteConfig.name} was built around a simple idea: homeowners want their property looked after by people they trust, on a schedule they don't have to think about. That's what we do, year-round.`}
        />
      </section>

      <section className="container-max py-12">
        <div className="grid gap-5 sm:grid-cols-2">
          {values.map(({ icon: Icon, title, body }) => (
            <div key={title} className="surface-card p-6">
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      <CtaBand />
    </>
  );
}

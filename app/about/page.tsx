import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, MapPin, HeartHandshake, Users, Camera } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";
import { SamImage } from "@/components/sam";
import { CtaBand } from "@/components/cta-band";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "About PVS, Locally Owned Ottawa Valley Property Care",
  description:
    "Prestige View Services is a veteran-operated property care company based in Petawawa, serving Pembroke and the Ottawa Valley year-round. Meet the crew (and Sam).",
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

const crewPhotos = [
  {
    src: "/images/careers/crew-truck-lineup.webp",
    alt: "PVS crew standing in front of the truck lineup",
  },
  {
    src: "/images/careers/crew-window-squeegee.webp",
    alt: "PVS crew member cleaning a window with a squeegee",
  },
  {
    src: "/images/careers/crew-banner-mowers.webp",
    alt: "PVS crew with mowers ready for a route day",
  },
  {
    src: "/images/careers/crew-ladders-banner.webp",
    alt: "PVS crew setting up ladders on a job site",
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

      {/* ---- Story ---- */}
      <section className="container-max py-10">
        <div className="mx-auto max-w-3xl space-y-4 text-base leading-relaxed text-muted-foreground sm:text-lg">
          <p>
            We&apos;re a veteran-operated property care company based in
            Petawawa, Ontario. PVS started with a squeegee, a ladder, and a
            simple idea: do the unglamorous work so well that the neighbours
            notice. They noticed.
          </p>
          <p>
            Today our crews handle windows, siding, lawns, gutters, and Valley
            winters for hundreds of homes across Petawawa, Pembroke, and the
            wider Ottawa Valley. Same faces, same standard, season after
            season.
          </p>
          <p className="flex items-start gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-5 text-sm sm:text-base">
            <Camera className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden />
            <span>
              Our promise never changes, whether it&apos;s a spring shine-up or
              a February storm at 5 a.m.: <strong>show up, do it right, send
              a photo when it&apos;s done.</strong> That&apos;s the PVS
              difference.
            </span>
          </p>
        </div>
      </section>

      {/* ---- Crew photos ---- */}
      <section className="container-max py-8">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {crewPhotos.map((p, i) => (
            <div
              key={p.src}
              className={
                "relative overflow-hidden rounded-2xl border border-surface-border " +
                (i % 2 === 0 ? "aspect-[4/5]" : "aspect-[4/5] sm:mt-6")
              }
            >
              <Image
                src={p.src}
                alt={p.alt}
                fill
                sizes="(min-width:1024px) 25vw, 50vw"
                className="object-cover transition-transform duration-500 hover:scale-105"
              />
            </div>
          ))}
        </div>
      </section>

      {/* ---- Values ---- */}
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

      {/* ---- Meet Sam ---- */}
      <section className="container-max pb-14 sm:pb-16">
        <div className="relative overflow-hidden rounded-3xl border border-yellow-400/25 bg-gradient-to-br from-blue-950 via-blue-900 to-sky-950 p-8 sm:p-10">
          <div className="grid items-center gap-8 sm:grid-cols-[auto_1fr]">
            <SamImage
              pose="hero"
              size={220}
              className="mx-auto w-44 sm:w-52 drop-shadow-2xl"
            />
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-yellow-400">
                The Hardest Working Beaver in the Valley
              </p>
              <h2 className="mt-2 text-2xl font-bold text-white sm:text-3xl">
                Meet Sam
              </h2>
              <p className="mt-3 max-w-xl text-base leading-relaxed text-sky-100/85">
                Sam is our mascot, safety officer, and unofficial morale
                department. A beaver was the obvious choice: nobody in Canada
                works harder on a property, and nobody is prouder of the
                result. You&apos;ll spot him around the site sharing pro tips,
                running the{" "}
                <Link
                  href="/seasonal-planner"
                  className="font-medium text-yellow-400 hover:underline"
                >
                  seasonal planner
                </Link>
                , and occasionally guarding the{" "}
                <Link
                  href="/guides"
                  className="font-medium text-yellow-400 hover:underline"
                >
                  tips &amp; guides
                </Link>
                .
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

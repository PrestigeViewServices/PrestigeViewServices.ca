"use client";

import Link from "next/link";
import {
  ShieldCheck,
  RotateCcw,
  MapPin,
  HeartHandshake,
} from "lucide-react";
import { motion } from "framer-motion";
import { SectionHeading } from "@/components/section-heading";
import { AnimatedCounter } from "@/components/animated-counter";
import { TiltCard } from "@/components/ui/tilt-card";

const items: {
  icon: typeof ShieldCheck;
  title: string;
  body: string;
  href?: string;
}[] = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    body: "$2M liability coverage on every job, every visit. See our insurance page for the details.",
    href: "/insurance",
  },
  {
    icon: MapPin,
    title: "Locally Owned",
    body: "Two trucks, two crews, born in the Ottawa Valley. Faces you'll recognize.",
  },
  {
    icon: RotateCcw,
    title: "Recurring Service",
    body: "Set it once. Reliable schedules, all season long.",
  },
  {
    icon: HeartHandshake,
    title: "Satisfaction Guarantee",
    body: "Not happy? We come back and make it right.",
  },
];

export function TrustStrip() {
  // Static, non-fabricated trust signals. Removed the review-derived counts
  // (we now pull real reviews from Google via the Trustindex embed) and the
  // "Service divisions" stat (PVS is one brand, not three sub-brands).
  const stats = [
    { value: 100, suffix: "%", label: "Insured & guaranteed" },
    { value: 4, label: "Seasons covered" },
    { value: 9, label: "Ottawa Valley service areas" },
    { value: 2, label: "Local PVS crews" },
  ];

  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Why PVS"
        title="Built for Property Owners Who Want It Handled"
      />

      {/* Big animated stats row */}
      <div className="mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-60px" }}
            transition={{ duration: 0.4, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="rounded-2xl border border-surface-border bg-surface/50 backdrop-blur-sm p-5 text-center"
          >
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight bg-gradient-primary bg-clip-text text-transparent">
              <AnimatedCounter to={s.value} suffix={s.suffix ?? ""} />
            </div>
            <div className="mt-1 text-xs uppercase tracking-wider text-muted-foreground">
              {s.label}
            </div>
          </motion.div>
        ))}
      </div>

      <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body, href }, i) => {
          const card = (
            <TiltCard className="rounded-2xl">
              <div className="surface-card p-6 h-full">
                <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary transition-transform duration-300 group-hover:scale-110">
                  <Icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-lg font-semibold">{title}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                  {body}
                </p>
              </div>
            </TiltCard>
          );
          return (
            <motion.div
              key={title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.4, delay: i * 0.05, ease: [0.22, 1, 0.36, 1] }}
              whileHover={{ y: -4 }}
              className="group"
            >
              {href ? <Link href={href}>{card}</Link> : card}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}

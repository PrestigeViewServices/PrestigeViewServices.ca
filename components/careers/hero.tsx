"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Briefcase, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export function CareersHero() {
  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial" />
      <div className="container-max relative pt-16 pb-16 sm:pt-24 sm:pb-20 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="eyebrow text-primary mb-5 justify-center"
        >
          <MapPin className="h-3.5 w-3.5" />
          Hiring locally, {siteConfig.serviceArea}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="heading-display text-balance mx-auto max-w-3xl"
        >
          Join the Team.{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Build a Career.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed text-balance"
        >
          PVS runs three divisions, lawn, exterior, and snow, so the
          right people work year-round instead of getting laid off in
          October.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-9 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button asChild size="xl">
            <Link href="#open-roles">
              View Open Roles
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <Link href="/careers/general-application#apply">
              <Briefcase className="h-4 w-4" />
              Apply Now
            </Link>
          </Button>
        </motion.div>
      </div>
    </section>
  );
}

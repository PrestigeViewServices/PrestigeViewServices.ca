"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck, MapPin, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";
import { averageRating, reviews } from "@/lib/content/reviews";

export function Hero() {
  const rating = averageRating();

  return (
    <section className="relative overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-hero-radial" />
      <div className="container-max relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36 text-center">
        <motion.p
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="eyebrow text-primary mb-5 justify-center"
        >
          <MapPin className="h-3.5 w-3.5" />
          Serving {siteConfig.serviceArea}
        </motion.p>

        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.05 }}
          className="heading-display text-balance mx-auto max-w-3xl"
        >
          Year-Round Property Care,{" "}
          <span className="bg-gradient-primary bg-clip-text text-transparent">
            Modernized.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="mt-6 mx-auto max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed text-balance"
        >
          Lawn care, window cleaning, and snow removal under one
          local, insured crew. Recurring service, one easy bill.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.15 }}
          className="mt-9 flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button asChild size="xl">
            <Link href="/quote">
              Get a Free Quote
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="xl" variant="outline">
            <a href={`tel:${formatPhone(siteConfig.phone)}`}>
              <Phone className="h-4 w-4" />
              {siteConfig.phoneDisplay}
            </a>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.25 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground"
        >
          <span className="inline-flex items-center gap-1.5">
            <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
            {rating} avg · {reviews.length}+ local reviews
          </span>
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span className="inline-flex items-center gap-1.5">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Fully insured
          </span>
          <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-muted-foreground/40" />
          <span>Locally owned · Ottawa Valley</span>
        </motion.div>
      </div>
    </section>
  );
}

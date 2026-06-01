"use client";

import Link from "next/link";
import Image from "next/image";
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
      <div className="container-max relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* Copy column */}
          <div className="text-center lg:text-left">
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="eyebrow text-primary mb-5 justify-center lg:justify-start"
            >
              <MapPin className="h-3.5 w-3.5" />
              Serving {siteConfig.serviceArea}
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.05 }}
              className="heading-display text-balance mx-auto lg:mx-0 max-w-3xl"
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
              className="mt-6 mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed text-balance"
            >
              Lawn care, window cleaning, and snow removal across Petawawa,
              Pembroke &amp; the Ottawa Valley — under one local, insured
              crew. Recurring service, one easy bill.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start"
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
              className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground"
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

          {/* Mascot column */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -3 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 0.6, delay: 0.15, ease: "easeOut" }}
            className="relative mx-auto lg:mx-0 max-w-sm lg:max-w-none"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-sky-500/10 blur-3xl" />
            <Image
              src="/images/mascot-sam.png"
              alt="Almighty Sam — the Prestige View Services mascot, ready for year-round property care across the Ottawa Valley"
              width={900}
              height={900}
              priority
              className="w-full h-auto drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)] select-none"
            />
            <motion.span
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="absolute -top-3 right-2 lg:-top-4 lg:right-6 rounded-full border border-primary/40 bg-background/80 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider text-primary"
            >
              Meet Almighty Sam
            </motion.span>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

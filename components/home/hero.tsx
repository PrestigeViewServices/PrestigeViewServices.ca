"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck, MapPin, Star } from "lucide-react";
import { useRef } from "react";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";
import { averageRating, reviews } from "@/lib/content/reviews";

/**
 * Hero — text + CTA render statically (no entrance animation, instant for
 * paid traffic). Modern ambient motion layers:
 *   - Animated gradient blobs drifting behind copy
 *   - Mascot has continuous ambient float
 *   - Mascot is also scroll-parallaxed (translates ~30% slower than scroll)
 *   - CTAs scale on press for haptic-style feedback
 * All motion respects prefers-reduced-motion.
 */
export function Hero() {
  const rating = averageRating();
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const mascotY = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const mascotScale = useTransform(scrollYProgress, [0, 1], [1, 0.92]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.5]);

  return (
    <section ref={ref} className="relative overflow-hidden isolate">
      {/* Animated gradient mesh background */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-hero-radial" />
        <div className="absolute -top-32 -left-20 h-[480px] w-[480px] rounded-full bg-blue-500/25 blur-3xl motion-safe:animate-blob-drift" />
        <div
          className="absolute top-20 -right-32 h-[520px] w-[520px] rounded-full bg-emerald-500/20 blur-3xl motion-safe:animate-blob-drift"
          style={{ animationDelay: "-6s", animationDuration: "22s" }}
        />
        <div
          className="absolute -bottom-32 left-1/3 h-[420px] w-[420px] rounded-full bg-sky-500/20 blur-3xl motion-safe:animate-blob-drift"
          style={{ animationDelay: "-12s", animationDuration: "24s" }}
        />
        {/* Subtle grid overlay */}
        <div
          aria-hidden
          className="absolute inset-0 opacity-[0.04]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
            maskImage:
              "radial-gradient(ellipse 70% 50% at 50% 30%, black, transparent)",
          }}
        />
      </div>

      <div className="container-max relative pt-12 pb-16 sm:pt-20 sm:pb-24 lg:pt-28 lg:pb-32">
        <div className="grid items-center gap-10 lg:grid-cols-[1.15fr_1fr] lg:gap-14">
          {/* Copy column — STATIC render, no entrance animation */}
          <motion.div
            style={
              prefersReducedMotion
                ? undefined
                : { y: copyY, opacity: copyOpacity }
            }
            className="text-center lg:text-left"
          >
            <p className="eyebrow text-primary mb-5 justify-center lg:justify-start">
              <MapPin className="h-3.5 w-3.5" />
              Serving {siteConfig.serviceArea}
            </p>

            <h1 className="heading-display text-balance mx-auto lg:mx-0 max-w-3xl">
              Year-Round Property Care,{" "}
              <span className="bg-gradient-primary bg-clip-text text-transparent">
                Modernized.
              </span>
            </h1>

            <p className="mt-6 mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-muted-foreground leading-relaxed text-balance">
              Lawn care, window cleaning, and snow removal across Petawawa,
              Pembroke &amp; the Ottawa Valley — under one local, insured
              crew. Recurring service, one easy bill.
            </p>

            <div className="mt-9 flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <Link
                  href="/quote"
                  className="group relative inline-flex h-14 items-center justify-center gap-2 overflow-hidden rounded-full bg-gradient-primary px-10 text-base font-semibold text-white shadow-[0_10px_40px_-10px_rgba(59,130,246,0.7)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <span className="absolute inset-0 -z-10 bg-[radial-gradient(120%_120%_at_0%_0%,rgba(255,255,255,0.35),transparent_50%)] opacity-0 transition-opacity duration-300 group-hover:opacity-100" />
                  Get a Free Quote
                  <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                </Link>
              </motion.div>
              <motion.div whileHover={{ y: -2 }} whileTap={{ scale: 0.97 }}>
                <a
                  href={`tel:${formatPhone(siteConfig.phone)}`}
                  className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-surface-border bg-surface/60 backdrop-blur px-10 text-base font-semibold text-foreground hover:border-white/30 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                >
                  <Phone className="h-4 w-4" />
                  {siteConfig.phoneDisplay}
                </a>
              </motion.div>
            </div>

            <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs sm:text-sm text-muted-foreground">
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
            </div>
          </motion.div>

          {/* Mascot column — parallax + ambient float */}
          <motion.div
            style={
              prefersReducedMotion
                ? undefined
                : { y: mascotY, scale: mascotScale }
            }
            className="relative mx-auto lg:mx-0 max-w-sm lg:max-w-none"
          >
            <div className="pointer-events-none absolute inset-0 -z-10 bg-gradient-to-br from-primary/30 via-emerald-500/15 to-sky-500/15 blur-3xl" />
            <div className="motion-safe:animate-ambient-float">
              <Image
                src="/images/mascot-sam.png"
                alt="Almighty Sam — the Prestige View Services mascot, ready for year-round property care across the Ottawa Valley"
                width={900}
                height={900}
                priority
                className="w-full h-auto drop-shadow-[0_25px_45px_rgba(0,0,0,0.45)] select-none"
              />
            </div>
            <span className="absolute -top-3 right-2 lg:-top-4 lg:right-6 rounded-full border border-primary/40 bg-background/80 backdrop-blur px-3 py-1 text-[11px] uppercase tracking-wider text-primary">
              Meet Almighty Sam
            </span>
          </motion.div>
        </div>
      </div>
      {/* Observed by <StickyCta> */}
      <div id="sticky-cta-sentinel" aria-hidden className="h-px w-px" />
    </section>
  );
}

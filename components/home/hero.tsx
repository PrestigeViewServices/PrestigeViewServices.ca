"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";
import { ArrowRight, Phone, ShieldCheck, MapPin, Star, Medal } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

/**
 * Hero, full-width rotation of real job photos with a navy overlay. Copy +
 * CTAs render statically (instant for paid traffic); photos crossfade every
 * few seconds. Reduced-motion users get the first photo only.
 */
const HERO_PHOTOS = [
  {
    src: "/images/gallery/landscaping/stone-estate-manicured-lawn-gardens.webp",
    alt: "Manicured lawn and landscaped garden beds at a stone estate home in the Ottawa Valley",
  },
  {
    src: "/images/gallery/pressure-washing/pressure-job-04.jpg",
    alt: "Prestige View Services crew pressure washing the second-storey siding of an Ottawa Valley home",
  },
  {
    src: "/images/gallery/window-cleaning/ladder-second-storey-window-cleaning.webp",
    alt: "PVS crew member on an extension ladder cleaning second-storey windows of a timber home",
  },
  {
    src: "/images/gallery/hedge-trimming/cedar-hedge-squared-sunrise-petawawa.webp",
    alt: "Freshly squared cedar hedge at sunrise in Petawawa",
  },
  {
    src: "/images/gallery/snow-removal/drone-tractor-snowblowing-driveway.webp",
    alt: "Aerial view of a PVS tractor snow-blowing a residential driveway in winter",
  },
];

const ROTATE_MS = 6000;

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const prefersReducedMotion = useReducedMotion();
  const [slide, setSlide] = useState(0);

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const photoY = useTransform(scrollYProgress, [0, 1], ["0%", "12%"]);
  const copyY = useTransform(scrollYProgress, [0, 1], ["0%", "-8%"]);
  const copyOpacity = useTransform(scrollYProgress, [0, 0.8], [1, 0.5]);

  useEffect(() => {
    if (prefersReducedMotion) return;
    const id = setInterval(
      () => setSlide((s) => (s + 1) % HERO_PHOTOS.length),
      ROTATE_MS
    );
    return () => clearInterval(id);
  }, [prefersReducedMotion]);

  return (
    <section ref={ref} className="relative overflow-hidden isolate">
      {/* Full-bleed rotating photos + navy overlay for text contrast */}
      <div className="pointer-events-none absolute inset-0 -z-10">
        <motion.div
          className="absolute inset-[-6%]"
          style={prefersReducedMotion ? undefined : { y: photoY }}
        >
          {HERO_PHOTOS.map((p, i) => (
            <Image
              key={p.src}
              src={p.src}
              alt={i === slide ? p.alt : ""}
              fill
              priority={i === 0}
              loading={i === 0 ? undefined : "lazy"}
              sizes="100vw"
              className="object-cover object-center transition-opacity duration-1000"
              style={{ opacity: i === slide ? 1 : 0 }}
            />
          ))}
        </motion.div>
        <div className="absolute inset-0 bg-gradient-to-r from-blue-950/95 via-blue-950/80 to-blue-900/40" />
        <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </div>

      <div className="container-max relative pt-16 pb-20 sm:pt-24 sm:pb-28 lg:pt-32 lg:pb-36">
        <motion.div
          style={
            prefersReducedMotion ? undefined : { y: copyY, opacity: copyOpacity }
          }
          className="max-w-3xl text-center lg:text-left mx-auto lg:mx-0"
        >
          <p className="eyebrow text-sky-300 mb-5 justify-center lg:justify-start">
            <MapPin className="h-3.5 w-3.5" />
            Serving {siteConfig.serviceArea}
          </p>

          <h1 className="heading-display text-balance text-white">
            The Ottawa Valley&apos;s Property Care Team.{" "}
            <span className="bg-gradient-primary bg-clip-text text-transparent">
              Windows, Lawns, Landscaping &amp; Snow, Done Right.
            </span>
          </h1>

          <p className="mt-6 mx-auto lg:mx-0 max-w-xl text-base sm:text-lg text-sky-100/85 leading-relaxed text-balance">
            One local, insured crew for everything outside your home: window
            cleaning, lawn care, hedge trimming, landscaping, pressure washing,
            and winter snow removal. Free quotes in one business day.
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
                className="inline-flex h-14 items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 backdrop-blur px-10 text-base font-semibold text-white hover:border-white/40 hover:bg-white/15 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
              >
                <Phone className="h-4 w-4" />
                {siteConfig.phoneDisplay}
              </a>
            </motion.div>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center lg:justify-start gap-x-6 gap-y-3 text-xs sm:text-sm text-sky-100/80">
            <span className="inline-flex items-center gap-1.5">
              <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
              Top-rated on Google
            </span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-sky-100/40" />
            <span className="inline-flex items-center gap-1.5">
              <Medal className="h-4 w-4 text-sky-300" />
              Military &amp; veteran discount
            </span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-sky-100/40" />
            <span className="inline-flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Fully insured
            </span>
            <span className="hidden sm:inline-block h-1 w-1 rounded-full bg-sky-100/40" />
            <span>Locally owned &amp; veteran operated</span>
          </div>
        </motion.div>
      </div>
      {/* Observed by <StickyCta> */}
      <div id="sticky-cta-sentinel" aria-hidden className="h-px w-px" />
    </section>
  );
}

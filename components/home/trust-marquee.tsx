"use client";

import {
  ShieldCheck,
  MapPin,
  Star,
  Sparkles,
  Snowflake,
  Leaf,
  Droplets,
  HeartHandshake,
} from "lucide-react";
import { Marquee } from "@/components/marquee";

const chips = [
  { icon: ShieldCheck, label: "Fully Insured" },
  { icon: MapPin, label: "Petawawa · Pembroke · Deep River" },
  { icon: Star, label: "5-Star Average" },
  { icon: HeartHandshake, label: "Veteran Operated" },
  { icon: Sparkles, label: "Window Cleaning" },
  { icon: Leaf, label: "Lawn Care & Landscaping" },
  { icon: Snowflake, label: "Snow Removal" },
  { icon: Droplets, label: "Pressure Washing" },
  { icon: MapPin, label: "Ottawa Valley" },
];

/**
 * Edge-faded, auto-scrolling trust chip marquee. Sits between hero and the
 * divisions overview to add immediate visual motion + reinforce trust
 * signals at a glance. Hover (desktop) pauses; reduced-motion freezes.
 */
export function TrustMarquee() {
  return (
    <section className="relative py-6 sm:py-8 border-y border-surface-border/70 bg-surface/30 backdrop-blur-sm">
      <Marquee duration={42}>
        {chips.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-2 text-sm font-medium text-muted-foreground whitespace-nowrap"
          >
            <Icon className="h-4 w-4 text-primary" />
            <span>{label}</span>
            <span className="ml-12 h-1 w-1 rounded-full bg-muted-foreground/40" />
          </span>
        ))}
      </Marquee>
    </section>
  );
}

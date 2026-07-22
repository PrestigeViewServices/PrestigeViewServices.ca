import Link from "next/link";
import { Sunrise, Snowflake, Leaf, Mountain, type LucideIcon } from "lucide-react";
import type { DivisionSlug } from "@/lib/content/divisions";
import { LogoWithFallback } from "./logo-with-fallback";
import { cn } from "@/lib/utils";

type LockupVariant = "master" | DivisionSlug;
type LockupSize = "sm" | "md" | "lg";
/**
 * Pick the right logo file for the surrounding background.
 * - "dark" (default): white-outlined wordmark, designed for dark backgrounds
 *   (header, footer, hero sections, admin shell).
 * - "light": solid black wordmark, designed for light/white backgrounds
 *   (e.g. printable views, light-themed sub-pages).
 */
type LockupTheme = "dark" | "light";

type VariantConfig = {
  /** Logo image path under /public. For "master", we swap per `theme`. */
  src: string;
  /** Light-bg override for "master"; other variants fall back to `src`. */
  srcLight?: string;
  alt: string;
  textTitle: string; // fallback wordmark
  textSub: string;   // fallback sub-line
  Icon: LucideIcon;
  Accent?: LucideIcon | null;
  /** Gradient used by the fallback icon tile. */
  accent: "master" | DivisionSlug;
};

const VARIANTS: Record<LockupVariant, VariantConfig> = {
  master: {
    src: "/images/logo.png",
    srcLight: "/images/logo-light.png",
    alt: "Prestige View Services",
    textTitle: "Prestige View Services",
    textSub: "Year-Round Property Care",
    Icon: Sunrise,
    Accent: Snowflake,
    accent: "master",
  },
  lawnpros: {
    src: "/images/divisions/lawnpros.png",
    alt: "PVS LawnPros",
    textTitle: "PVS LawnPros",
    textSub: "Lawn Care, Modernized",
    Icon: Leaf,
    Accent: null,
    accent: "lawnpros",
  },
  clearview: {
    src: "/images/divisions/clearview.png",
    alt: "PVS ClearView",
    textTitle: "PVS ClearView",
    textSub: "Window Care, Modernized",
    Icon: Mountain,
    Accent: null,
    accent: "clearview",
  },
  snowland: {
    src: "/images/divisions/snowland.png",
    alt: "PVS SnowLand",
    textTitle: "PVS SnowLand",
    textSub: "Snow & Ice, Handled",
    Icon: Snowflake,
    Accent: null,
    accent: "snowland",
  },
};

const SIZES: Record<LockupSize, { imgClass: string; w: number; h: number }> = {
  sm: { imgClass: "h-9 w-auto", w: 720, h: 180 },
  md: { imgClass: "h-12 w-auto", w: 960, h: 240 },
  lg: { imgClass: "h-16 sm:h-20 w-auto", w: 1280, h: 320 },
};

const accentGradient: Record<VariantConfig["accent"], string> = {
  master: "from-blue-400 to-blue-600",
  lawnpros: "from-emerald-400 to-emerald-600",
  clearview: "from-blue-400 to-blue-600",
  snowland: "from-sky-400 to-sky-600",
};

/**
 * Master + division brand lockups. Renders the image from /public/images/
 * via next/image. If the file is missing, falls back to a text + icon lockup
 * styled in the division's accent color, page never breaks.
 */
export function BrandLockup({
  variant = "master",
  className,
  href = "/",
  size = "sm",
  theme = "dark",
}: {
  variant?: LockupVariant;
  className?: string;
  href?: string;
  size?: LockupSize;
  theme?: LockupTheme;
}) {
  const v = VARIANTS[variant];
  const s = SIZES[size];
  const src = theme === "light" && v.srcLight ? v.srcLight : v.src;

  return (
    <Link
      href={href}
      aria-label={`${v.textTitle}, home`}
      className={cn(
        "group inline-flex items-center gap-3 outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-md",
        className
      )}
    >
      <LogoWithFallback
        src={src}
        alt={v.alt}
        width={s.w}
        height={s.h}
        priority={size !== "sm"}
        className={s.imgClass}
        fallback={<TextLockup variant={variant} />}
      />
    </Link>
  );
}

function TextLockup({ variant }: { variant: LockupVariant }) {
  const v = VARIANTS[variant];
  const { Icon, Accent } = v;
  return (
    <span className="inline-flex items-center gap-3">
      <span
        className={cn(
          "relative grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br shrink-0",
          accentGradient[v.accent]
        )}
      >
        <Icon className="h-5 w-5 text-white" />
        {Accent && (
          <Accent className="absolute -bottom-1 -right-1 h-3.5 w-3.5 text-white/95 drop-shadow" />
        )}
      </span>
      <span className="flex flex-col leading-tight">
        <span className="text-[15px] font-bold tracking-tight">
          {v.textTitle}
        </span>
        <span className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {v.textSub}
        </span>
      </span>
    </span>
  );
}

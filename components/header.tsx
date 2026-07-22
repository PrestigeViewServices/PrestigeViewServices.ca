"use client";

import Link from "next/link";
import { useState } from "react";
import {
  ChevronDown,
  Menu,
  Phone,
  LifeBuoy,
  Snowflake,
  CalendarHeart,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { BrandLockup } from "@/components/brand-lockup";
import { AuthControls } from "@/components/auth-controls";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

// Top-tier conversion routes, pinned at the top of the mobile sheet AND
// the desktop "Explore" dropdown. Pushing the estimator + reservation
// flow is more valuable than any informational page.
const featuredLinks = [
  { href: "/care-plans", label: "Care Plans", icon: CalendarHeart },
  { href: "/winter-packages", label: "Winter Packages", icon: Snowflake },
] as const;

const exploreLinks = [
  { href: "/services", label: "All Services" },
  { href: "/service-areas", label: "Service Areas" },
  { href: "/our-work", label: "Our Work" },
  { href: "/reviews", label: "Reviews" },
  { href: "/careers", label: "Careers" },
  { href: "/support", label: "Customer Support" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
  { href: "/admin", label: "Admin Dashboard" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const phoneHref = `tel:${formatPhone(siteConfig.phone)}`;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-surface-border/60 bg-background/80 backdrop-blur-md supports-[backdrop-filter]:bg-background/60">
      <div className="container-max flex h-16 items-center justify-between gap-4">
        <BrandLockup />

        {/* Desktop nav */}
        <nav className="hidden lg:flex items-center gap-1">
          <Link
            href="/services"
            className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors"
          >
            Services
          </Link>

          {featuredLinks.map((l) => {
            const Icon = l.icon;
            return (
              <Link
                key={l.href}
                href={l.href}
                className="inline-flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
              >
                <Icon className="h-4 w-4" />
                {l.label}
              </Link>
            );
          })}

          <DropdownMenu>
            <DropdownMenuTrigger className="inline-flex items-center gap-1 rounded-full px-4 py-2 text-sm font-medium text-foreground/90 hover:bg-surface focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring transition-colors">
              Explore
              <ChevronDown className="h-4 w-4 opacity-70" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start">
              {exploreLinks.map((l) => (
                <DropdownMenuItem key={l.href} asChild>
                  <Link href={l.href}>{l.label}</Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        {/* Right actions (desktop) */}
        <div className="hidden lg:flex items-center gap-2">
          <Button asChild variant="ghost" size="sm">
            <a href={phoneHref} className="flex items-center gap-1.5">
              <Phone className="h-4 w-4" />
              Call
            </a>
          </Button>
          <Button asChild variant="ghost" size="sm">
            <Link href="/contact" className="flex items-center gap-1.5">
              <LifeBuoy className="h-4 w-4" />
              Support
            </Link>
          </Button>
          <Button asChild size="md">
            <Link href="/quote">Get Quote</Link>
          </Button>
          <AuthControls />
        </div>

        {/* Mobile actions */}
        <div className="flex lg:hidden items-center gap-2">
          <Button asChild variant="ghost" size="sm" aria-label="Call us">
            <a href={phoneHref}>
              <Phone className="h-4 w-4" />
            </a>
          </Button>
          <Button asChild size="sm">
            <Link href="/quote">Get Quote</Link>
          </Button>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="outline"
                size="icon"
                aria-label="Open navigation"
              >
                <Menu className="h-5 w-5" />
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[88vw] sm:max-w-sm p-0">
              <SheetHeader className="border-b border-surface-border">
                <SheetTitle className="sr-only">Navigation</SheetTitle>
                <BrandLockup />
              </SheetHeader>
              <div className="flex flex-col gap-1 p-4 overflow-y-auto">
                <p className="px-2 pt-2 text-xs uppercase tracking-wider text-primary">
                  Get a Quote
                </p>
                {featuredLinks.map((l) => {
                  const Icon = l.icon;
                  return (
                    <Link
                      key={l.href}
                      href={l.href}
                      onClick={() => setOpen(false)}
                      className="flex items-center gap-3 rounded-lg border border-primary/30 bg-primary/10 px-3 py-3 hover:bg-primary/20 transition-colors"
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-lg bg-primary/20 text-primary shrink-0">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-semibold">{l.label}</span>
                    </Link>
                  );
                })}
                <div className="h-px bg-surface-border my-3 mx-2" />
                <p className="px-2 text-xs uppercase tracking-wider text-muted-foreground">
                  Explore
                </p>
                {exploreLinks.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={() => setOpen(false)}
                    className="rounded-lg px-3 py-2.5 hover:bg-white/5 transition-colors"
                  >
                    {l.label}
                  </Link>
                ))}
                <div className="h-px bg-surface-border my-2 mx-2" />
                <div className="px-2 py-3 space-y-2">
                  <Button asChild size="lg" className="w-full">
                    <Link href="/quote" onClick={() => setOpen(false)}>
                      Get Quote
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg" className="w-full">
                    <a href={phoneHref}>
                      <Phone className="h-4 w-4" />
                      {siteConfig.phoneDisplay}
                    </a>
                  </Button>
                </div>
                <div className="px-3 py-2">
                  <AuthControls compact />
                </div>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}

import Link from "next/link";
import { Phone, Mail, MapPin, Clock, Facebook, Instagram } from "lucide-react";
import { BrandLockup } from "@/components/brand-lockup";
import { ReviewCta } from "@/components/review-cta";
import { divisions } from "@/lib/content/divisions";
import { services } from "@/lib/content/services";
import { serviceAreas } from "@/lib/content/service-areas";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";

export function Footer() {
  // Pick a few popular services per the lead-gen funnel
  const featured = services.filter((s) =>
    [
      "lawn-mowing",
      "window-cleaning",
      "snow-removal",
      "gutter-cleaning",
      "pressure-washing",
      "spring-cleanup",
    ].includes(s.slug)
  );

  return (
    <footer className="mt-12 border-t border-surface-border bg-background/60">
      <div className="container-max py-14">
        <div className="grid gap-10 md:grid-cols-12">
          <div className="md:col-span-4">
            <BrandLockup />
            <p className="mt-4 text-sm text-muted-foreground max-w-xs leading-relaxed">
              {siteConfig.tagline}. Proudly serving {siteConfig.serviceArea}.
            </p>
            <div className="mt-5 flex items-center gap-3">
              <a
                href={siteConfig.social.facebook}
                aria-label="Facebook"
                className="grid h-9 w-9 place-items-center rounded-full border border-surface-border hover:bg-white/5 transition-colors"
              >
                <Facebook className="h-4 w-4" />
              </a>
              <a
                href={siteConfig.social.instagram}
                aria-label="Instagram"
                className="grid h-9 w-9 place-items-center rounded-full border border-surface-border hover:bg-white/5 transition-colors"
              >
                <Instagram className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div className="md:col-span-2">
            <h3 className="text-sm font-semibold mb-4">Divisions</h3>
            <ul className="space-y-2.5 text-sm">
              {divisions.map((d) => (
                <li key={d.slug}>
                  <Link
                    href={`/divisions/${d.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {d.shortName}
                  </Link>
                </li>
              ))}
            </ul>
            <h3 className="text-sm font-semibold mb-4 mt-7">Service Areas</h3>
            <ul className="space-y-2.5 text-sm">
              {serviceAreas.slice(0, 6).map((a) => (
                <li key={a.slug}>
                  <Link
                    href={`/service-areas/${a.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {a.name}
                  </Link>
                </li>
              ))}
              <li>
                <Link
                  href="/service-areas"
                  className="text-primary hover:text-foreground transition-colors"
                >
                  All areas →
                </Link>
              </li>
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold mb-4">Popular Services</h3>
            <ul className="space-y-2.5 text-sm">
              {featured.map((s) => (
                <li key={s.slug}>
                  <Link
                    href={`/services/${s.slug}`}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="md:col-span-3">
            <h3 className="text-sm font-semibold mb-4">Contact</h3>
            <ul className="space-y-3 text-sm text-muted-foreground">
              <li className="flex items-start gap-2">
                <MapPin className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>{siteConfig.serviceArea}</span>
              </li>
              <li className="flex items-start gap-2">
                <Phone className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <a
                  href={`tel:${formatPhone(siteConfig.phone)}`}
                  className="hover:text-foreground transition-colors"
                >
                  {siteConfig.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Mail className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <a
                  href={`mailto:${siteConfig.email}`}
                  className="hover:text-foreground transition-colors"
                >
                  {siteConfig.email}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <Clock className="h-4 w-4 mt-0.5 shrink-0 opacity-70" />
                <span>{siteConfig.hours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 pt-6 border-t border-surface-border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs text-muted-foreground">
          <p>
            © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <ReviewCta variant="link" />
            <Link href="/about" className="hover:text-foreground">
              About
            </Link>
            <Link href="/careers" className="hover:text-foreground">
              Careers
            </Link>
            <Link href="/contact" className="hover:text-foreground">
              Contact
            </Link>
            <Link href="/admin" className="hover:text-foreground">
              Admin
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import {
  workCategories,
  populatedWorkCategories,
} from "@/lib/content/work-categories";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";

export const metadata: Metadata = {
  title: "Our Work — Recent Jobs Across the Ottawa Valley",
  description:
    "See real before/after photos from Prestige View Services jobs across Petawawa, Pembroke, and the Ottawa Valley — window cleaning, lawn care, snow removal, and more.",
  alternates: { canonical: "/our-work" },
};

export default function OurWorkIndexPage() {
  const populated = populatedWorkCategories();
  const coming = workCategories.filter((c) => c.photos.length === 0);

  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Our Work"
          title="Real Jobs, Real Properties"
          description="A growing showcase of the homes and storefronts we've cleaned, cleared, and cared for across the Ottawa Valley."
        />
      </section>

      <section className="container-max py-12 sm:py-16">
        {populated.length === 0 ? (
          <p className="mx-auto max-w-xl text-center text-muted-foreground">
            New photos are being added shortly. In the meantime, browse our{" "}
            <Link href="/services" className="text-primary underline">
              services
            </Link>{" "}
            or{" "}
            <Link href="/quote" className="text-primary underline">
              request a quote
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {populated.map((category) => {
              const cover = category.photos[0];
              return (
                <Link
                  key={category.slug}
                  href={`/our-work/${category.slug}`}
                  className="group relative block overflow-hidden rounded-2xl border border-surface-border bg-surface/60"
                >
                  <div className="relative aspect-[3/2]">
                    <Image
                      src={cover.src}
                      alt={cover.alt}
                      fill
                      sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
                      className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    />
                    <div
                      aria-hidden
                      className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent"
                    />
                  </div>
                  <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                    <div className="flex items-center gap-2 text-xs uppercase tracking-wider opacity-80">
                      <category.icon className="h-3.5 w-3.5" />
                      {category.shortName}
                    </div>
                    <h3 className="mt-1 text-xl font-semibold">
                      {category.name}
                    </h3>
                    <p className="mt-1 text-sm text-white/80 line-clamp-2">
                      {category.description}
                    </p>
                    <div className="mt-3 inline-flex items-center gap-1 text-sm font-medium">
                      View gallery
                      <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {coming.length > 0 && (
          <div className="mt-12 rounded-2xl border border-surface-border bg-surface/40 p-6 text-center">
            <p className="text-sm uppercase tracking-wider text-muted-foreground">
              Coming soon
            </p>
            <p className="mt-2 text-base text-foreground/90">
              {coming.map((c) => c.shortName).join(" · ")}
            </p>
          </div>
        )}
      </section>

      <CtaBand />
    </>
  );
}

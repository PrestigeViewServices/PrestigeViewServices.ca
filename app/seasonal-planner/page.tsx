import type { Metadata } from "next";
import Link from "next/link";
import { SectionHeading } from "@/components/section-heading";
import { SeasonalPlanner } from "@/components/seasonal-planner";
import { CtaBand } from "@/components/cta-band";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const metadata: Metadata = {
  title: "The Ottawa Valley Property Calendar, Month by Month",
  description:
    "What your Petawawa or Pembroke property needs every month of the year: lawn, gutters, washing, and snow, timed for real Ottawa Valley seasons.",
  alternates: { canonical: "/seasonal-planner" },
  openGraph: {
    title: "The Ottawa Valley Property Calendar",
    description:
      "Pick a month, see exactly what your Valley property needs, from the crew that does the work year-round.",
    url: `${siteConfig.url}/seasonal-planner`,
  },
};

// Rendered per-request so the planner always opens on the actual current
// month in Ottawa time (a static build would freeze the build month).
export const dynamic = "force-dynamic";

export default function SeasonalPlannerPage() {
  const initialMonth =
    Number(
      new Intl.DateTimeFormat("en-CA", {
        timeZone: "America/Toronto",
        month: "numeric",
      }).format(new Date())
    ) || 1;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: siteConfig.url },
      {
        "@type": "ListItem",
        position: 2,
        name: "Seasonal Planner",
        item: `${siteConfig.url}/seasonal-planner`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Plan Like a Local"
          title="The Ottawa Valley Property Calendar"
          description="Four real seasons, one sandy valley, and a property that needs different things every month. Pick a month and Sam will show you what matters right now, and what to line up next."
        />
      </section>

      <section className="container-max py-10 sm:py-14">
        <SeasonalPlanner initialMonth={initialMonth} />
      </section>

      <section className="container-max pb-14 sm:pb-16">
        <div className="mx-auto max-w-2xl rounded-3xl border border-primary/25 bg-primary/5 p-6 text-center sm:p-8">
          <h2 className="text-lg font-semibold">
            Booked up before the leaves even fall?
          </h2>
          <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
            Autumn is the busiest stretch of our year. Get your fall cleanup
            and gutter cleaning on the schedule now and the whole property
            goes into winter sorted.
          </p>
          <div className="mt-5 flex flex-col justify-center gap-3 sm:flex-row">
            <Button asChild>
              <Link href="/quote?service=fall-cleanup">Book a Fall Cleanup</Link>
            </Button>
            <Button asChild variant="outline">
              <Link href="/quote">Get a Free Quote</Link>
            </Button>
          </div>
        </div>
      </section>

      <CtaBand />
    </>
  );
}

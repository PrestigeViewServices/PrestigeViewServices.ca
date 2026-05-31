import type { Metadata } from "next";
import { divisions } from "@/lib/content/divisions";
import { servicesByDivision } from "@/lib/content/services";
import { ServiceCard } from "@/components/service-card";
import { SectionHeading } from "@/components/section-heading";
import { CtaBand } from "@/components/cta-band";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";

export const metadata: Metadata = {
  title: "All Services — Lawn Care, Window Cleaning, Snow Removal",
  description:
    "Browse every PVS service across LawnPros, ClearView, and SnowLand — lawn mowing, gutter cleaning, pressure washing, snow contracts, and more.",
  alternates: { canonical: "/services" },
};

export default function ServicesPage() {
  return (
    <>
      <section className="container-max pt-14 sm:pt-20 pb-4">
        <SectionHeading
          eyebrow="Everything PVS"
          title="All Services"
          description="One crew for every season. Pick a division below or get a quote for multiple services at once."
        />
      </section>

      <section className="container-max pb-16">
        <Tabs defaultValue="lawnpros" className="flex flex-col items-center">
          <TabsList className="mx-auto">
            {divisions.map((d) => (
              <TabsTrigger key={d.slug} value={d.slug}>
                {d.shortName}
              </TabsTrigger>
            ))}
          </TabsList>

          {divisions.map((d) => {
            const list = servicesByDivision(d.slug);
            return (
              <TabsContent
                key={d.slug}
                value={d.slug}
                className="w-full"
              >
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                  {list.map((s) => (
                    <ServiceCard key={s.slug} service={s} />
                  ))}
                </div>
              </TabsContent>
            );
          })}
        </Tabs>
      </section>

      <CtaBand />
    </>
  );
}

import {
  ShieldCheck,
  RotateCcw,
  MapPin,
  HeartHandshake,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const items = [
  {
    icon: ShieldCheck,
    title: "Fully Insured",
    body: "Liability coverage on every job, every visit.",
  },
  {
    icon: MapPin,
    title: "Locally Owned",
    body: "Born in the Ottawa Valley. Crews you'll recognize.",
  },
  {
    icon: RotateCcw,
    title: "Recurring Service",
    body: "Set it once. Reliable schedules, all season long.",
  },
  {
    icon: HeartHandshake,
    title: "Satisfaction Guarantee",
    body: "Not happy? We come back and make it right.",
  },
];

export function TrustStrip() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Why PVS"
        title="Built for Property Owners Who Want It Handled"
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {items.map(({ icon: Icon, title, body }) => (
          <div
            key={title}
            className="surface-card p-6"
          >
            <div className="grid h-11 w-11 place-items-center rounded-xl bg-primary/15 text-primary">
              <Icon className="h-5 w-5" />
            </div>
            <h3 className="mt-4 text-lg font-semibold">{title}</h3>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

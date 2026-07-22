import {
  DollarSign,
  TrendingUp,
  GraduationCap,
  Wrench,
  Snowflake,
  Users,
} from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const reasons = [
  {
    icon: DollarSign,
    title: "Competitive pay",
    body: "Pay scales we publish, not 'depends on experience' games. Honest rates from day one.",
  },
  {
    icon: TrendingUp,
    title: "Clear growth path",
    body: "Crew Member → Crew Lead → Division Manager. Promotions every 1–2 strong seasons.",
  },
  {
    icon: GraduationCap,
    title: "We train you",
    body: "Ladders, equipment, customer interaction. You don't need experience, you need work ethic.",
  },
  {
    icon: Wrench,
    title: "Modern equipment",
    body: "Sharp blades, working trucks, gear that's maintained. The kit you need to do the job right.",
  },
  {
    icon: Snowflake,
    title: "Year-round work",
    body: "Lawn in the spring & summer, exterior in the fall, snow in the winter. Income doesn't stop.",
  },
  {
    icon: Users,
    title: "Local team",
    body: "Owned and crewed by Petawawa & Pembroke locals. We work where we live.",
  },
];

export function WhyPVS() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Why PVS"
        title="A real career, not just a summer job"
        description="What makes Prestige View Services different from the seasonal lawn outfit down the road."
      />
      <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {reasons.map(({ icon: Icon, title, body }) => (
          <div key={title} className="surface-card p-6">
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

import { ArrowRight, User, Users, ShieldCheck } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const steps = [
  {
    icon: User,
    title: "Crew Member",
    body: "Learn the standard. Run a position. Take pride in the work.",
    accent: "from-emerald-400 to-emerald-600",
  },
  {
    icon: Users,
    title: "Crew Lead",
    body: "Run your own 2–3 person crew. Own quality and route timing.",
    accent: "from-blue-400 to-blue-600",
  },
  {
    icon: ShieldCheck,
    title: "Division Manager",
    body: "Build the team. Run the schedule. Shape the standard.",
    accent: "from-sky-400 to-sky-600",
  },
];

export function GrowthPath() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Where this leads"
        title="We promote from within"
        description="Most of our Crew Leads and Division Managers started in the field. Show up, do the work, the next step is yours."
      />

      <ol className="mt-12 grid gap-5 sm:gap-4 lg:grid-cols-3 relative">
        {steps.map((s, i) => {
          const Icon = s.icon;
          return (
            <li
              key={s.title}
              className="surface-card p-6 flex flex-col items-start relative"
            >
              <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                Step {i + 1}
              </span>
              <div
                className={`mt-3 grid h-12 w-12 place-items-center rounded-xl bg-gradient-to-br ${s.accent}`}
              >
                <Icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                {s.body}
              </p>

              {i < steps.length - 1 && (
                <ArrowRight
                  aria-hidden
                  className="hidden lg:block absolute -right-3 top-1/2 -translate-y-1/2 h-6 w-6 text-muted-foreground/40"
                />
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}

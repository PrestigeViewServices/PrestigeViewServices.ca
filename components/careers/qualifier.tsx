import { Check } from "lucide-react";
import { SectionHeading } from "@/components/section-heading";

const traits = [
  "You show up on time, every day",
  "You hold a valid Ontario driver's license",
  "You have reliable transportation to our Petawawa yard",
  "You're physically able to work outdoors for full shifts",
  "You take pride in finishing a job to a standard",
  "You can pass a reference check",
];

export function Qualifier() {
  return (
    <section className="container-max py-20 sm:py-24">
      <SectionHeading
        eyebrow="Is this you?"
        title="What we look for"
        description="If most of these sound like you, apply. Experience matters less than dependability, we'll train the rest."
      />

      <ul className="mt-12 mx-auto max-w-2xl grid gap-3 sm:grid-cols-2">
        {traits.map((t) => (
          <li
            key={t}
            className="flex items-start gap-3 rounded-2xl border border-surface-border bg-surface/60 p-4"
          >
            <span className="grid h-7 w-7 place-items-center rounded-full bg-emerald-500/15 text-emerald-400 shrink-0">
              <Check className="h-4 w-4" strokeWidth={3} />
            </span>
            <span className="text-sm leading-relaxed">{t}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

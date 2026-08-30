import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight,
  Camera,
  Droplets,
  HardHat,
  Leaf,
  Search,
  ShieldCheck,
  Snowflake,
  Sparkles,
  Trash2,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { LeadForm } from "@/components/lead-form";

/**
 * The gutter cleaning page's modern treatment: the exact process, the
 * safety story (the real peace-of-mind angle for roof work), a before/after
 * pair from real jobs, the cross-sell bundle, and a native quote form
 * pre-filled to gutter cleaning.
 */

type Step = {
  icon: LucideIcon;
  title: string;
  body: string;
};

const HOW_WE_DO_IT: Step[] = [
  {
    icon: Search,
    title: "Inspection",
    body: "We walk the gutter runs first and flag sagging hangers, seam leaks, and anything starting to fail while it is still a cheap fix.",
  },
  {
    icon: Leaf,
    title: "Debris removal",
    body: "Every run cleared by hand and scoop. Packed, composted gunk comes out, not just the loose leaves on top.",
  },
  {
    icon: Droplets,
    title: "Downspout flush",
    body: "Each downspout flushed with water until it runs free. A clear gutter with a plugged downspout is still a flood.",
  },
  {
    icon: Camera,
    title: "Photo proof",
    body: "Photos of the cleared runs before we climb down, so you see the result without going up a ladder.",
  },
  {
    icon: Trash2,
    title: "Cleanup",
    body: "Debris bagged and hauled, walkways blown off. The only sign we were there is gutters that work.",
  },
];

const SAFETY_POINTS = [
  {
    icon: HardHat,
    title: "Harness and fall-arrest",
    body: "On roofs and tall ladder work, crew members tie off with fall-arrest gear. Nobody freelances at height.",
  },
  {
    icon: ShieldCheck,
    title: "Ladder standoffs",
    body: "Standoffs keep ladders off the gutter itself, so the equipment protecting your home never dents it.",
  },
  {
    icon: Sparkles,
    title: "Trained crew, insured",
    body: "The same trained, uniformed crew each season, fully insured for work on your home.",
  },
];

export function GutterShowcase() {
  return (
    <>
      {/* ── How we do it ── */}
      <section className="container-max pt-12">
        <div className="max-w-2xl">
          <p className="eyebrow text-primary">How We Do It</p>
          <h2 className="heading-section mt-2 text-balance">
            Five steps, photographed, every time
          </h2>
          <p className="mt-3 text-base leading-relaxed text-muted-foreground">
            A gutter clean you cannot see is a gutter clean you have to take
            on faith. Ours ends with photos.
          </p>
        </div>
        <ol className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
          {HOW_WE_DO_IT.map((step, i) => (
            <li
              key={step.title}
              className="rounded-2xl border border-surface-border bg-surface/50 p-4"
            >
              <div className="flex items-center gap-2.5">
                <span className="grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">
                  <step.icon className="h-4 w-4" aria-hidden />
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Step {i + 1}
                </span>
              </div>
              <h3 className="mt-3 text-sm font-semibold">{step.title}</h3>
              <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </section>

      {/* ── Before / after ── */}
      <section className="cv-auto container-max pt-12">
        <div className="grid gap-4 sm:grid-cols-2">
          <figure className="overflow-hidden rounded-2xl border border-surface-border">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/gallery/gutter-cleaning/gutter-packed-debris-before-cleaning.webp"
                alt="Gutter packed solid with composted leaves and debris before cleaning"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-black/70 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                Before
              </span>
            </div>
            <figcaption className="p-3 text-xs text-muted-foreground">
              Packed like this, gutters overflow at the first fall rain and
              freeze into ice dams by January.
            </figcaption>
          </figure>
          <figure className="overflow-hidden rounded-2xl border border-surface-border">
            <div className="relative aspect-[4/3]">
              <Image
                src="/images/gallery/gutter-cleaning/gutter-clean-after.jpg"
                alt="The same style of gutter run completely cleared after a PVS cleaning"
                fill
                loading="lazy"
                sizes="(max-width: 640px) 100vw, 50vw"
                className="object-cover"
              />
              <span className="absolute left-3 top-3 rounded-full bg-emerald-500/90 px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                After
              </span>
            </div>
            <figcaption className="p-3 text-xs text-muted-foreground">
              Cleared, flushed, and photographed on a real PVS job in the
              Ottawa Valley.
            </figcaption>
          </figure>
        </div>
      </section>

      {/* ── Safety and training ── */}
      <section className="cv-auto container-max pt-12">
        <div className="overflow-hidden rounded-3xl border border-surface-border bg-surface/60">
          <div className="grid items-stretch lg:grid-cols-[1.2fr_1fr]">
            <div className="p-6 sm:p-8">
              <p className="eyebrow text-primary">Safety &amp; Training</p>
              <h2 className="mt-2 text-xl font-bold sm:text-2xl">
                The peace-of-mind part nobody photographs
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Gutter work is roof work. The cheapest quote in town is
                usually someone on your roof with no gear and no coverage,
                and that risk lands on you as the homeowner.
              </p>
              <ul className="mt-5 space-y-4">
                {SAFETY_POINTS.map((p) => (
                  <li key={p.title} className="flex items-start gap-3">
                    <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-emerald-500/15 text-emerald-400">
                      <p.icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div>
                      <h3 className="text-sm font-semibold">{p.title}</h3>
                      <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                        {p.body}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative min-h-[240px] lg:min-h-0">
              <Image
                src="/images/careers/crew-roof-gutter-work.webp"
                alt="PVS crew member working a gutter run from the roof with safety equipment"
                fill
                loading="lazy"
                sizes="(max-width: 1024px) 100vw, 40vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Cross-sell bundle ── */}
      <section className="cv-auto container-max pt-12">
        <div className="overflow-hidden rounded-3xl border border-sky-400/25 bg-gradient-to-r from-blue-950 via-slate-900 to-sky-950 p-6 sm:p-8">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-[0.14em] text-sky-300">
                <Snowflake className="h-4 w-4 shrink-0" aria-hidden />
                One crew, three fall jobs
              </p>
              <h2 className="mt-2 text-xl font-bold text-white sm:text-2xl">
                Gutters + fall cleanup + winter snow, booked in one call
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-sky-100/80">
                The crew clearing your gutters can close out the yard the
                same week and hold your spot on the Winter 2026-27 snow
                route. Tick the snow box on the form below, or add fall
                cleanup in the notes, and we quote it all together.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row lg:flex-col">
              <Button asChild size="lg" variant="snowland">
                <a href="#quote-form">
                  Quote my gutters
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/services/fall-cleanup">See the fall bundle</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* ── Native quote form ── */}
      <section className="cv-auto container-max pt-10">
        <div className="mx-auto max-w-2xl">
          <LeadForm
            service="gutter-cleaning"
            sourcePage="gutter-cleaning-page"
            snowBundle
          />
        </div>
      </section>
    </>
  );
}

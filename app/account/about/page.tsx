import Link from "next/link";
import {
  Clock,
  Mail,
  MapPin,
  Medal,
  Phone,
  ShieldCheck,
  Sparkles,
  Star,
} from "lucide-react";
import { siteConfig } from "@/lib/site";

// Rendered inside the cookie-gated /account layout, so the route is
// dynamic — force-static here conflicted with the layout and broke the
// page in production.
export const dynamic = "force-dynamic";

/**
 * About PVS inside the portal — a trust page, not a brochure. Public
 * service-category labels only.
 */

const SERVICE_CATEGORIES: {
  name: string;
  accent: string;
  services: string[];
}[] = [
  {
    name: "Window & Exterior Cleaning",
    accent: "border-sky-500/25 bg-sky-500/10",
    services: [
      "Window cleaning (interior & exterior)",
      "House / siding soft wash",
      "Gutter cleaning",
      "Pressure washing (driveways & walkways)",
    ],
  },
  {
    name: "Lawn Care",
    accent: "border-emerald-500/25 bg-emerald-500/10",
    services: [
      "Weekly & bi-weekly mowing",
      "Hedge trimming & shrub care",
      "Spring & fall cleanups",
      "Landscaping projects",
    ],
  },
  {
    name: "Snow Removal",
    accent: "border-cyan-500/25 bg-cyan-500/10",
    services: [
      "Seasonal snow passes (driveway + apron)",
      "Walkway shovelling pass packs",
      "Salting & ice control",
      "Storm-response clearing",
    ],
  },
];

export default function AboutPvsPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="eyebrow text-primary">
          <Sparkles className="h-3.5 w-3.5" />
          About PVS
        </p>
        <h1 className="mt-1 text-2xl font-bold tracking-tight sm:text-3xl">
          The crew behind your clean views
        </h1>
      </header>

      {/* ---- Story ---- */}
      <section className="surface-card space-y-4 p-5 leading-relaxed sm:p-7">
        <p className="text-sm sm:text-base">
          Prestige View Services is a veteran-operated property care company
          based in Petawawa, Ontario. We started with a squeegee, a ladder,
          and a simple idea: do the unglamorous work so well that neighbours
          notice. Today our crews handle windows, siding, lawns, gutters, and
          Valley winters for hundreds of homes, same faces, same standard,
          season after season.
        </p>
        <p className="text-sm text-muted-foreground sm:text-base">
          Clear views start here. Whether it&apos;s a spring shine-up or a
          February storm at 5 a.m., our promise doesn&apos;t change: show up,
          do it right, send a photo when it&apos;s done. That&apos;s the PVS
          difference.
        </p>
      </section>

      {/* ---- Veteran discount ---- */}
      <section className="flex items-start gap-3 rounded-2xl border border-sky-400/25 bg-sky-500/5 p-5 sm:p-6">
        <Medal className="mt-0.5 h-5 w-5 shrink-0 text-sky-400" aria-hidden />
        <div className="text-sm leading-relaxed">
          <p className="font-semibold">
            Military, veterans &amp; first responders: 10% off, always.
          </p>
          <p className="mt-1 text-muted-foreground">
            We&apos;re proud to be part of the Garrison Petawawa community.
            The discount applies to every service, every time, and it stacks
            with your Prestige Club credits. Declare it in{" "}
            <Link
              href="/account/profile"
              className="font-medium text-primary hover:underline"
            >
              your profile
            </Link>{" "}
            and we&apos;ll verify on your first service.
          </p>
        </div>
      </section>

      {/* ---- Services ---- */}
      <section>
        <h2 className="text-lg font-semibold">What we do</h2>
        <div className="mt-3 grid gap-4 sm:grid-cols-3">
          {SERVICE_CATEGORIES.map((cat) => (
            <div
              key={cat.name}
              className={`rounded-2xl border p-5 ${cat.accent}`}
            >
              <h3 className="font-bold">{cat.name}</h3>
              <ul className="mt-3 space-y-1.5 text-sm text-foreground/90">
                {cat.services.map((s) => (
                  <li key={s}>{s}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* ---- Service areas ---- */}
      <section className="surface-card p-5 sm:p-7">
        <div className="flex items-center gap-2">
          <MapPin className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Where we work</h2>
        </div>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          Home base is Petawawa, with routes across Pembroke, Deep River, and
          the wider Ottawa Valley. Snow removal runs in Petawawa and is
          expanding into Pembroke this season, lawn and exterior services
          cover the whole Valley year-round.
        </p>
        <div className="mt-3 flex flex-wrap gap-2">
          {["Petawawa", "Pembroke", "Deep River", "Ottawa Valley"].map((t) => (
            <span
              key={t}
              className="rounded-full border border-surface-border bg-surface/60 px-3 py-1 text-xs"
            >
              {t}
            </span>
          ))}
        </div>
      </section>

      {/* ---- Trust bits ---- */}
      <section className="grid gap-4 sm:grid-cols-2">
        <div className="surface-card flex items-start gap-3 p-5">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Fully insured, photo-confirmed</p>
            <p className="mt-1 text-muted-foreground">
              Every crew is insured for residential and small commercial
              work, and you get photo updates after visits, quality you can
              see.
            </p>
          </div>
        </div>
        <div className="surface-card flex items-start gap-3 p-5">
          <Star className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <div className="text-sm leading-relaxed">
            <p className="font-semibold">Love the work? Tell the Valley.</p>
            <p className="mt-1 text-muted-foreground">
              A Google review earns you 250 club points once verified.{" "}
              <a
                href={siteConfig.googleReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary hover:underline"
              >
                Leave a review
              </a>
              .
            </p>
          </div>
        </div>
      </section>

      {/* ---- Contact ---- */}
      <section className="surface-card p-5 sm:p-7">
        <h2 className="text-lg font-semibold">Reach us</h2>
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-3">
          <div className="flex items-center gap-2.5">
            <Phone className="h-4 w-4 shrink-0 text-primary" />
            <a href={`tel:${siteConfig.phone}`} className="hover:underline">
              {siteConfig.phoneDisplay}
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <Mail className="h-4 w-4 shrink-0 text-primary" />
            <a
              href={`mailto:${siteConfig.email}`}
              className="break-all hover:underline"
            >
              {siteConfig.email}
            </a>
          </div>
          <div className="flex items-center gap-2.5">
            <Clock className="h-4 w-4 shrink-0 text-primary" />
            <span>{siteConfig.hours}</span>
          </div>
        </dl>
      </section>
    </div>
  );
}

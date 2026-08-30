import {
  BellRing,
  Camera,
  CheckCircle2,
  FileText,
  History,
  MapPin,
  Radar,
  Receipt,
  ShieldCheck,
} from "lucide-react";
import { POV_CARDS, type PovCard } from "@/lib/content/winter-campaign";

/**
 * "Your POV" — the winter from the customer's side of the phone, in three
 * beats: before, during, and after the storm. Each card carries a small
 * hand-built portal vignette (labelled Preview) instead of a screenshot so
 * no real customer data is ever shown.
 */
export function PovSection() {
  return (
    <section className="container-max py-14">
      <div className="max-w-2xl">
        <p className="eyebrow text-primary">Your POV</p>
        <h2 className="heading-section mt-2 text-balance">
          What winter looks like from your phone
        </h2>
        <p className="mt-3 text-base leading-relaxed text-muted-foreground">
          You sign once in the fall. After that, every storm follows the same
          script and you can watch it happen.
        </p>
      </div>

      <div className="mt-9 grid gap-5 lg:grid-cols-3">
        {POV_CARDS.map((card) => (
          <article key={card.key} className="surface-card flex flex-col p-6">
            <p className="eyebrow text-sky-300">{card.eyebrow}</p>
            <h3 className="mt-2 text-lg font-bold">{card.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {card.points.map((p) => (
                <li key={p} className="flex items-start gap-2">
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400"
                    aria-hidden
                  />
                  <span className="leading-relaxed text-muted-foreground">
                    {p}
                  </span>
                </li>
              ))}
            </ul>
            <div className="mt-auto pt-5">
              <Vignette kind={card.key} />
              <p className="mt-2 text-center text-[10px] uppercase tracking-wider text-muted-foreground/70">
                Preview of the Aurora portal
              </p>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}

/** Small stylized portal snippets, one per phase. Decorative only. */
function Vignette({ kind }: { kind: PovCard["key"] }) {
  if (kind === "before") {
    return (
      <Frame>
        <Row
          icon={<FileText className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
          title="Winter 2026-27 contract"
          chip="Active"
          chipTone="emerald"
        />
        <Row
          icon={<Radar className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
          title="Dispatch rule · 3 cm on your route"
          chip="Armed"
          chipTone="sky"
        />
        <Row
          icon={<ShieldCheck className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
          title="Markers staked · route spot held"
          chip="Done"
          chipTone="emerald"
        />
      </Frame>
    );
  }
  if (kind === "during") {
    return (
      <Frame>
        <Row
          icon={<BellRing className="h-3.5 w-3.5 text-amber-300" aria-hidden />}
          title="Crews dispatched · 11:42 PM"
          chip="3 cm"
          chipTone="sky"
        />
        <Row
          icon={<MapPin className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
          title="Your driveway is 2 stops away"
          chip="Live"
          chipTone="sky"
          pulse
        />
        <Row
          icon={<BellRing className="h-3.5 w-3.5 text-emerald-300" aria-hidden />}
          title="First pass complete · 2:04 AM"
          chip="Cleared"
          chipTone="emerald"
        />
      </Frame>
    );
  }
  return (
    <Frame>
      <Row
        icon={<History className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
        title="Visit #14 logged · 6:38 AM"
        chip="History"
        chipTone="sky"
      />
      <Row
        icon={<Camera className="h-3.5 w-3.5 text-amber-300" aria-hidden />}
        title="Photo proof attached"
        chip="Saved"
        chipTone="emerald"
      />
      <Row
        icon={<Receipt className="h-3.5 w-3.5 text-sky-300" aria-hidden />}
        title="Installment 3 of 6"
        chip="Paid"
        chipTone="emerald"
      />
    </Frame>
  );
}

function Frame({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="space-y-1.5 rounded-xl border border-white/10 bg-[#0A1220] p-2.5"
    >
      {children}
    </div>
  );
}

function Row({
  icon,
  title,
  chip,
  chipTone,
  pulse = false,
}: {
  icon: React.ReactNode;
  title: string;
  chip: string;
  chipTone: "sky" | "emerald";
  pulse?: boolean;
}) {
  const tone =
    chipTone === "emerald"
      ? "border-emerald-400/30 bg-emerald-500/10 text-emerald-300"
      : "border-sky-400/30 bg-sky-500/10 text-sky-200";
  return (
    <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/[0.03] px-2.5 py-2">
      <span className="shrink-0">{icon}</span>
      <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-white">
        {title}
      </p>
      <span
        className={`inline-flex shrink-0 items-center gap-1 rounded-full border px-1.5 py-0.5 text-[8px] font-bold uppercase tracking-wider ${tone}`}
      >
        {pulse && (
          <span className="relative flex h-1 w-1">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-sky-400 opacity-75" />
            <span className="relative inline-flex h-1 w-1 rounded-full bg-sky-300" />
          </span>
        )}
        {chip}
      </span>
    </div>
  );
}

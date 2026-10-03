"use client";

import { useState } from "react";
import {
  AlertCircle,
  ArrowRight,
  Building2,
  CheckCircle2,
  Leaf,
  Loader2,
  Phone,
  Snowflake,
  Tractor,
  Truck,
  Droplets,
} from "lucide-react";
import { leadSchema, LEAD_TOWNS } from "@/lib/lead-schema";
import { snowTown } from "@/lib/content/snow-coverage";
import { siteConfig } from "@/lib/site";
import { cn, formatPhone } from "@/lib/utils";

/**
 * Short-form quote capture: pick the job, pick the town, leave a name and
 * number. Posts to /api/leads, so it lands in the admin Leads Inbox (status
 * NEW) and fires the owner's email + text alert like every other native
 * intake. Kept to five taps on purpose; the office fills in the rest on
 * the callback.
 */

const CHOICES = [
  { value: "fall-cleanup", label: "Fall cleanup", icon: Leaf },
  { value: "snow-removal", label: "Snow removal", icon: Snowflake },
  { value: "commercial-snow-removal", label: "Commercial snow", icon: Building2 },
  { value: "gutter-cleaning", label: "Gutters", icon: Droplets },
] as const;

type Choice = (typeof CHOICES)[number]["value"];
type Town = (typeof LEAD_TOWNS)[number]["value"];

const SNOW = new Set<string>(["snow-removal", "commercial-snow-removal"]);

export function QuickQuote({
  origin,
  defaultService = "fall-cleanup",
  title = "Get your free quote",
  subtitle = "Takes 30 seconds. We call you back within one business day.",
  className,
  tone = "card",
}: {
  /** Where this form sits, e.g. "home-hero". Shown to the office on the lead. */
  origin: string;
  defaultService?: Choice;
  title?: string;
  subtitle?: string;
  className?: string;
  /** "glass" for use over a photo. */
  tone?: "card" | "glass";
}) {
  const [service, setService] = useState<Choice>(defaultService);
  const [town, setTown] = useState<Town | "">("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">(
    "idle"
  );
  const [serverError, setServerError] = useState<string | null>(null);

  const commercial = service === "commercial-snow-removal";
  const townInfo = SNOW.has(service) && town ? snowTown(town) : undefined;
  const tel = `tel:${formatPhone(siteConfig.phone)}`;

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const payload = {
      name,
      phone,
      email,
      service,
      town,
      propertyType: commercial ? "commercial" : "residential",
      company: commercial ? company : "",
      origin,
      hp,
    };
    const parsed = leadSchema.safeParse(payload);
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
    }
    if (!town) next.town = "Pick your town";
    setErrors(next);
    if (Object.keys(next).length) return;

    setStatus("sending");
    setServerError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok) {
        setStatus("error");
        setServerError(data?.error || "Something went wrong.");
        return;
      }
      setStatus("done");
    } catch {
      setStatus("error");
      setServerError("Network error.");
    }
  }

  const shell = cn(
    "rounded-2xl border p-5 sm:p-6 text-left",
    tone === "glass"
      ? "border-white/15 bg-slate-950/70 shadow-2xl backdrop-blur-xl"
      : "surface-card",
    className
  );

  if (status === "done") {
    return (
      <div className={shell} role="status">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-6 w-6" aria-hidden />
        </div>
        <p className="mt-4 text-xl font-bold">You&apos;re on the list, {name.split(" ")[0]}.</p>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          We&apos;ll call you at {phone} within one business day with your
          price{townInfo ? ` and your spot on the ${townInfo.name} route` : ""}.
          Need it sooner?
        </p>
        <a
          href={tel}
          className="mt-4 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call {siteConfig.phoneDisplay}
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className={shell} aria-label={title}>
      <p className="text-lg font-bold leading-tight text-white">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>

      <div className="hidden" aria-hidden>
        <input
          tabIndex={-1}
          autoComplete="off"
          value={hp}
          onChange={(e) => setHp(e.target.value)}
        />
      </div>

      <fieldset className="mt-4">
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What do you need?
        </legend>
        <div className="grid grid-cols-2 gap-2">
          {CHOICES.map((c) => {
            const active = service === c.value;
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={active}
                onClick={() => setService(c.value)}
                className={cn(
                  "flex items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition-colors",
                  active
                    ? "border-sky-400/70 bg-sky-400/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/25"
                )}
              >
                <c.icon
                  className={cn("h-4 w-4 shrink-0", active ? "text-sky-300" : "opacity-60")}
                  aria-hidden
                />
                {c.label}
              </button>
            );
          })}
        </div>
      </fieldset>

      <fieldset className="mt-4">
        <legend className="mb-2 flex w-full items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Where is the property?
          {errors.town && (
            <span className="normal-case tracking-normal text-destructive">{errors.town}</span>
          )}
        </legend>
        <div className="grid grid-cols-3 gap-2">
          {LEAD_TOWNS.map((t) => {
            const active = town === t.value;
            return (
              <button
                key={t.value}
                type="button"
                aria-pressed={active}
                onClick={() => setTown(t.value)}
                className={cn(
                  "rounded-xl border px-2 py-2.5 text-center text-sm font-medium leading-tight transition-colors",
                  active
                    ? "border-sky-400/70 bg-sky-400/15 text-white"
                    : "border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/25"
                )}
              >
                {t.value === "other" ? "Elsewhere" : t.label}
              </button>
            );
          })}
        </div>
        {townInfo && (
          <p className="mt-2 flex items-center gap-2 rounded-lg bg-sky-400/10 px-3 py-2 text-xs text-sky-100">
            {townInfo.slug === "pembroke" ? (
              <Truck className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
            ) : (
              <Tractor className="h-4 w-4 shrink-0 text-sky-300" aria-hidden />
            )}
            {townInfo.name} snow routes are cleared with{" "}
            {townInfo.equipment.toLowerCase()}.
          </p>
        )}
        {SNOW.has(service) && town === "other" && (
          <p className="mt-2 rounded-lg bg-amber-400/10 px-3 py-2 text-xs text-amber-100">
            Snow routes cover Petawawa and Pembroke. Send it anyway and we
            will tell you honestly if we can reach you.
          </p>
        )}
      </fieldset>

      <div className="mt-4 grid gap-3">
        {commercial && (
          <QField
            label="Business or property name"
            error={errors.company}
            value={company}
            onChange={setCompany}
            autoComplete="organization"
            placeholder="e.g. Main St. Plaza"
          />
        )}
        <QField
          label="Your name"
          error={errors.name}
          value={name}
          onChange={setName}
          autoComplete="name"
          placeholder="Full name"
        />
        <div className="grid gap-3 sm:grid-cols-2">
          <QField
            label="Phone"
            error={errors.phone}
            value={phone}
            onChange={setPhone}
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(613) 555-0199"
          />
          <QField
            label="Email"
            error={errors.email}
            value={email}
            onChange={setEmail}
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
          />
        </div>
      </div>

      {status === "error" && (
        <p className="mt-3 flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <span>
            {serverError} Call or text{" "}
            <a href={tel} className="font-semibold underline">
              {siteConfig.phoneDisplay}
            </a>
            .
          </span>
        </p>
      )}

      <button
        type="submit"
        disabled={status === "sending"}
        className="mt-5 inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-base font-semibold text-white shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] transition hover:brightness-110 disabled:opacity-70"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending
          </>
        ) : (
          <>
            Get my free quote
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
      <p className="mt-3 text-center text-xs text-muted-foreground">
        No payment, no obligation. Or call{" "}
        <a href={tel} className="font-semibold text-foreground">
          {siteConfig.phoneDisplay}
        </a>
      </p>
    </form>
  );
}

function QField({
  label,
  error,
  value,
  onChange,
  ...input
}: {
  label: string;
  error?: string;
  value: string;
  onChange: (v: string) => void;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <label className="block">
      <span className="mb-1 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        {label}
        {error && (
          <span className="normal-case tracking-normal text-destructive">{error}</span>
        )}
      </span>
      <input
        {...input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={!!error}
        className={cn(
          "h-11 w-full rounded-xl border bg-white/[0.04] px-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-sky-400/60 sm:text-sm",
          error ? "border-destructive/60" : "border-white/10"
        )}
      />
    </label>
  );
}

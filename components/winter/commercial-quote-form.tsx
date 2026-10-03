"use client";

import { useState } from "react";
import { AlertCircle, ArrowRight, Building2, CheckCircle2, Loader2, Phone } from "lucide-react";
import { leadSchema, LEAD_TOWNS } from "@/lib/lead-schema";
import { siteConfig } from "@/lib/site";
import { cn, formatPhone } from "@/lib/utils";

/**
 * Commercial snow quote. Posts to /api/leads as service
 * "commercial-snow-removal" (division SNOWLAND), so it lands in the admin
 * Leads Inbox flagged COMMERCIAL with the business name, town, and site
 * details folded into the lead's message and notes.
 */

const PROPERTY_KINDS = [
  "Retail / storefront",
  "Plaza or parking lot",
  "Multi-unit residential",
  "Office or clinic",
  "Church / community hall",
  "Industrial / yard",
  "Other",
];

const LOT_SIZES = [
  "Under 10 spaces",
  "10 to 30 spaces",
  "30 to 75 spaces",
  "75+ spaces",
  "Not sure",
];

const NEEDS = ["Plowing", "Walkway shovelling", "Salting / sanding", "Snow hauling or stacking"];

const BILLING = ["Seasonal contract", "Per event", "Not sure yet"];

export function CommercialQuoteForm({ id = "commercial-quote" }: { id?: string }) {
  const [company, setCompany] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [town, setTown] = useState<"" | "petawawa" | "pembroke" | "other">("");
  const [kind, setKind] = useState("");
  const [lot, setLot] = useState("");
  const [needs, setNeeds] = useState<string[]>(["Plowing"]);
  const [billing, setBilling] = useState("Seasonal contract");
  const [notes, setNotes] = useState("");
  const [hp, setHp] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [serverError, setServerError] = useState<string | null>(null);
  const tel = `tel:${formatPhone(siteConfig.phone)}`;

  function toggleNeed(n: string) {
    setNeeds((cur) => (cur.includes(n) ? cur.filter((x) => x !== n) : [...cur, n]));
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const message = [
      kind && `Property type: ${kind}`,
      lot && `Lot size: ${lot}`,
      needs.length && `Needs: ${needs.join(", ")}`,
      billing && `Billing preference: ${billing}`,
      notes.trim() && `Notes: ${notes.trim()}`,
    ]
      .filter(Boolean)
      .join("\n");
    const payload = {
      name,
      phone,
      email,
      service: "commercial-snow-removal",
      town,
      propertyType: "commercial",
      company,
      propertyAddress: address,
      message,
      origin: "commercial-page",
      hp,
    };
    const parsed = leadSchema.safeParse(payload);
    const next: Record<string, string> = {};
    if (!parsed.success) {
      for (const i of parsed.error.issues) next[String(i.path[0])] ??= i.message;
    }
    if (!company.trim()) next.company = "Required";
    if (!town) next.town = "Pick a town";
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

  if (status === "done") {
    return (
      <div id={id} className="surface-card scroll-mt-24 p-8 text-center" role="status">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" aria-hidden />
        </div>
        <h3 className="mt-5 text-2xl font-bold">Request received</h3>
        <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
          Thanks{name ? `, ${name.split(" ")[0]}` : ""}. We will reach out within one
          business day to book a site walk for {company || "your property"} and
          send a written quote.
        </p>
        <a
          href={tel}
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-gradient-primary px-6 py-3 text-sm font-semibold text-white"
        >
          <Phone className="h-4 w-4" aria-hidden />
          Call {siteConfig.phoneDisplay}
        </a>
      </div>
    );
  }

  return (
    <form id={id} onSubmit={submit} noValidate className="surface-card scroll-mt-24 space-y-5 p-6 sm:p-8">
      <div className="flex items-center gap-3">
        <span className="grid h-11 w-11 place-items-center rounded-xl bg-sky-400/15 text-sky-300">
          <Building2 className="h-5 w-5" aria-hidden />
        </span>
        <div>
          <h3 className="text-xl font-semibold leading-tight">Commercial snow quote</h3>
          <p className="text-sm text-muted-foreground">
            We reply within one business day and book a free site walk.
          </p>
        </div>
      </div>

      <div className="hidden" aria-hidden>
        <input tabIndex={-1} autoComplete="off" value={hp} onChange={(e) => setHp(e.target.value)} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Business / property name" error={errors.company} required>
          <input className={inputCls(errors.company)} value={company} onChange={(e) => setCompany(e.target.value)} autoComplete="organization" placeholder="Main St. Plaza" />
        </Field>
        <Field label="Your name" error={errors.name} required>
          <input className={inputCls(errors.name)} value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder="Full name" />
        </Field>
        <Field label="Phone" error={errors.phone} required>
          <input className={inputCls(errors.phone)} value={phone} onChange={(e) => setPhone(e.target.value)} type="tel" inputMode="tel" autoComplete="tel" placeholder="(613) 555-0199" />
        </Field>
        <Field label="Email" error={errors.email} required>
          <input className={inputCls(errors.email)} value={email} onChange={(e) => setEmail(e.target.value)} type="email" inputMode="email" autoComplete="email" placeholder="you@business.ca" />
        </Field>
        <Field label="Site address" error={errors.propertyAddress}>
          <input className={inputCls(errors.propertyAddress)} value={address} onChange={(e) => setAddress(e.target.value)} autoComplete="street-address" placeholder="123 Pembroke St W" />
        </Field>
        <Field label="Town" error={errors.town} required>
          <select className={inputCls(errors.town)} value={town} onChange={(e) => setTown(e.target.value as typeof town)}>
            <option value="">Select a town</option>
            {LEAD_TOWNS.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Property type">
          <select className={inputCls()} value={kind} onChange={(e) => setKind(e.target.value)}>
            <option value="">Select</option>
            {PROPERTY_KINDS.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
        <Field label="Approximate lot size">
          <select className={inputCls()} value={lot} onChange={(e) => setLot(e.target.value)}>
            <option value="">Select</option>
            {LOT_SIZES.map((k) => (
              <option key={k}>{k}</option>
            ))}
          </select>
        </Field>
      </div>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          What do you need?
        </legend>
        <div className="flex flex-wrap gap-2">
          {NEEDS.map((n) => (
            <Chip key={n} active={needs.includes(n)} onClick={() => toggleNeed(n)}>
              {n}
            </Chip>
          ))}
        </div>
      </fieldset>

      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          How would you like to pay?
        </legend>
        <div className="flex flex-wrap gap-2">
          {BILLING.map((b) => (
            <Chip key={b} active={billing === b} onClick={() => setBilling(b)}>
              {b}
            </Chip>
          ))}
        </div>
      </fieldset>

      <Field label="Anything we should know? (optional)">
        <textarea
          className={cn(inputCls(), "h-auto min-h-[96px] py-2.5")}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Opening hours, fire lanes, where snow can be piled, number of sites..."
        />
      </Field>

      {status === "error" && (
        <p className="flex items-start gap-2 rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" aria-hidden />
          <span>
            {serverError} Call{" "}
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
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-gradient-primary text-base font-semibold text-white transition hover:brightness-110 disabled:opacity-70"
      >
        {status === "sending" ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
            Sending
          </>
        ) : (
          <>
            Request my commercial quote
            <ArrowRight className="h-4 w-4" aria-hidden />
          </>
        )}
      </button>
    </form>
  );
}

function inputCls(error?: string) {
  return cn(
    "h-11 w-full rounded-xl border bg-white/[0.04] px-3.5 text-base text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-sky-400/60 sm:text-sm [&>option]:bg-slate-900",
    error ? "border-destructive/60" : "border-white/10"
  );
}

function Field({
  label,
  error,
  required,
  children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 flex items-baseline justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
        <span>
          {label}
          {required && <span className="ml-0.5 text-destructive">*</span>}
        </span>
        {error && <span className="normal-case tracking-normal text-destructive">{error}</span>}
      </span>
      {children}
    </label>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        "rounded-full border px-3.5 py-2 text-sm font-medium transition-colors",
        active
          ? "border-sky-400/70 bg-sky-400/15 text-white"
          : "border-white/10 bg-white/[0.03] text-foreground/80 hover:border-white/25"
      )}
    >
      {children}
    </button>
  );
}

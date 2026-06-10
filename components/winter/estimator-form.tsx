"use client";

import { useMemo, useState } from "react";
import { Check, Loader2, MapPin, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DRIVEWAY_SIZE_LABELS,
  DRIVEWAY_TIER_DEFS,
  SHOVELING_LABELS,
  SHOVELING_TIER_DEFS,
  estimateCents,
  formatCents,
  formatRange,
  type DrivewaySize,
  type DrivewayTier,
  type ShovelingTier,
} from "@/lib/content/winter-packages";

type SubmitState =
  | { kind: "idle" }
  | { kind: "submitting" }
  | { kind: "ok" }
  | { kind: "error"; message: string };

export function EstimatorForm() {
  // Selection state — drives both the live estimate display and the
  // payload posted to /api/winter-reservations on submit.
  const [drivewayTier, setDrivewayTier] = useState<DrivewayTier>("SILVER");
  const [drivewaySize, setDrivewaySize] = useState<DrivewaySize>("TWO_CAR");
  const [shovelingTier, setShovelingTier] = useState<ShovelingTier>("NONE");

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [streetAddress, setStreetAddress] = useState("");
  const [city, setCity] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [customerNotes, setCustomerNotes] = useState("");
  const [hp, setHp] = useState(""); // honeypot

  const [state, setState] = useState<SubmitState>({ kind: "idle" });

  const estimate = useMemo(
    () => estimateCents(drivewayTier, drivewaySize, shovelingTier),
    [drivewayTier, drivewaySize, shovelingTier]
  );

  const driveDef = DRIVEWAY_TIER_DEFS.find((t) => t.slug === drivewayTier)!;
  const shovelDef = SHOVELING_TIER_DEFS.find((t) => t.slug === shovelingTier);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState({ kind: "submitting" });

    const res = await fetch("/api/winter-reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        phone,
        streetAddress,
        city,
        region: "ON",
        postalCode,
        drivewayTier,
        drivewaySize,
        shovelingTier,
        customerNotes,
        hp,
      }),
    });

    if (res.ok) {
      setState({ kind: "ok" });
      return;
    }

    const body = (await res.json().catch(() => null)) as {
      error?: string;
      issues?: { path: string; message: string }[];
    } | null;
    const message =
      body?.issues?.[0]?.message ??
      body?.error ??
      "Something went wrong — please call us.";
    setState({ kind: "error", message });
  }

  if (state.kind === "ok") {
    return (
      <div className="surface-card p-8 text-center">
        <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald-500/15 text-emerald-300 mx-auto">
          <Check className="h-6 w-6" />
        </div>
        <h3 className="mt-5 text-xl font-semibold">Reservation received</h3>
        <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
          Thanks, {name.split(" ")[0] || "neighbour"} — we&apos;ll confirm your{" "}
          <strong className="text-foreground">{driveDef.name}</strong> package{" "}
          {shovelDef ? (
            <>
              with <strong className="text-foreground">{shovelDef.name}</strong>{" "}
            </>
          ) : null}
          and the final price within one business day. Estimated{" "}
          {formatRange(estimate)} for the season.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="surface-card p-6 sm:p-8 space-y-8">
      {/* Honeypot — hidden from real users */}
      <input
        type="text"
        name="hp"
        value={hp}
        onChange={(e) => setHp(e.target.value)}
        autoComplete="off"
        tabIndex={-1}
        aria-hidden="true"
        className="hidden"
      />

      <section className="space-y-5">
        <header>
          <h3 className="text-lg font-semibold">1. Pick your package</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Adjust the dropdowns to see your seasonal estimate update live.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <Field label="Driveway plowing tier">
            <Select
              value={drivewayTier}
              onValueChange={(v) => setDrivewayTier(v as DrivewayTier)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DRIVEWAY_TIER_DEFS.map((t) => (
                  <SelectItem key={t.slug} value={t.slug}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Driveway size">
            <Select
              value={drivewaySize}
              onValueChange={(v) => setDrivewaySize(v as DrivewaySize)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(DRIVEWAY_SIZE_LABELS) as [
                    DrivewaySize,
                    string,
                  ][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Walkway shoveling (optional)">
            <Select
              value={shovelingTier}
              onValueChange={(v) => setShovelingTier(v as ShovelingTier)}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(SHOVELING_LABELS) as [ShovelingTier, string][]
                ).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>

        <EstimateCallout
          drivewayTierName={driveDef.name}
          drivewaySizeLabel={DRIVEWAY_SIZE_LABELS[drivewaySize]}
          shovelingName={shovelDef?.name ?? null}
          rangeLabel={formatRange(estimate)}
          midLabel={formatCents(Math.round((estimate.low + estimate.high) / 2))}
        />
      </section>

      <section className="space-y-5 pt-6 border-t border-surface-border">
        <header>
          <h3 className="text-lg font-semibold">2. Reserve your spot</h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Submit your details and we&apos;ll confirm the final price within one
            business day. No payment is collected today.
          </p>
        </header>

        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Full name" required>
            <Input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              autoComplete="name"
            />
          </Field>
          <Field label="Phone" required>
            <Input
              required
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              autoComplete="tel"
              placeholder="(613) 555-0199"
            />
          </Field>
          <Field label="Email" required className="sm:col-span-2">
            <Input
              required
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
            />
          </Field>
          <Field label="Street address" required className="sm:col-span-2">
            <Input
              required
              value={streetAddress}
              onChange={(e) => setStreetAddress(e.target.value)}
              autoComplete="street-address"
            />
          </Field>
          <Field label="City" required>
            <Input
              required
              value={city}
              onChange={(e) => setCity(e.target.value)}
              autoComplete="address-level2"
              placeholder="Petawawa"
            />
          </Field>
          <Field label="Postal code">
            <Input
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              autoComplete="postal-code"
              placeholder="K8H 1A1"
            />
          </Field>
          <Field
            label="Anything we should know? (gate code, dogs, parking)"
            className="sm:col-span-2"
          >
            <Textarea
              rows={3}
              value={customerNotes}
              onChange={(e) => setCustomerNotes(e.target.value)}
              maxLength={1500}
            />
          </Field>
        </div>

        {state.kind === "error" && (
          <div className="flex items-start gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-sm text-rose-100">
            <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
            <span>{state.message}</span>
          </div>
        )}

        <Button
          type="submit"
          size="xl"
          className="w-full sm:w-auto"
          disabled={state.kind === "submitting"}
        >
          {state.kind === "submitting" ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Submitting…
            </>
          ) : (
            "Reserve my package"
          )}
        </Button>
      </section>
    </form>
  );
}

function Field({
  label,
  required,
  children,
  className,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <Label className="mb-1.5 block text-sm">
        {label}
        {required && <span className="text-primary"> *</span>}
      </Label>
      {children}
    </div>
  );
}

function EstimateCallout({
  drivewayTierName,
  drivewaySizeLabel,
  shovelingName,
  rangeLabel,
  midLabel,
}: {
  drivewayTierName: string;
  drivewaySizeLabel: string;
  shovelingName: string | null;
  rangeLabel: string;
  midLabel: string;
}) {
  return (
    <div className="rounded-2xl border border-primary/30 bg-primary/10 p-5 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
        <div>
          <p className="eyebrow text-primary">Estimated season cost</p>
          <p className="mt-2 text-3xl sm:text-4xl font-bold tracking-tight">
            {rangeLabel}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            About {midLabel} typical · final price confirmed after we review your
            property.
          </p>
        </div>
        <div className="text-sm text-muted-foreground sm:text-right">
          <p>
            <strong className="text-foreground">{drivewayTierName}</strong> ·{" "}
            {drivewaySizeLabel}
          </p>
          {shovelingName && (
            <p className="mt-0.5 inline-flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 opacity-70" />+ {shovelingName}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

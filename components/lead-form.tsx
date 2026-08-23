"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ClipboardList,
  Gift,
  Phone,
  Tag,
} from "lucide-react";
import {
  leadSchema,
  LEAD_SERVICES,
  LEAD_SERVICE_VALUES,
  type LeadFormValues,
} from "@/lib/lead-schema";
import { siteConfig } from "@/lib/site";
import { formatPhone } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/**
 * Native PVS lead form. Posts to /api/leads, which drops the lead straight
 * into the admin pipeline (status NEW) and emails the office. No third-party
 * embed. Pre-selects the service from ?service= links across the site.
 */
export type LeadFormProps = {
  id?: string;
  /** Raw ?service= slug from the URL, resolved by the server page. */
  service?: string | null;
  /** Raw ?ref= referral code from the URL, resolved by the server page. */
  referralCode?: string | null;
  /** e.g. "5%" — omit to hide the account push entirely. */
  accountDiscountLabel?: string | null;
  /** e.g. "$25" — what a referred friend saves on their first service. */
  referralCredit?: string | null;
};

/**
 * NOTE: this component deliberately does NOT call useSearchParams(). It used
 * to, wrapped in a Suspense boundary, and that boundary never resolved — every
 * visitor to /request-service saw an empty 400px card where the form should
 * be. The server page already reads searchParams, so it passes them in.
 */
export function LeadForm(props: LeadFormProps) {
  return <LeadFormInner {...props} />;
}

/** Map alias slugs used around the site onto dropdown values. */
function normalizeService(raw: string | null): LeadFormValues["service"] | undefined {
  if (!raw) return undefined;
  const aliases: Record<string, string> = {
    "seasonal-snow-contract": "snow-removal",
    "walkway-clearing": "snow-removal",
    "spring-cleanup": "lawn-mowing",
    aeration: "lawn-mowing",
    overseeding: "lawn-mowing",
    dethatching: "lawn-mowing",
  };
  const slug = aliases[raw] ?? raw;
  return (LEAD_SERVICE_VALUES as readonly string[]).includes(slug)
    ? (slug as LeadFormValues["service"])
    : undefined;
}

function LeadFormInner({
  id = "quote-form",
  service = null,
  referralCode = null,
  accountDiscountLabel = null,
  referralCredit = null,
}: LeadFormProps) {
  const presetService = normalizeService(service);
  // Carried in by /r/[code]. An httpOnly cookie backs this up server-side, so
  // the referral still counts even if the visitor strips the query string.
  const presetRef = (referralCode ?? "").trim().toUpperCase();
  const [showRefField, setShowRefField] = useState(Boolean(presetRef));
  const [status, setStatus] = useState<
    "idle" | "submitting" | "success" | "error"
  >("idle");
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    control,
    formState: { errors },
    reset,
  } = useForm<LeadFormValues>({
    resolver: zodResolver(leadSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      service: presetService as LeadFormValues["service"],
      promoCode: "",
      referralCode: presetRef,
      propertyAddress: "",
      message: "",
      hp: "",
    },
  });


  async function onSubmit(values: LeadFormValues) {
    setStatus("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setServerError(data?.error || "Something went wrong.");
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setServerError("Network error.");
    }
  }

  if (status === "success") {
    return (
      <div id={id} className="surface-card p-8 sm:p-10 text-center scroll-mt-24">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl sm:text-3xl font-bold">Request received</h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks, you're in our queue. A PVS team lead will reach out within one
          business day to confirm scope and pricing.
        </p>

        {presetRef && referralCredit && (
          <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
            <Gift className="h-4 w-4 shrink-0" aria-hidden />
            Your friend&apos;s {referralCredit} credit is attached to this
            request.
          </p>
        )}

        {accountDiscountLabel && (
          <div className="mx-auto mt-6 max-w-md rounded-2xl border border-primary/30 bg-primary/10 p-5 text-left">
            <p className="text-sm font-semibold">
              One more thing, and it saves you {accountDiscountLabel}
            </p>
            <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
              Create a free PVS account before we quote you and we&apos;ll take{" "}
              {accountDiscountLabel} off this service. You&apos;ll also earn
              points on every visit and be able to refer anyone you like.
            </p>
            <Link
              href="/account"
              className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-glow"
            >
              Create my free account
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}

        <Button
          variant="outline"
          className="mt-7"
          onClick={() => setStatus("idle")}
        >
          Submit another request
        </Button>
      </div>
    );
  }

  return (
    <form
      id={id}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="surface-card p-6 sm:p-8 space-y-6 scroll-mt-24"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <ClipboardList className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-tight">
            Get a free quote
          </h2>
          <p className="text-sm text-muted-foreground">
            Tell us what you need, we respond within one business day.
          </p>
        </div>
      </div>

      <div className="hidden" aria-hidden>
        <input tabIndex={-1} autoComplete="off" {...register("hp")} />
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message} required>
          <Input
            autoComplete="name"
            placeholder="Jane Smith"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message} required>
          <Input
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            placeholder="(613) 555-0199"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          inputMode="email"
          autoComplete="email"
          placeholder="you@example.com"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Service" error={errors.service?.message} required>
          <Controller
            control={control}
            name="service"
            render={({ field }) => (
              <Select
                value={field.value}
                onValueChange={field.onChange}
              >
                <SelectTrigger aria-invalid={!!errors.service}>
                  <SelectValue placeholder="Pick a service" />
                </SelectTrigger>
                <SelectContent>
                  {LEAD_SERVICES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="Property address (optional)"
          error={errors.propertyAddress?.message}
        >
          <Input
            autoComplete="street-address"
            placeholder="123 Maple Street, Petawawa"
            {...register("propertyAddress")}
          />
        </Field>
      </div>

      <Field label="Anything else? (optional)" error={errors.message?.message}>
        <Textarea
          placeholder="Lot size, number of windows, gate code, timing, whatever helps us quote accurately."
          rows={4}
          {...register("message")}
        />
      </Field>

      {status === "error" && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <div className="text-sm">
            <p className="text-destructive">{serverError}</p>
            <p className="mt-1">
              Or call/text us directly:{" "}
              <a
                href={`tel:${formatPhone(siteConfig.phone)}`}
                className="inline-flex items-center gap-1 font-semibold text-foreground"
              >
                <Phone className="h-3.5 w-3.5" aria-hidden />
                {siteConfig.phoneDisplay}
              </a>
            </p>
          </div>
        </div>
      )}

      {/* Referral code — prefilled from a /r/[code] link, or typed in by
          someone who was given a code by hand. */}
      {showRefField ? (
        <Field
          label="Referral code (optional)"
          error={errors.referralCode?.message}
        >
          <Input
            placeholder="JORDAN-4X2K"
            autoCapitalize="characters"
            className="font-mono uppercase"
            {...register("referralCode")}
          />
          {referralCredit && (
            <p className="text-xs text-muted-foreground">
              A valid code takes {referralCredit} off your first service and
              credits the person who sent you.
            </p>
          )}
        </Field>
      ) : (
        <button
          type="button"
          onClick={() => setShowRefField(true)}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
        >
          <Tag className="h-3.5 w-3.5" />
          Someone referred me
        </button>
      )}

      {accountDiscountLabel && (
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-4 text-sm">
          <p className="font-semibold">
            Save {accountDiscountLabel} with a free account
          </p>
          <p className="mt-1 text-muted-foreground leading-relaxed">
            Send this request first, then{" "}
            <Link href="/account" className="font-medium text-primary hover:underline">
              create your free account
            </Link>{" "}
            with the same email and we&apos;ll take {accountDiscountLabel} off
            this service.
          </p>
        </div>
      )}

      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Get My Free Quote"}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        Prefer to talk? Call or text{" "}
        <a
          href={`tel:${formatPhone(siteConfig.phone)}`}
          className="font-semibold text-foreground"
        >
          {siteConfig.phoneDisplay}
        </a>
      </p>
    </form>
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
    <div className="space-y-2">
      <Label className="flex items-baseline justify-between gap-2">
        <span>
          {label}
          {required && <span className="text-destructive ml-0.5">*</span>}
        </span>
        {error && (
          <span className="text-xs text-destructive font-normal">{error}</span>
        )}
      </Label>
      {children}
    </div>
  );
}

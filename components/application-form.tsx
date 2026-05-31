"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, Briefcase } from "lucide-react";
import {
  applicationSchema,
  EXPERIENCE_BUCKETS,
  YES_NO,
  type ApplicationFormValues,
} from "@/lib/application-schema";
import {
  activeRoles,
  CAREER_TYPES,
  GENERAL_APPLICATION_SLUG,
} from "@/lib/content/careers";
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
import { cn } from "@/lib/utils";

// TODO: add resume file upload (S3 / Vercel Blob / Supabase Storage).
//       For v1 we ask for a public link (Drive / Dropbox / LinkedIn) to
//       avoid the storage + virus-scanning overhead.

export function ApplicationForm({
  defaultRoleSlug = GENERAL_APPLICATION_SLUG,
  id = "apply",
}: {
  defaultRoleSlug?: string;
  id?: string;
}) {
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
  } = useForm<ApplicationFormValues>({
    resolver: zodResolver(applicationSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      role: defaultRoleSlug as ApplicationFormValues["role"],
      availability: "Flexible",
      validLicense: undefined as unknown as ApplicationFormValues["validLicense"],
      reliableCommute:
        undefined as unknown as ApplicationFormValues["reliableCommute"],
      yearsExperience:
        undefined as unknown as ApplicationFormValues["yearsExperience"],
      whyJoin: "",
      resumeUrl: "",
      hp: "",
    },
  });

  async function onSubmit(values: ApplicationFormValues) {
    setStatus("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setServerError(
          data?.error || "Something went wrong. Please email us instead."
        );
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setServerError(
        "Network error. Please try again or email us directly."
      );
    }
  }

  if (status === "success") {
    return (
      <div id={id} className="surface-card p-8 sm:p-10 text-center scroll-mt-24">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl sm:text-3xl font-bold">
          Application received
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks for applying. If your background looks like a fit, a PVS team
          lead will reach out within a few business days.
        </p>
        <Button
          variant="outline"
          className="mt-7"
          onClick={() => setStatus("idle")}
        >
          Submit another application
        </Button>
      </div>
    );
  }

  const roleOptions = activeRoles();

  return (
    <form
      id={id}
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="surface-card p-6 sm:p-8 space-y-6 scroll-mt-24"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <Briefcase className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-tight">Apply</h2>
          <p className="text-sm text-muted-foreground">
            Takes about 3 minutes. No résumé required to start.
          </p>
        </div>
      </div>

      {/* Honeypot */}
      <div className="hidden" aria-hidden>
        <label>
          Don't fill this out
          <input tabIndex={-1} autoComplete="off" {...register("hp")} />
        </label>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Full name" error={errors.name?.message} required>
          <Input
            placeholder="Jane Smith"
            autoComplete="name"
            aria-invalid={!!errors.name}
            {...register("name")}
          />
        </Field>
        <Field label="Phone" error={errors.phone?.message} required>
          <Input
            type="tel"
            placeholder="(613) 555-0199"
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
        </Field>
      </div>

      <Field label="Email" error={errors.email?.message} required>
        <Input
          type="email"
          placeholder="you@example.com"
          autoComplete="email"
          inputMode="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          label="Applying for"
          error={errors.role?.message}
          required
        >
          <Controller
            control={control}
            name="role"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.role}>
                  <SelectValue placeholder="Choose a role" />
                </SelectTrigger>
                <SelectContent>
                  {roleOptions.map((r) => (
                    <SelectItem key={r.slug} value={r.slug}>
                      {r.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
        <Field
          label="Availability"
          error={errors.availability?.message}
          required
        >
          <Controller
            control={control}
            name="availability"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.availability}>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {CAREER_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {t}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </div>

      <fieldset className="rounded-xl border border-surface-border bg-input/30 p-5 space-y-4">
        <legend className="px-2 text-xs uppercase tracking-wider text-muted-foreground">
          Quick screening
        </legend>

        <Controller
          control={control}
          name="validLicense"
          render={({ field }) => (
            <YesNoField
              label="Do you have a valid Ontario driver's license?"
              error={errors.validLicense?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Controller
          control={control}
          name="reliableCommute"
          render={({ field }) => (
            <YesNoField
              label="Can you reliably commute to the Petawawa / Pembroke area?"
              error={errors.reliableCommute?.message}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <Field
          label="Years of relevant experience"
          error={errors.yearsExperience?.message}
          required
        >
          <Controller
            control={control}
            name="yearsExperience"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.yearsExperience}>
                  <SelectValue placeholder="Pick a range" />
                </SelectTrigger>
                <SelectContent>
                  {EXPERIENCE_BUCKETS.map((b) => (
                    <SelectItem key={b} value={b}>
                      {b}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </Field>
      </fieldset>

      <Field
        label="Why do you want to work at PVS? (optional)"
        error={errors.whyJoin?.message}
      >
        <Textarea
          placeholder="A sentence or two is plenty — we're after fit, not essays."
          rows={4}
          {...register("whyJoin")}
        />
      </Field>

      <Field
        label="Résumé / LinkedIn URL (optional)"
        error={errors.resumeUrl?.message}
      >
        <Input
          type="url"
          placeholder="https://linkedin.com/in/you or a Drive link"
          autoComplete="off"
          {...register("resumeUrl")}
        />
      </Field>

      {status === "error" && serverError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 pt-2">
        <Button
          type="submit"
          size="xl"
          className="sm:flex-1"
          disabled={status === "submitting"}
        >
          {status === "submitting" ? "Sending…" : "Submit application"}
        </Button>
        <p className="text-xs text-muted-foreground self-center text-center sm:text-left">
          We review every application. No résumé? No problem to start.
        </p>
      </div>
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

function YesNoField({
  label,
  value,
  onChange,
  error,
}: {
  label: string;
  value: (typeof YES_NO)[number] | undefined;
  onChange: (v: (typeof YES_NO)[number]) => void;
  error?: string;
}) {
  return (
    <div className="space-y-2">
      <Label className="flex items-baseline justify-between gap-2">
        <span>
          {label}
          <span className="text-destructive ml-0.5">*</span>
        </span>
        {error && (
          <span className="text-xs text-destructive font-normal">{error}</span>
        )}
      </Label>
      <div className="flex gap-2">
        {YES_NO.map((opt) => {
          const selected = value === opt;
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(opt)}
              aria-pressed={selected}
              className={cn(
                "flex-1 rounded-xl border px-4 py-2.5 text-sm font-medium capitalize transition-colors",
                selected
                  ? "border-primary/60 bg-primary/10 text-foreground"
                  : "border-surface-border bg-input/40 text-muted-foreground hover:border-white/15 hover:text-foreground"
              )}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

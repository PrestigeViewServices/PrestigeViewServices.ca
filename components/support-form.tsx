"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle, LifeBuoy } from "lucide-react";
import {
  supportSchema,
  SUPPORT_TYPES,
  type SupportFormValues,
} from "@/lib/support-schema";
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

export function SupportForm() {
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
  } = useForm<SupportFormValues>({
    resolver: zodResolver(supportSchema),
    defaultValues: {
      name: "",
      phone: "",
      email: "",
      type: undefined as unknown as SupportFormValues["type"],
      propertyAddress: "",
      details: "",
      hp: "",
    },
  });

  async function onSubmit(values: SupportFormValues) {
    setStatus("submitting");
    setServerError(null);
    try {
      const res = await fetch("/api/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setStatus("error");
        setServerError(
          data?.error || "Something went wrong. Please call us instead."
        );
        return;
      }
      setStatus("success");
      reset();
    } catch {
      setStatus("error");
      setServerError("Network error. Please try again.");
    }
  }

  if (status === "success") {
    return (
      <div className="surface-card p-8 sm:p-10 text-center">
        <div className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-emerald-500/15 text-emerald-400">
          <CheckCircle2 className="h-7 w-7" />
        </div>
        <h2 className="mt-5 text-2xl sm:text-3xl font-bold">
          Request received
        </h2>
        <p className="mt-3 text-muted-foreground leading-relaxed max-w-md mx-auto">
          Thanks. The PVS team will reach out within one business day.
          Urgent? Call us directly.
        </p>
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
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className="surface-card p-6 sm:p-8 space-y-6"
    >
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-xl bg-primary/15 text-primary">
          <LifeBuoy className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-xl font-semibold leading-tight">
            How can we help?
          </h2>
          <p className="text-sm text-muted-foreground">
            We respond within one business day.
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
        <Field label="Request type" error={errors.type?.message} required>
          <Controller
            control={control}
            name="type"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger aria-invalid={!!errors.type}>
                  <SelectValue placeholder="Pick one" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORT_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
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
            placeholder="123 Maple Street"
            {...register("propertyAddress")}
          />
        </Field>
      </div>

      <Field label="What's going on?" error={errors.details?.message} required>
        <Textarea
          placeholder="A sentence or two of context helps us route this to the right crew."
          rows={5}
          {...register("details")}
        />
      </Field>

      {status === "error" && serverError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-start gap-2.5">
          <AlertCircle className="h-4 w-4 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{serverError}</p>
        </div>
      )}

      <Button
        type="submit"
        size="xl"
        className="w-full"
        disabled={status === "submitting"}
      >
        {status === "submitting" ? "Sending…" : "Send request"}
      </Button>
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

"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Sparkles, TrendingDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import {
  SERVICE_DEFS,
  buildYourOwnTotal,
  formatDollars,
  quoteHref,
  type ServiceKey,
} from "@/lib/content/care-plans";

const REDUCE_MOTION = { duration: 0.25, ease: [0.22, 1, 0.36, 1] as const };

/**
 * Build-Your-Own live calculator — the centerpiece.
 *
 * Toggle services on/off; the monthly price recalculates instantly and applies
 * the stacking discount (2 = 10% off, 3+ = 15% off). No page reload, no submit
 * to see the number — the math lives in `buildYourOwnTotal` so the UI and the
 * data file never drift.
 */
export function BuildYourOwn() {
  const [selected, setSelected] = useState<ServiceKey[]>(["house-wash"]);

  const toggle = (key: ServiceKey) =>
    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );

  const { subtotal, discountRate, savings, total } = useMemo(
    () => buildYourOwnTotal(selected),
    [selected]
  );

  const ctaHref = quoteHref({
    plan: "build-your-own",
    // Pass the chosen services so the quote can be pre-filled later.
    service: selected[0] ? `byo-${selected.join("-")}` : undefined,
  });

  return (
    <div className="surface-card overflow-hidden p-0">
      <div className="grid gap-0 md:grid-cols-2">
        {/* ---- Picker ---- */}
        <fieldset className="border-b border-surface-border p-6 sm:p-8 md:border-b-0 md:border-r">
          <legend className="eyebrow text-primary mb-1 flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            Build your plan
          </legend>
          <p className="mb-5 text-sm text-muted-foreground">
            Pick the services you want. We&apos;ll space them across the season
            on one monthly payment.
          </p>

          <div className="space-y-2.5">
            {SERVICE_DEFS.map((s) => {
              const isOn = selected.includes(s.key);
              const Icon = s.icon;
              return (
                <label
                  key={s.key}
                  className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 transition-colors ${
                    isOn
                      ? "border-primary/50 bg-primary/10"
                      : "border-surface-border bg-surface/50 hover:bg-surface"
                  }`}
                >
                  <Checkbox
                    checked={isOn}
                    onCheckedChange={() => toggle(s.key)}
                    aria-label={`Add ${s.label} — from ${formatDollars(
                      s.monthlyFrom
                    )} per month`}
                  />
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/15 text-primary">
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="flex-1 text-sm font-medium">{s.label}</span>
                  <span className="text-sm text-muted-foreground">
                    {formatDollars(s.monthlyFrom)}
                    <span className="text-xs">/mo</span>
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>

        {/* ---- Live total ---- */}
        <div className="flex flex-col bg-surface/40 p-6 sm:p-8">
          <p className="eyebrow text-muted-foreground mb-2">Your monthly price</p>

          <div className="flex items-end gap-1.5" aria-live="polite">
            <span className="text-5xl font-bold tracking-tight tabular-nums">
              <AnimatePresence mode="popLayout" initial={false}>
                <motion.span
                  key={total}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -10, opacity: 0 }}
                  transition={REDUCE_MOTION}
                  className="inline-block"
                >
                  {formatDollars(total)}
                </motion.span>
              </AnimatePresence>
            </span>
            <span className="mb-1.5 text-sm font-medium text-muted-foreground">
              /mo
            </span>
          </div>

          <AnimatePresence initial={false}>
            {discountRate > 0 && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={REDUCE_MOTION}
                className="overflow-hidden"
              >
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-3 py-1 text-xs font-semibold text-emerald-300">
                  <TrendingDown className="h-3.5 w-3.5" />
                  {Math.round(discountRate * 100)}% bundle discount —{" "}
                  <span className="tabular-nums">
                    save {formatDollars(savings)}/mo
                  </span>
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <dl className="mt-5 space-y-1.5 border-t border-surface-border pt-4 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <dt>Services selected</dt>
              <dd className="tabular-nums">{selected.length}</dd>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <dt>Subtotal</dt>
              <dd className="tabular-nums">{formatDollars(subtotal)}/mo</dd>
            </div>
          </dl>

          <div className="mt-auto pt-6">
            <Button
              asChild
              className="w-full"
              size="lg"
              disabled={selected.length === 0}
            >
              <a
                href={ctaHref}
                aria-disabled={selected.length === 0}
                tabIndex={selected.length === 0 ? -1 : undefined}
              >
                Get my custom quote
                <ArrowRight className="h-4 w-4" />
              </a>
            </Button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              No payment today — we confirm details and lock your price.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

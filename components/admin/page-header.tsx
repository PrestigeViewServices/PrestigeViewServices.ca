import { cn } from "@/lib/utils";

/**
 * Shared admin page header: title, one-line description, right-aligned
 * actions. Use on every admin page so the shell reads as one product.
 */
export function PageHeader({
  title,
  description,
  actions,
  meta,
  className,
}: {
  title: React.ReactNode;
  description?: React.ReactNode;
  /** Buttons/links, right-aligned on desktop, wrapped below on phones. */
  actions?: React.ReactNode;
  /** Small chips next to the title (status, counts). */
  meta?: React.ReactNode;
  className?: string;
}) {
  return (
    <header
      className={cn(
        "flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-[22px] font-semibold tracking-tight text-white sm:text-2xl">
            {title}
          </h1>
          {meta}
        </div>
        {description && (
          <p className="mt-1 text-[13px] text-slate-400">{description}</p>
        )}
      </div>
      {actions && (
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {actions}
        </div>
      )}
    </header>
  );
}

/** Button looks for links/buttons in page headers and toolbars. */
export const adminBtn = {
  secondary:
    "inline-flex h-9 items-center gap-1.5 rounded-sm border border-white/[0.09] bg-white/[0.02] px-3 text-[13px] font-medium text-slate-300 transition-colors hover:bg-white/[0.06] hover:text-white",
  primary:
    "inline-flex h-9 items-center gap-1.5 rounded-sm bg-primary px-3 text-[13px] font-semibold text-white transition-colors hover:bg-blue-500",
} as const;

/** Bordered panel with an optional titled header row. */
export function Panel({
  title,
  icon,
  action,
  subtitle,
  children,
  className,
  bodyClassName,
}: {
  title?: React.ReactNode;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  subtitle?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  bodyClassName?: string;
}) {
  return (
    <section
      className={cn(
        "min-w-0 rounded-xl border border-white/[0.07] bg-[#0E1322]",
        className,
      )}
    >
      {title && (
        <div className="flex items-center justify-between gap-3 border-b border-white/[0.06] px-4 py-3">
          <div className="min-w-0">
            <h2 className="flex items-center gap-2 text-[13px] font-semibold text-slate-100">
              {icon}
              {title}
            </h2>
            {subtitle && (
              <p className="mt-0.5 text-[11.5px] text-slate-500">{subtitle}</p>
            )}
          </div>
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
      <div className={cn("p-4", bodyClassName)}>{children}</div>
    </section>
  );
}

/** Small rectangular status/category badge. `cls` supplies the colors. */
export function Badge({
  children,
  cls,
  className,
}: {
  children: React.ReactNode;
  cls?: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 whitespace-nowrap rounded border px-1.5 py-px text-[11px] font-medium leading-4",
        cls ?? "border-white/10 bg-white/[0.04] text-slate-300",
        className,
      )}
    >
      {children}
    </span>
  );
}

/** Table header cell style: 11px uppercase, muted. */
export const th =
  "whitespace-nowrap px-3 py-2.5 text-left text-[11px] font-semibold uppercase tracking-[0.06em] text-slate-500";
/** Table body cell style. */
export const td = "px-3 py-2.5 align-top text-[13px]";

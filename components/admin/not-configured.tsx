import Link from "next/link";
import { AlertTriangle, ExternalLink, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const SETUP_GUIDE_URL =
  "https://github.com/PrestigeViewServices/PrestigeViewServices.ca/blob/main/SETUP.md";

/**
 * Rendered on /admin and /portal pages when Clerk or Postgres env vars
 * aren't set. Always points to SETUP.md as the foolproof step-by-step,
 * and highlights exactly which env vars are missing so a non-developer
 * knows what to fix.
 */
export function NotConfigured({
  service,
  reason,
  envVars,
  missing = [],
  docHref,
}: {
  service: "Clerk" | "Database";
  reason: string;
  /** All env vars this surface needs. */
  envVars: string[];
  /** Subset of `envVars` that are NOT set. If omitted, all envVars are treated as missing. */
  missing?: string[];
  /** Optional provider-specific doc link (e.g. Clerk quickstart). SETUP.md is shown regardless. */
  docHref?: string;
}) {
  const missingSet = new Set(missing.length > 0 ? missing : envVars);

  return (
    <div className="surface-card p-8 sm:p-10 max-w-2xl">
      <div className="grid h-12 w-12 place-items-center rounded-xl bg-yellow-500/15 text-yellow-300">
        <AlertTriangle className="h-6 w-6" />
      </div>
      <h2 className="mt-5 text-2xl font-semibold">{service} not configured</h2>
      <p className="mt-3 text-muted-foreground leading-relaxed">{reason}</p>

      <div className="mt-6 rounded-xl border border-surface-border bg-input/40 p-4">
        <p className="text-xs uppercase tracking-wider text-muted-foreground mb-3">
          Required env vars
        </p>
        <ul className="space-y-1.5 text-sm font-mono">
          {envVars.map((v) => {
            const isMissing = missingSet.has(v);
            return (
              <li
                key={v}
                className={cn(
                  "flex items-center gap-2",
                  isMissing ? "text-yellow-200" : "text-emerald-300"
                )}
              >
                <span
                  className={cn(
                    "inline-block h-1.5 w-1.5 rounded-full",
                    isMissing ? "bg-yellow-300" : "bg-emerald-400"
                  )}
                />
                <span>{v}</span>
                <span
                  className={cn(
                    "ml-auto text-[10px] uppercase tracking-wider font-sans",
                    isMissing ? "text-yellow-200/80" : "text-emerald-300/80"
                  )}
                >
                  {isMissing ? "missing" : "set"}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Link
          href={SETUP_GUIDE_URL}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-1.5 rounded-full bg-gradient-primary px-5 py-2.5 text-sm font-semibold text-white shadow-[0_8px_24px_-8px_rgba(59,130,246,0.5)] hover:brightness-110 transition-all"
        >
          <BookOpen className="h-4 w-4" />
          Open SETUP.md
        </Link>
        {docHref && (
          <Link
            href={docHref}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full border border-surface-border px-5 py-2.5 text-sm font-semibold text-foreground/90 hover:bg-surface hover:border-white/20 transition-colors"
          >
            {service} docs
            <ExternalLink className="h-4 w-4" />
          </Link>
        )}
      </div>

      <p className="mt-5 text-xs text-muted-foreground">
        Tip: run <code className="text-foreground/90">npm run setup:check</code>{" "}
        in your terminal to confirm your <code className="text-foreground/90">.env.local</code>{" "}
        is wired up before opening the app.
      </p>
    </div>
  );
}

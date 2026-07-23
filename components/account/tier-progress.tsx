import { Crown } from "lucide-react";
import {
  TIERS,
  formatCents,
  nextTierFor,
  tierForSpend,
} from "@/lib/loyalty";

const TIER_BADGE_STYLE: Record<string, string> = {
  MEMBER: "bg-slate-500/15 text-slate-200 border-slate-400/30",
  INSIDER: "bg-sky-500/15 text-sky-300 border-sky-400/30",
  ELITE: "bg-blue-500/15 text-blue-300 border-blue-400/40",
  PRESTIGE: "bg-gradient-primary text-white border-transparent shadow-glow",
};

export function TierBadge({ spendCents }: { spendCents: number }) {
  const tier = tierForSpend(spendCents);
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${TIER_BADGE_STYLE[tier.key]}`}
    >
      <Crown className="h-3.5 w-3.5" />
      {tier.name}
    </span>
  );
}

/**
 * Tier progress bar: where the member sits on the rolling 12-month spend
 * ladder and how far to the next tier ("$430 more this year to reach Elite").
 */
export function TierProgress({ spendCents }: { spendCents: number }) {
  const tier = tierForSpend(spendCents);
  const next = nextTierFor(spendCents);

  // Percent across the CURRENT tier band (floor → next floor).
  const floor = tier.minCents;
  const ceiling = next ? next.tier.minCents : Math.max(spendCents, floor + 1);
  const pct = Math.min(
    100,
    Math.round(((spendCents - floor) / Math.max(1, ceiling - floor)) * 100)
  );

  return (
    <div>
      <div className="flex items-center justify-between gap-3 text-sm">
        <span className="font-semibold">{tier.name}</span>
        {next ? (
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">
              {formatCents(next.remainingCents)}
            </span>{" "}
            more this year to reach {next.tier.name}
          </span>
        ) : (
          <span className="text-muted-foreground">
            Top tier, thanks for being with us
          </span>
        )}
      </div>
      <div className="mt-2 h-2.5 rounded-full bg-surface">
        <div
          className="h-full rounded-full bg-gradient-primary transition-all"
          style={{ width: `${Math.max(4, pct)}%` }}
          aria-hidden
        />
      </div>
      <div className="mt-1.5 flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
        {TIERS.map((t) => (
          <span
            key={t.key}
            className={t.key === tier.key ? "font-bold text-foreground" : ""}
          >
            {t.name}
          </span>
        ))}
      </div>
    </div>
  );
}

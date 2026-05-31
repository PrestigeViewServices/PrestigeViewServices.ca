import { divisionLabel, type CareerDivision } from "@/lib/content/careers";
import { cn } from "@/lib/utils";

const accent: Record<CareerDivision, string> = {
  lawnpros: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
  clearview: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  snowland: "bg-sky-500/15 text-sky-300 border-sky-500/25",
  "company-wide": "bg-primary/15 text-primary border-primary/25",
};

export function DivisionBadge({
  division,
  className,
}: {
  division: CareerDivision;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider",
        accent[division],
        className
      )}
    >
      {divisionLabel[division]}
    </span>
  );
}

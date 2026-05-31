import Link from "next/link";
import { ArrowRight, MapPin, Clock, DollarSign } from "lucide-react";
import type { Role } from "@/lib/content/careers";
import { DivisionBadge } from "./division-badge";

export function RoleCard({ role }: { role: Role }) {
  return (
    <article className="group surface-card surface-card-hover p-6 flex flex-col h-full">
      <div className="flex items-center gap-2 flex-wrap">
        <DivisionBadge division={role.division} />
        <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
          {role.type}
        </span>
      </div>

      <h3 className="mt-4 text-xl font-semibold leading-tight">
        {role.title}
      </h3>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed flex-1">
        {role.shortPitch}
      </p>

      <ul className="mt-5 space-y-2 text-sm">
        <li className="flex items-center gap-2 text-muted-foreground">
          <DollarSign className="h-4 w-4 text-primary" />
          {role.payRange}
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <MapPin className="h-4 w-4 text-primary" />
          {role.location}
        </li>
        <li className="flex items-center gap-2 text-muted-foreground">
          <Clock className="h-4 w-4 text-primary" />
          {role.type}
        </li>
      </ul>

      <Link
        href={`/careers/${role.slug}`}
        className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-blue-300 transition-colors"
      >
        View role &amp; apply
        <ArrowRight className="h-4 w-4" />
      </Link>
    </article>
  );
}

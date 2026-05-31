import Link from "next/link";
import {
  activeRolesExcludingGeneral,
  generalApplication,
} from "@/lib/content/careers";
import { RoleCard } from "./role-card";
import { SectionHeading } from "@/components/section-heading";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";

export function OpenRoles() {
  const open = activeRolesExcludingGeneral();
  const general = generalApplication();

  return (
    <section id="open-roles" className="container-max py-20 sm:py-24 scroll-mt-24">
      <SectionHeading
        eyebrow="Open Roles"
        title={
          open.length > 0
            ? `${open.length} open role${open.length === 1 ? "" : "s"} right now`
            : "No specific roles open this week"
        }
        description="We hire continuously across all three divisions. If nothing fits, the General Application is always open."
      />

      {open.length > 0 && (
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {open.map((r) => (
            <RoleCard key={r.slug} role={r} />
          ))}
        </div>
      )}

      <div className="mt-10 rounded-2xl border border-primary/30 bg-primary/5 p-6 sm:p-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <p className="eyebrow text-primary mb-1.5">Always Open</p>
          <h3 className="text-xl font-semibold">{general.title}</h3>
          <p className="mt-1.5 text-sm text-muted-foreground max-w-xl">
            {general.shortPitch}
          </p>
        </div>
        <Button asChild size="lg" className="shrink-0">
          <Link href={`/careers/${general.slug}#apply`}>
            Submit Application
            <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}

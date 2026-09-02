import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  Clock,
  Mail,
  MessageSquare,
  Phone,
  PhoneCall,
} from "lucide-react";
import { getDb, isDbReady, missingDbEnvVars } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { NotConfigured } from "@/components/admin/not-configured";
import {
  ageLabel,
  getFollowUps,
  type FollowUpItem,
  type FollowUpUrgency,
} from "@/lib/follow-ups";

export const dynamic = "force-dynamic";

/**
 * Follow-Ups — the daily call list. One prioritized queue of everything
 * waiting on a reply (quote requests, snow pass requests, support), split
 * into overdue / due / fresh so the first thing to do each morning is
 * obvious. Rows carry one-tap call, text, and email links.
 */
export default async function FollowUpsPage() {
  await requireRole(["ultimate_admin", "super_admin", "admin", "manager"]);

  if (!isDbReady()) {
    return (
      <NotConfigured
        service="Database"
        reason="Follow-ups read from Postgres. Set DATABASE_URL and run `npm run db:migrate`."
        envVars={["DATABASE_URL"]}
        missing={missingDbEnvVars()}
      />
    );
  }

  const items = await getFollowUps(getDb()!);
  const overdue = items.filter((i) => i.urgency === "overdue");
  const due = items.filter((i) => i.urgency === "due");
  const fresh = items.filter((i) => i.urgency === "fresh");

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Follow-Ups</h1>
        <p className="mt-1.5 text-muted-foreground">
          Everyone waiting on a reply, most urgent first. The website promises
          an answer within 24 hours, so clear the top of this list daily.
        </p>
      </header>

      {items.length === 0 && (
        <div className="surface-card flex items-center gap-3 p-8">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
          <div>
            <p className="font-semibold">All caught up</p>
            <p className="text-sm text-muted-foreground">
              No open quote requests, snow pass requests, or support tickets
              are waiting on you right now.
            </p>
          </div>
        </div>
      )}

      {overdue.length > 0 && (
        <QueueSection
          title="Overdue"
          hint="Past the 24-hour promise. Call these first."
          tone="overdue"
          items={overdue}
        />
      )}
      {due.length > 0 && (
        <QueueSection
          title="Due today"
          hint="Still inside the promise window, but the clock is running."
          tone="due"
          items={due}
        />
      )}
      {fresh.length > 0 && (
        <QueueSection
          title="New, just arrived"
          hint="Fresh submissions. Reply fast and win the job while it is hot."
          tone="fresh"
          items={fresh}
        />
      )}
    </div>
  );
}

const TONE_CLS: Record<FollowUpUrgency, { badge: string; border: string }> = {
  overdue: {
    badge: "bg-rose-500/15 text-rose-300 border-rose-500/30",
    border: "border-rose-500/25",
  },
  due: {
    badge: "bg-amber-500/15 text-amber-200 border-amber-500/30",
    border: "border-amber-500/20",
  },
  fresh: {
    badge: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
    border: "border-surface-border",
  },
};

const KIND_LABEL: Record<FollowUpItem["kind"], string> = {
  lead: "Quote request",
  winter: "Snow pass",
  support: "Support",
};

function QueueSection({
  title,
  hint,
  tone,
  items,
}: {
  title: string;
  hint: string;
  tone: FollowUpUrgency;
  items: FollowUpItem[];
}) {
  const cls = TONE_CLS[tone];
  return (
    <section className={`surface-card overflow-hidden border ${cls.border}`}>
      <div className="flex items-center justify-between gap-3 border-b border-surface-border px-5 py-4">
        <div className="flex items-center gap-2.5">
          <Clock className="h-4 w-4 text-muted-foreground" aria-hidden />
          <h2 className="text-base font-semibold">{title}</h2>
          <span
            className={`rounded-full border px-2 py-0.5 text-[11px] font-bold ${cls.badge}`}
          >
            {items.length}
          </span>
        </div>
        <p className="hidden text-xs text-muted-foreground sm:block">{hint}</p>
      </div>
      <ul className="divide-y divide-surface-border">
        {items.map((i) => (
          <li
            key={`${i.kind}-${i.id}`}
            className="flex flex-wrap items-center gap-3 px-5 py-3.5"
          >
            <div className="min-w-0 flex-1 basis-52">
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-surface-border px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
                  {KIND_LABEL[i.kind]}
                </span>
                <p className="truncate text-sm font-semibold">{i.name}</p>
              </div>
              <p className="mt-0.5 truncate text-xs text-muted-foreground">
                {i.summary}
              </p>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {i.reason} · {ageLabel(i.createdAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-1.5">
              {i.phone && (
                <>
                  <QuickAction
                    href={`tel:${i.phone}`}
                    label={`Call ${i.name}`}
                    icon={Phone}
                  />
                  <QuickAction
                    href={`sms:${i.phone}`}
                    label={`Text ${i.name}`}
                    icon={MessageSquare}
                  />
                </>
              )}
              {i.email && (
                <QuickAction
                  href={`mailto:${i.email}`}
                  label={`Email ${i.name}`}
                  icon={Mail}
                />
              )}
              <Link
                href={i.href}
                className="inline-flex h-8 items-center gap-1 rounded-lg border border-surface-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
              >
                Open
                <ArrowRight className="h-3 w-3" aria-hidden />
              </Link>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function QuickAction({
  href,
  label,
  icon: Icon,
}: {
  href: string;
  label: string;
  icon: typeof PhoneCall;
}) {
  return (
    <a
      href={href}
      aria-label={label}
      title={label}
      className="grid h-8 w-8 place-items-center rounded-lg border border-surface-border text-muted-foreground transition-colors hover:border-white/20 hover:text-foreground"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
    </a>
  );
}

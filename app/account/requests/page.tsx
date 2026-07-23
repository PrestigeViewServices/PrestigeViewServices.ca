import Link from "next/link";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowRight, MessagesSquare, Plus } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember, requireMemberId } from "@/lib/customer-auth";
import { clubNotifyEmail, sendClubEmail } from "@/lib/send-club-email";
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_STYLE,
  TICKET_TYPES,
} from "@/lib/club-tickets";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

type SearchParams = { new?: string; type?: string };

export default async function RequestsPage(props: {
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = await props.searchParams;
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const tickets = await db.clubTicket.findMany({
    where: { memberId: member.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  const showForm = searchParams.new === "1" || tickets.length === 0;
  const presetType = TICKET_TYPES.some((t) => t.value === searchParams.type)
    ? searchParams.type
    : "QUOTE";

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Requests
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Leave the hard work to us. Send a request and track it here.
          </p>
        </div>
        {!showForm && (
          <Button asChild size="sm">
            <Link href="/account/requests?new=1">
              <Plus className="h-4 w-4" />
              New request
            </Link>
          </Button>
        )}
      </header>

      {showForm && (
        <section className="surface-card p-5 sm:p-7">
          <h2 className="text-lg font-semibold">What can we do for you?</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            We reply within one business day, faster during storm season.
            Prefer the phone? {siteConfig.phoneDisplay} works too.
          </p>
          <form action={createTicket} className="mt-5 space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label
                  htmlFor="req-type"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Request type
                </label>
                <select
                  id="req-type"
                  name="type"
                  defaultValue={presetType}
                  className="h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  {TICKET_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label
                  htmlFor="req-contact"
                  className="mb-1.5 block text-sm font-medium"
                >
                  Preferred contact method
                </label>
                <select
                  id="req-contact"
                  name="preferredContact"
                  defaultValue="phone"
                  className="h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                >
                  <option value="phone">Phone call</option>
                  <option value="text">Text message</option>
                  <option value="email">Email</option>
                </select>
              </div>
            </div>
            <div>
              <label
                htmlFor="req-window"
                className="mb-1.5 block text-sm font-medium"
              >
                Best time to reach you (optional)
              </label>
              <input
                id="req-window"
                name="timeWindow"
                maxLength={120}
                placeholder="e.g. Weekdays after 4pm"
                className="h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="req-subject"
                className="mb-1.5 block text-sm font-medium"
              >
                Subject
              </label>
              <input
                id="req-subject"
                name="subject"
                required
                maxLength={140}
                placeholder="e.g. Quote for exterior windows"
                className="h-11 w-full rounded-xl border border-surface-border bg-input/80 px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div>
              <label
                htmlFor="req-body"
                className="mb-1.5 block text-sm font-medium"
              >
                Details
              </label>
              <textarea
                id="req-body"
                name="body"
                required
                rows={4}
                maxLength={3000}
                placeholder="Tell us about the property, the job, or the question."
                className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <Button type="submit" size="lg">
              Send request
              <ArrowRight className="h-4 w-4" />
            </Button>
          </form>
        </section>
      )}

      <section>
        <div className="flex items-center gap-2">
          <MessagesSquare className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold">Your requests</h2>
        </div>
        {tickets.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Nothing yet, your requests and our replies will show up here.
          </p>
        ) : (
          <div className="mt-3 space-y-3">
            {tickets.map((t) => (
              <Link
                key={t.id}
                href={`/account/requests/${t.id}`}
                className="surface-card surface-card-hover flex items-center justify-between gap-3 p-5"
              >
                <div className="min-w-0">
                  <p className="truncate font-semibold">{t.subject}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {TICKET_TYPES.find((x) => x.value === t.type)?.label} ·
                    updated {t.updatedAt.toLocaleDateString("en-CA")}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full border px-3 py-1 text-xs font-medium ${TICKET_STATUS_STYLE[t.status]}`}
                >
                  {TICKET_STATUS_LABEL[t.status]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

// --- server action ----------------------------------------------------------

async function createTicket(formData: FormData) {
  "use server";
  const memberId = await requireMemberId();
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const type = String(formData.get("type") ?? "QUOTE");
  const subject = String(formData.get("subject") ?? "").trim().slice(0, 140);
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  const preferredContact = String(formData.get("preferredContact") ?? "phone");
  const timeWindow = String(formData.get("timeWindow") ?? "")
    .trim()
    .slice(0, 120);

  if (!subject || !body) throw new Error("Subject and details are required");
  const validType = TICKET_TYPES.some((t) => t.value === type)
    ? (type as (typeof TICKET_TYPES)[number]["value"])
    : "QUOTE";

  const member = await db.member.findUnique({ where: { id: memberId } });
  const ticket = await db.clubTicket.create({
    data: {
      memberId,
      type: validType,
      subject,
      preferredContact,
      timeWindow: timeWindow || null,
      messages: {
        create: { authorType: "member", body },
      },
    },
  });

  // Best-effort internal notification — never blocks the customer.
  await sendClubEmail({
    to: clubNotifyEmail(),
    subject: `Portal request: ${subject} — ${member?.firstName ?? ""} ${member?.lastName ?? ""}`.trim(),
    replyTo: member?.email,
    text: [
      `New ${TICKET_TYPES.find((t) => t.value === validType)?.label ?? validType} from the customer portal.`,
      ``,
      `From: ${member?.firstName ?? ""} ${member?.lastName ?? ""} <${member?.email ?? "?"}>`,
      member?.phone ? `Phone: ${member.phone}` : null,
      `Preferred contact: ${preferredContact}${timeWindow ? ` (${timeWindow})` : ""}`,
      ``,
      body,
      ``,
      `Manage: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/admin/club/tickets/${ticket.id}`,
    ]
      .filter((l): l is string => l !== null)
      .join("\n"),
  });

  revalidatePath("/account/requests");
  redirect(`/account/requests/${ticket.id}`);
}

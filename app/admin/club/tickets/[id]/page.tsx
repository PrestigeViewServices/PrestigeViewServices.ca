import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Lock, Send } from "lucide-react";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import { sendClubEmail } from "@/lib/send-club-email";
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_STYLE,
  ticketTypeLabel,
} from "@/lib/club-tickets";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/site";

export const dynamic = "force-dynamic";

const ADMIN_ROLES = ["ultimate_admin", "super_admin", "admin", "manager"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "RESOLVED"] as const;

type Params = { id: string };

/** Admin ticket view: full thread including internal notes, reply (emails
 * the customer), internal note, and status changes (email the customer). */
export default async function AdminTicketPage(props: {
  params: Promise<Params>;
}) {
  const params = await props.params;
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) return null;

  const ticket = await db.clubTicket.findUnique({
    where: { id: params.id },
    include: {
      member: { include: { profile: true } },
      messages: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/admin/club/tickets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Ticket queue
      </Link>

      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{ticket.subject}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {ticketTypeLabel(ticket.type)} ·{" "}
            <Link
              href={`/admin/club/members/${ticket.memberId}`}
              className="font-medium text-primary hover:underline"
            >
              {ticket.member.firstName} {ticket.member.lastName ?? ""}
            </Link>{" "}
            · {ticket.member.email}
            {ticket.member.phone ? ` · ${ticket.member.phone}` : ""}
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Prefers {ticket.preferredContact ?? "any contact"}
            {ticket.timeWindow ? ` · ${ticket.timeWindow}` : ""}
          </p>
        </div>
        <form action={setStatus} className="flex items-center gap-2">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <select
            name="status"
            defaultValue={ticket.status}
            className="h-10 rounded-xl border border-surface-border bg-input/80 px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {TICKET_STATUS_LABEL[s]}
              </option>
            ))}
          </select>
          <Button type="submit" size="sm" variant="outline">
            Update
          </Button>
        </form>
      </header>

      <span
        className={`inline-block rounded-full border px-3 py-1 text-xs font-medium ${TICKET_STATUS_STYLE[ticket.status]}`}
      >
        {TICKET_STATUS_LABEL[ticket.status]}
      </span>

      <div className="space-y-3">
        {ticket.messages.map((m) => {
          const fromMember = m.authorType === "member";
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl border p-4 text-sm leading-relaxed ${
                m.internal
                  ? "ml-auto border-amber-500/30 bg-amber-500/10"
                  : fromMember
                    ? "border-surface-border bg-surface/60"
                    : "ml-auto border-primary/30 bg-primary/10"
              }`}
            >
              <p className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {m.internal && <Lock className="h-3 w-3" />}
                {m.internal
                  ? "Internal note"
                  : fromMember
                    ? `${ticket.member.firstName}`
                    : "PVS team"}{" "}
                ·{" "}
                {m.createdAt.toLocaleString("en-CA", {
                  month: "short",
                  day: "numeric",
                  hour: "numeric",
                  minute: "2-digit",
                })}
              </p>
              <p className="whitespace-pre-wrap">{m.body}</p>
            </div>
          );
        })}
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <form action={adminReply} className="surface-card space-y-3 p-4">
          <p className="text-sm font-semibold">Reply to customer</p>
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={3000}
            placeholder="Visible to the customer + emailed to them."
            className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm">
            <Send className="h-4 w-4" />
            Send reply
          </Button>
        </form>
        <form action={addInternalNote} className="surface-card space-y-3 p-4">
          <p className="flex items-center gap-1.5 text-sm font-semibold">
            <Lock className="h-3.5 w-3.5 text-amber-300" />
            Internal note
          </p>
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={3000}
            placeholder="Team only — never shown to the customer."
            className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm" variant="outline">
            Save note
          </Button>
        </form>
      </div>
    </div>
  );
}

// --- server actions ---------------------------------------------------------

async function adminReply(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!ticketId || !body) return;

  const ticket = await db.clubTicket.findUnique({
    where: { id: ticketId },
    include: { member: { include: { profile: true } } },
  });
  if (!ticket) throw new Error("Not found");

  await db.$transaction([
    db.clubTicketMessage.create({
      data: { ticketId, authorType: "admin", body },
    }),
    db.clubTicket.update({
      where: { id: ticketId },
      data: { status: ticket.status === "OPEN" ? "IN_PROGRESS" : ticket.status },
    }),
  ]);

  if (ticket.member.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: ticket.member.email,
      subject: `PVS replied: ${ticket.subject}`,
      text: [
        `Hi ${ticket.member.firstName},`,
        ``,
        body,
        ``,
        `View the conversation: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/account/requests/${ticketId}`,
        ``,
        `Prestige View Services · ${siteConfig.phoneDisplay}`,
      ].join("\n"),
    });
  }

  revalidatePath(`/admin/club/tickets/${ticketId}`);
  revalidatePath("/admin/club/tickets");
}

async function addInternalNote(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!ticketId || !body) return;

  await db.clubTicketMessage.create({
    data: { ticketId, authorType: "admin", internal: true, body },
  });
  revalidatePath(`/admin/club/tickets/${ticketId}`);
}

async function setStatus(formData: FormData) {
  "use server";
  await requireRole([...ADMIN_ROLES]);
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const ticketId = String(formData.get("ticketId") ?? "");
  const status = String(formData.get("status") ?? "");
  if (!ticketId || !STATUSES.includes(status as (typeof STATUSES)[number])) {
    return;
  }

  const ticket = await db.clubTicket.update({
    where: { id: ticketId },
    data: { status: status as (typeof STATUSES)[number] },
    include: { member: { include: { profile: true } } },
  });

  if (ticket.member.profile?.notifyServiceReminders !== false) {
    await sendClubEmail({
      to: ticket.member.email,
      subject: `Your PVS request is ${TICKET_STATUS_LABEL[status].toLowerCase()}: ${ticket.subject}`,
      text: [
        `Hi ${ticket.member.firstName},`,
        ``,
        `Your request "${ticket.subject}" is now ${TICKET_STATUS_LABEL[status].toLowerCase()}.`,
        ``,
        `View it here: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/account/requests/${ticketId}`,
        ``,
        `Prestige View Services · ${siteConfig.phoneDisplay}`,
      ].join("\n"),
    });
  }

  revalidatePath(`/admin/club/tickets/${ticketId}`);
  revalidatePath("/admin/club/tickets");
}

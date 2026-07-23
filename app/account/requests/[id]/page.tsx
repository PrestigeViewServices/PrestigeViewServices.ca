import Link from "next/link";
import { notFound } from "next/navigation";
import { revalidatePath } from "next/cache";
import { ArrowLeft, Send } from "lucide-react";
import { getDb } from "@/lib/db";
import { getMember, requireMemberId } from "@/lib/customer-auth";
import { clubNotifyEmail, sendClubEmail } from "@/lib/send-club-email";
import {
  TICKET_STATUS_LABEL,
  TICKET_STATUS_STYLE,
  ticketTypeLabel,
} from "@/lib/club-tickets";
import { Button } from "@/components/ui/button";

export const dynamic = "force-dynamic";

type Params = { id: string };

/** Threaded view of one request. Internal admin notes never render here. */
export default async function TicketThreadPage(props: {
  params: Promise<Params>;
}) {
  const params = await props.params;
  const member = await getMember();
  if (!member) return null;
  const db = getDb();
  if (!db) return null;

  const ticket = await db.clubTicket.findFirst({
    where: { id: params.id, memberId: member.id },
    include: {
      messages: {
        where: { internal: false },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (!ticket) notFound();

  return (
    <div className="space-y-6">
      <Link
        href="/account/requests"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        All requests
      </Link>

      <header className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
            {ticket.subject}
          </h1>
          <p className="mt-1 text-xs text-muted-foreground">
            {ticketTypeLabel(ticket.type)} · opened{" "}
            {ticket.createdAt.toLocaleDateString("en-CA")}
          </p>
        </div>
        <span
          className={`rounded-full border px-3 py-1 text-xs font-medium ${TICKET_STATUS_STYLE[ticket.status]}`}
        >
          {TICKET_STATUS_LABEL[ticket.status]}
        </span>
      </header>

      <div className="space-y-3">
        {ticket.messages.map((m) => {
          const mine = m.authorType === "member";
          return (
            <div
              key={m.id}
              className={`max-w-[85%] rounded-2xl border p-4 text-sm leading-relaxed ${
                mine
                  ? "ml-auto border-primary/30 bg-primary/10"
                  : "border-surface-border bg-surface/60"
              }`}
            >
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
                {mine ? "You" : "PVS team"} ·{" "}
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

      {ticket.status !== "RESOLVED" ? (
        <form action={replyToTicket} className="surface-card space-y-3 p-4">
          <input type="hidden" name="ticketId" value={ticket.id} />
          <textarea
            name="body"
            required
            rows={3}
            maxLength={3000}
            placeholder="Write a reply…"
            className="w-full rounded-xl border border-surface-border bg-input/80 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <Button type="submit" size="sm">
            <Send className="h-4 w-4" />
            Send reply
          </Button>
        </form>
      ) : (
        <p className="text-sm text-muted-foreground">
          This request is resolved. Need anything else?{" "}
          <Link
            href="/account/requests?new=1"
            className="font-medium text-primary hover:underline"
          >
            Start a new request
          </Link>
          .
        </p>
      )}
    </div>
  );
}

// --- server action ----------------------------------------------------------

async function replyToTicket(formData: FormData) {
  "use server";
  const memberId = await requireMemberId();
  const db = getDb();
  if (!db) throw new Error("DB not configured");

  const ticketId = String(formData.get("ticketId") ?? "");
  const body = String(formData.get("body") ?? "").trim().slice(0, 3000);
  if (!ticketId || !body) return;

  // Ownership check — members can only reply to their own tickets.
  const ticket = await db.clubTicket.findFirst({
    where: { id: ticketId, memberId },
    include: { member: true },
  });
  if (!ticket) throw new Error("Not found");

  await db.$transaction([
    db.clubTicketMessage.create({
      data: { ticketId, authorType: "member", body },
    }),
    db.clubTicket.update({
      where: { id: ticketId },
      // A customer reply re-opens an in-progress conversation's attention.
      data: { status: ticket.status === "RESOLVED" ? "OPEN" : ticket.status },
    }),
  ]);

  await sendClubEmail({
    to: clubNotifyEmail(),
    subject: `Portal reply: ${ticket.subject}`,
    replyTo: ticket.member.email,
    text: [
      `${ticket.member.firstName} replied to a portal request.`,
      ``,
      body,
      ``,
      `Manage: ${process.env.NEXT_PUBLIC_SITE_URL ?? "https://prestigeviewservices.ca"}/admin/club/tickets/${ticketId}`,
    ].join("\n"),
  });

  revalidatePath(`/account/requests/${ticketId}`);
}

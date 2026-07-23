import type { ClubTicketType } from "@prisma/client";

/** Shared labels/styles for Prestige Club requests (portal + admin). */

export const TICKET_TYPES: { value: ClubTicketType; label: string }[] = [
  { value: "QUOTE", label: "Request a quote" },
  { value: "BOOK_SERVICE", label: "Book a service" },
  { value: "ISSUE", label: "Report an issue" },
  { value: "BILLING", label: "Billing question" },
  { value: "CALLBACK", label: "Request a callback" },
];

export function ticketTypeLabel(type: string): string {
  return TICKET_TYPES.find((t) => t.value === type)?.label ?? type;
}

export const TICKET_STATUS_STYLE: Record<string, string> = {
  OPEN: "bg-blue-500/15 text-blue-300 border-blue-500/25",
  IN_PROGRESS: "bg-amber-500/15 text-amber-200 border-amber-500/25",
  RESOLVED: "bg-emerald-500/15 text-emerald-300 border-emerald-500/25",
};

export const TICKET_STATUS_LABEL: Record<string, string> = {
  OPEN: "Open",
  IN_PROGRESS: "In progress",
  RESOLVED: "Resolved",
};

import type { SupportFormValues } from "./support-schema";

/**
 * TODO: wire to real email provider (Resend / SMTP).
 * Until then, log to console so requests never silently disappear even
 * when the DB write also fails.
 *
 * NOTE: This is intentionally a separate channel from customer leads
 * (Aurora) and from job applications. Different inboxes, different
 * routing rules.
 */
export async function sendSupportEmail(payload: SupportFormValues) {
  const to =
    process.env.SUPPORT_NOTIFICATION_EMAIL || "support@example.com";

  // eslint-disable-next-line no-console
  console.log("[PVS support]", {
    to,
    receivedAt: new Date().toISOString(),
    ...payload,
  });

  return { ok: true as const };
}

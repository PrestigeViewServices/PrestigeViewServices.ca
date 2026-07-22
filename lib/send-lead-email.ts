import { siteConfig } from "@/lib/site";

/**
 * New-lead notification email via the Resend HTTP API (no SDK dependency).
 * Self-disables when RESEND_API_KEY is unset, the lead is still safely in
 * the database either way, so email is best-effort and never blocks intake.
 *
 * Env:
 * - RESEND_API_KEY: Resend secret key
 * - LEAD_NOTIFY_EMAIL: recipient override (defaults to siteConfig.email)
 * - LEAD_FROM_EMAIL: verified sender (defaults to onboarding@resend.dev,
 *   which works out of the box; switch to a verified domain sender later)
 */
export async function sendLeadNotification(lead: {
  name: string;
  email: string;
  phone: string;
  serviceLabel: string;
  promoCode?: string | null;
  propertyAddress?: string | null;
  message?: string | null;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };

  const to = process.env.LEAD_NOTIFY_EMAIL || siteConfig.email;
  const from =
    process.env.LEAD_FROM_EMAIL || "PVS Website <onboarding@resend.dev>";

  const lines = [
    `Name: ${lead.name}`,
    `Phone: ${lead.phone}`,
    `Email: ${lead.email}`,
    `Service: ${lead.serviceLabel}`,
    lead.promoCode ? `Promo: ${lead.promoCode}` : null,
    lead.propertyAddress ? `Address: ${lead.propertyAddress}` : null,
    lead.message ? `Message:\n${lead.message}` : null,
  ].filter(Boolean);

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [to],
        reply_to: lead.email,
        subject: `New quote request: ${lead.serviceLabel} — ${lead.name}`,
        text: lines.join("\n"),
      }),
    });
    if (!res.ok) {
      const body = await res.text();
      return { sent: false, reason: `Resend ${res.status}: ${body}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}

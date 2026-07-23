import { siteConfig } from "@/lib/site";

/**
 * Prestige Club transactional email, same best-effort Resend pattern as
 * lib/send-lead-email.ts: never throws, self-disables without an API key.
 */
export async function sendClubEmail(opts: {
  to: string;
  subject: string;
  text: string;
  replyTo?: string;
}): Promise<{ sent: boolean; reason?: string }> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };

  const from =
    process.env.CLUB_FROM_EMAIL ||
    process.env.LEAD_FROM_EMAIL ||
    "PVS Website <onboarding@resend.dev>";

  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        reply_to: opts.replyTo ?? siteConfig.email,
        subject: opts.subject,
        text: opts.text,
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

/** Internal notification address for new tickets. */
export function clubNotifyEmail(): string {
  return process.env.CLUB_NOTIFY_EMAIL || siteConfig.email;
}

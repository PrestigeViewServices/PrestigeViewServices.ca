import { siteConfig } from "@/lib/site";

/**
 * Owner notifications: one call fans out to the owner's email AND phone
 * whenever the website captures something (lead, application, support
 * ticket, winter reservation).
 *
 * Channels:
 *  - Email: Resend HTTP API (same pattern as lib/send-lead-email.ts).
 *    Self-disables when RESEND_API_KEY is unset.
 *  - SMS, first configured provider wins:
 *      1. Twilio  (TWILIO_ACCOUNT_SID + TWILIO_AUTH_TOKEN + TWILIO_FROM_NUMBER)
 *      2. Carrier email-to-text gateway via Resend (OWNER_SMS_GATEWAY, e.g.
 *         "6137626009@msg.telus.com" for Telus / "@txt.bell.ca" for Bell /
 *         "@pcs.rogers.com" for Rogers)
 *    Silently reports "not configured" otherwise, never blocks intake.
 *
 * Env (all optional, sensible owner defaults baked in):
 *  - OWNER_NOTIFY_EMAIL  (default guerlenskyagnant@outlook.com; accepts a
 *                         comma-separated list to copy several inboxes)
 *  - OWNER_NOTIFY_PHONE  (default +16137626009, E.164 for Twilio)
 *  - OWNER_SMS_GATEWAY   (carrier gateway address, enables SMS without Twilio)
 *
 * ⚠️ Email is OFF until RESEND_API_KEY is set. Without it every call here is
 * a no-op that only logs — see notificationsConfigured() below, which the
 * admin Command Center surfaces so this can never fail silently again.
 */

/** Owner inboxes. Comma-separated env value lets several addresses subscribe. */
function ownerEmails(): string[] {
  const raw =
    process.env.OWNER_NOTIFY_EMAIL || "guerlenskyagnant@outlook.com";
  return raw
    .split(",")
    .map((e) => e.trim())
    .filter(Boolean);
}

const OWNER_PHONE = process.env.OWNER_NOTIFY_PHONE || "+16137626009";

/**
 * Which notification channels are actually live. The admin dashboard renders
 * this so a missing API key is visible instead of silently swallowing every
 * intake alert.
 */
export function notificationsConfigured(): {
  email: boolean;
  sms: boolean;
  recipients: string[];
  /** True while LEAD_FROM_EMAIL is unset, so we fall back to Resend's
   * shared onboarding@resend.dev sender. That sandbox address only
   * delivers to the Resend account owner's own address — every other
   * recipient is rejected. A valid API key is NOT enough on its own. */
  usingDefaultSender: boolean;
} {
  return {
    email: Boolean(process.env.RESEND_API_KEY),
    usingDefaultSender: !process.env.LEAD_FROM_EMAIL,
    sms: Boolean(
      (process.env.TWILIO_ACCOUNT_SID &&
        process.env.TWILIO_AUTH_TOKEN &&
        process.env.TWILIO_FROM_NUMBER) ||
        (process.env.OWNER_SMS_GATEWAY && process.env.RESEND_API_KEY)
    ),
    recipients: ownerEmails(),
  };
}

export type OwnerNotification = {
  kind:
    | "lead"
    | "application"
    | "support"
    | "winter"
    | "member"
    | "giveaway"
    | "other";
  subject: string;
  /** Full body for the email. */
  text: string;
  /** Short body for the text message; falls back to subject. */
  sms?: string;
  replyTo?: string;
};

type ChannelResult = { sent: boolean; reason?: string };

async function sendOwnerEmail(n: OwnerNotification): Promise<ChannelResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { sent: false, reason: "RESEND_API_KEY not set" };

  const from =
    process.env.LEAD_FROM_EMAIL || "PVS Website <onboarding@resend.dev>";
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: ownerEmails(),
        reply_to: n.replyTo ?? siteConfig.email,
        subject: n.subject,
        text: n.text,
      }),
    });
    if (!res.ok) {
      return { sent: false, reason: `Resend ${res.status}: ${await res.text()}` };
    }
    return { sent: true };
  } catch (err) {
    return { sent: false, reason: `Resend error: ${String(err)}` };
  }
}

async function sendOwnerSms(n: OwnerNotification): Promise<ChannelResult> {
  const body = (n.sms ?? n.subject).slice(0, 320);

  // Preferred: Twilio.
  const sid = process.env.TWILIO_ACCOUNT_SID;
  const token = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;
  if (sid && token && fromNumber) {
    try {
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: "POST",
          headers: {
            Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: new URLSearchParams({
            To: OWNER_PHONE,
            From: fromNumber,
            Body: body,
          }).toString(),
        }
      );
      if (!res.ok) {
        return { sent: false, reason: `Twilio ${res.status}: ${await res.text()}` };
      }
      return { sent: true };
    } catch (err) {
      return { sent: false, reason: `Twilio error: ${String(err)}` };
    }
  }

  // Fallback: carrier email-to-text gateway through Resend.
  const gateway = process.env.OWNER_SMS_GATEWAY;
  const apiKey = process.env.RESEND_API_KEY;
  if (gateway && apiKey) {
    try {
      const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from:
            process.env.LEAD_FROM_EMAIL ||
            "PVS Website <onboarding@resend.dev>",
          to: [gateway],
          subject: "",
          text: body,
        }),
      });
      if (!res.ok) {
        return { sent: false, reason: `Gateway ${res.status}: ${await res.text()}` };
      }
      return { sent: true };
    } catch (err) {
      return { sent: false, reason: `Gateway error: ${String(err)}` };
    }
  }

  return {
    sent: false,
    reason:
      "No SMS provider configured (set TWILIO_* or OWNER_SMS_GATEWAY)",
  };
}

/**
 * Fire-and-log both channels. Never throws, callers should never let a
 * notification failure block form intake.
 */
export async function notifyOwner(
  n: OwnerNotification
): Promise<{ email: ChannelResult; sms: ChannelResult }> {
  const [email, sms] = await Promise.all([sendOwnerEmail(n), sendOwnerSms(n)]);
  // eslint-disable-next-line no-console
  console.log("[PVS notify]", {
    kind: n.kind,
    subject: n.subject,
    email,
    sms,
  });
  return { email, sms };
}

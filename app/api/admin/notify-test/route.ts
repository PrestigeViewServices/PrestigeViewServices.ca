import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth";
import { notifyOwner, notificationsConfigured } from "@/lib/notify";

export const runtime = "nodejs";

/**
 * POST /api/admin/notify-test
 *
 * Fires a real owner notification through both channels and returns the raw
 * per-channel result, including the provider's own error text.
 *
 * This exists because notification failures were invisible: lib/notify.ts is
 * deliberately fire-and-forget so a dead mail provider can never block form
 * intake, which also meant nobody found out mail was off until leads went
 * missing. The admin Command Center calls this so the owner can prove the
 * pipe works, and read the exact reason when it doesn't.
 */
export async function POST() {
  try {
    await requireRole(["ultimate_admin", "admin"]);
  } catch {
    return NextResponse.json({ error: "Not authorized" }, { status: 401 });
  }

  const configured = notificationsConfigured();
  const stamp = new Date().toLocaleString("en-CA", {
    timeZone: "America/Toronto",
  });

  const result = await notifyOwner({
    kind: "other",
    subject: "PVS test alert — notifications are working",
    text: [
      "This is a test alert sent from the PVS admin dashboard.",
      "",
      `Sent: ${stamp}`,
      `Recipients: ${configured.recipients.join(", ")}`,
      "",
      "If you are reading this, quote requests, winter reservations,",
      "applications, support tickets, new members, and giveaway entries",
      "will all reach you the same way.",
    ].join("\n"),
    sms: `PVS test alert. Notifications are working. ${stamp}`,
  });

  return NextResponse.json({
    ok: result.email.sent || result.sms.sent,
    email: result.email,
    sms: result.sms,
    recipients: configured.recipients,
  });
}

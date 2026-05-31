import type { ApplicationFormValues } from "./application-schema";
import { getRole } from "@/lib/content/careers";

/**
 * TODO: wire to real email/ATS.
 * - Email: Resend / SMTP — different inbox than customer lead form on purpose.
 * - ATS: optional later (Workable, BambooHR, Manatal) once volume justifies it.
 *
 * For v1, log to server console so applications never silently disappear.
 */
export async function sendApplicationEmail(payload: ApplicationFormValues) {
  const to =
    process.env.APPLICATION_NOTIFICATION_EMAIL || "hiring@example.com";

  const role = getRole(payload.role);

  // eslint-disable-next-line no-console
  console.log("[PVS application]", {
    to,
    receivedAt: new Date().toISOString(),
    roleTitle: role?.title ?? payload.role,
    ...payload,
  });

  return { ok: true as const };
}

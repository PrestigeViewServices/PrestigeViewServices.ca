import { clientIp, rateLimit, tooMany } from "@/lib/rate-limit";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import {
  leadSchema,
  divisionForService,
  LEAD_SERVICES,
} from "@/lib/lead-schema";
import { sendLeadNotification } from "@/lib/send-lead-email";
import { notifyOwner } from "@/lib/notify";
import { getDb } from "@/lib/db";
import { pushLeadToJobber } from "@/lib/jobber";
import {
  REF_COOKIE,
  normalizeCode,
  tryAttributeReferral,
} from "@/lib/referrals";
import { accountOffer, getClubSettingsSafe } from "@/lib/club-settings";
import { formatCents } from "@/lib/loyalty";
import type { PrismaClient } from "@prisma/client";

export const runtime = "nodejs";

/**
 * The referral code carried by this submission: the one the visitor typed
 * into the form wins, otherwise the pvs_ref cookie dropped by /r/[code].
 */
async function referralCodeFor(typed: string | undefined): Promise<string> {
  const fromForm = normalizeCode(typed);
  if (fromForm) return fromForm;
  try {
    const store = await cookies();
    return normalizeCode(store.get(REF_COOKIE)?.value);
  } catch {
    return "";
  }
}

/**
 * Does this email already have a free PVS account? Account holders get the
 * member discount, so the note on the lead tells the office to apply it
 * before the quote goes out.
 */
async function memberDiscountNote(
  db: PrismaClient,
  email: string
): Promise<string | null> {
  try {
    const settings = await getClubSettingsSafe(db);
    const offer = accountOffer(settings);
    if (!offer.enabled) return null;
    const member = await db.member.findUnique({
      where: { email: email.trim().toLowerCase() },
      select: { passwordHash: true },
    });
    if (!member || member.passwordHash === "") return null;
    return `PVS account member: apply the ${offer.label} member discount`;
  } catch {
    return null;
  }
}

/**
 * Public lead intake. Creates a Lead at the top of the pipeline (status NEW,
 * source PUBLIC_FORM), this is the "public form → Lead automatically" path.
 *
 * Mirrors the winter-reservations route: validate → honeypot → null-DB fallback
 * that logs instead of dropping the submission → create.
 */
export async function POST(request: Request) {
  const limited = await rateLimit("public-form", clientIp(request), 12, 3600);
  if (!limited.ok) return tooMany();
  let json: unknown;
  try {
    json = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = leadSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      {
        ok: false,
        error: "Validation failed",
        issues: parsed.error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      { status: 422 }
    );
  }

  // Honeypot, silently accept so bots don't learn they were caught.
  if (parsed.data.hp) return NextResponse.json({ ok: true });

  const { hp: _hp, ...payload } = parsed.data;

  const serviceLabel =
    LEAD_SERVICES.find((s) => s.value === payload.service)?.label ??
    payload.service;

  // "Add snow removal" bundle: record seasonal snow interest alongside the
  // primary service so the office quotes both in one call.
  const bundleSnow =
    payload.addSnow === true && payload.service !== "snow-removal";
  const serviceSlugs = bundleSnow
    ? [payload.service, "snow-removal"]
    : [payload.service];

  // Notifications are best-effort and must never block or fail intake.
  // extraLines carries pricing context (member discount, referral credit)
  // discovered during the DB write, so the email tells the office exactly
  // what to apply before quoting.
  const notify = (extraLines: string[] = []) =>
    Promise.all([
      sendLeadNotification({
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        serviceLabel,
        promoCode: payload.promoCode || null,
        propertyAddress: payload.propertyAddress || null,
        message: payload.message || null,
      }).then((r) => {
        if (!r.sent) {
          // eslint-disable-next-line no-console
          console.warn("[PVS lead] email notification skipped:", r.reason);
        }
      }),
      notifyOwner({
        kind: "lead",
        subject: `New lead: ${serviceLabel}, ${payload.name}`,
        text: [
          `Name: ${payload.name}`,
          `Phone: ${payload.phone}`,
          `Email: ${payload.email}`,
          `Service: ${serviceLabel}`,
          bundleSnow ? `Bundle: also wants a seasonal snow contract` : null,
          payload.sourcePage ? `Source page: ${payload.sourcePage}` : null,
          payload.packageInterest
            ? `Package interest: ${payload.packageInterest}`
            : null,
          payload.propertyAddress ? `Address: ${payload.propertyAddress}` : null,
          ...extraLines.map((l) => `>> ${l}`),
          payload.message ? `Message:\n${payload.message}` : null,
          ``,
          `Manage: /admin/leads`,
        ]
          .filter(Boolean)
          .join("\n"),
        sms: `PVS lead: ${payload.name} · ${serviceLabel} · ${payload.phone}`,
        replyTo: payload.email,
      }),
    ]);

  const db = getDb();
  if (!db) {
    // Never silently drop, log so the lead can be recovered.
    // eslint-disable-next-line no-console
    console.log("[PVS lead, no DB]", {
      receivedAt: new Date().toISOString(),
      ...payload,
    });
    await notify();
    return NextResponse.json({ ok: true, id: null });
  }

  try {
    const memberNote = await memberDiscountNote(db, payload.email);
    const noteParts = [
      payload.promoCode ? `Promo: ${payload.promoCode}` : null,
      bundleSnow ? "Bundle: also wants a seasonal snow contract" : null,
      memberNote,
    ].filter((n): n is string => Boolean(n));

    const baseData = {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      division: divisionForService(payload.service),
      propertyAddress: payload.propertyAddress || null,
      message: payload.message || null,
      serviceSlugs,
      notes: noteParts.length ? noteParts.join(" · ") : null,
      status: "NEW" as const,
      source: "PUBLIC_FORM" as const,
    };

    let created: { id: string };
    try {
      created = await db.lead.create({
        data: {
          ...baseData,
          sourcePage: payload.sourcePage || null,
          packageInterest: payload.packageInterest || null,
        },
        select: { id: true },
      });
    } catch (colErr) {
      // Pre-migration database (sourcePage/packageInterest columns missing):
      // never drop the lead — fold the tracking into notes and retry.
      // eslint-disable-next-line no-console
      console.warn("Lead create with tracking columns failed, retrying", colErr);
      const trackingNotes = [
        payload.sourcePage ? `Source: ${payload.sourcePage}` : null,
        payload.packageInterest ? `Package: ${payload.packageInterest}` : null,
      ].filter(Boolean) as string[];
      created = await db.lead.create({
        data: {
          ...baseData,
          notes:
            [...noteParts, ...trackingNotes].join(" · ") || null,
        },
        select: { id: true },
      });
    }

    // Best-effort push into Jobber as a client + work request. Gated by
    // JOBBER_ALLOW_WRITES and never blocks or fails intake.
    void pushLeadToJobber(db, {
      name: payload.name,
      email: payload.email,
      phone: payload.phone,
      address: payload.propertyAddress || null,
      title: `Website quote request: ${serviceLabel}${bundleSnow ? " + seasonal snow" : ""}`,
      message: payload.message || null,
    })
      .then(async (r) => {
        // Only annotate when a push was actually attempted; the normal
        // writes-disabled state should not add noise to every lead.
        if (!r.attempted) return;
        try {
          const lead = await db.lead.findUnique({
            where: { id: created.id },
            select: { notes: true },
          });
          const line = r.pushed
            ? "Pushed to Jobber as a request"
            : `Jobber push skipped: ${r.reason}`;
          await db.lead.update({
            where: { id: created.id },
            data: {
              notes: [lead?.notes, line].filter(Boolean).join(" · "),
            },
          });
        } catch {
          // Notes annotation is cosmetic.
        }
      })
      .catch(() => {});

    // Referral attribution — best-effort, and always AFTER the lead is safe.
    const code = await referralCodeFor(payload.referralCode);
    if (code) {
      const settings = await getClubSettingsSafe(db);
      const result = await tryAttributeReferral(db, {
        code,
        friendEmail: payload.email,
        friendName: payload.name,
        friendPhone: payload.phone,
        leadId: created.id,
        source: payload.referralCode ? "code" : "link",
        settings,
      });
      if (result?.ok) {
        const credit = formatCents(
          result.referral.friendCreditCents ?? settings.referralFriendCents
        );
        const refLine = `Referred by club code ${code}. Friend gets ${credit} off their first service`;
        noteParts.push(refLine);
        await db.lead.update({
          where: { id: created.id },
          data: { notes: noteParts.join(" · ") },
        });
      }
    }

    await notify(noteParts);
    return NextResponse.json({ ok: true, id: created.id });
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error("Lead DB write failed", err);
    return NextResponse.json(
      { ok: false, error: "Could not submit your request, please call us." },
      { status: 500 }
    );
  }
}

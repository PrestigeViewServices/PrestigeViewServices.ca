"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireRole } from "@/lib/auth";
import {
  PIN_RE,
  awardAuto,
  hashPin,
  pinInUse,
  setCrewSetting,
  ymd,
} from "@/lib/crew-app";

const ROLES = ["ultimate_admin", "admin", "manager"] as const;

function db() {
  const d = getDb();
  if (!d) throw new Error("DB not configured");
  return d;
}

function revalidateAll() {
  revalidatePath("/admin/game-plan");
  revalidatePath("/admin/game-plan/live");
  revalidatePath("/admin/game-plan/points");
  revalidatePath("/admin/game-plan/photos");
  revalidatePath("/admin/game-plan/leads");
  revalidatePath("/admin/game-plan/issues");
  revalidatePath("/admin/game-plan/team");
  revalidatePath("/admin/game-plan/week");
}

// ---- Plans -------------------------------------------------------------------

const stopSchema = z.object({
  id: z.string().optional(),
  address: z.string().trim().min(1).max(200),
  service: z.string().trim().max(120).optional().default(""),
  note: z.string().trim().max(300).optional().default(""),
});

const planSchema = z.object({
  crewId: z.string().min(1),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  headline: z.string().trim().max(80).optional().default(""),
  truck: z.string().trim().max(40).optional().default(""),
  startTime: z.string().trim().max(20).optional().default(""),
  brief: z.string().trim().max(1500).optional().default(""),
  published: z.boolean().default(true),
  stops: z.array(stopSchema).max(60),
});

export type PlanInput = z.input<typeof planSchema>;

/**
 * Create or replace the plan for one crew on one day. Stops that keep
 * their id keep their status and photos; new stops start PENDING; stops
 * removed from the list are deleted (photos stay on Cloudinary).
 */
export async function savePlan(input: PlanInput) {
  await requireRole([...ROLES]);
  const d = planSchema.parse(input);
  const prisma = db();

  const plan = await prisma.gamePlan.upsert({
    where: { crewId_date: { crewId: d.crewId, date: d.date } },
    create: {
      crewId: d.crewId,
      date: d.date,
      headline: d.headline || null,
      truck: d.truck || null,
      startTime: d.startTime || null,
      brief: d.brief || null,
      published: d.published,
    },
    update: {
      headline: d.headline || null,
      truck: d.truck || null,
      startTime: d.startTime || null,
      brief: d.brief || null,
      published: d.published,
    },
    include: { stops: { select: { id: true } } },
  });

  const keepIds = new Set(d.stops.map((s) => s.id).filter(Boolean) as string[]);
  const toDelete = plan.stops.filter((s) => !keepIds.has(s.id)).map((s) => s.id);

  await prisma.$transaction([
    ...(toDelete.length
      ? [prisma.gamePlanStop.deleteMany({ where: { id: { in: toDelete }, planId: plan.id } })]
      : []),
    ...d.stops.map((s, i) =>
      s.id
        ? prisma.gamePlanStop.update({
            where: { id: s.id },
            data: { sortOrder: i, address: s.address, service: s.service || null, note: s.note || null },
          })
        : prisma.gamePlanStop.create({
            data: { planId: plan.id, sortOrder: i, address: s.address, service: s.service || null, note: s.note || null },
          })
    ),
  ]);

  revalidateAll();
  return { ok: true as const, planId: plan.id };
}

export async function deletePlan(planId: string) {
  await requireRole([...ROLES]);
  await db().gamePlan.delete({ where: { id: planId } }).catch(() => null);
  revalidateAll();
}

/** Copies a crew's most recent plan before `date` onto `date` as a draft. */
export async function copyPreviousPlan(crewId: string, date: string) {
  await requireRole([...ROLES]);
  const prisma = db();
  const prev = await prisma.gamePlan.findFirst({
    where: { crewId, date: { lt: date } },
    orderBy: { date: "desc" },
    include: { stops: { orderBy: { sortOrder: "asc" } } },
  });
  if (!prev) return { ok: false as const, error: "No earlier plan for this crew." };
  return savePlan({
    crewId,
    date,
    headline: prev.headline ?? "",
    truck: prev.truck ?? "",
    startTime: prev.startTime ?? "",
    brief: "",
    published: false,
    stops: prev.stops.map((s) => ({ address: s.address, service: s.service ?? "", note: s.note ?? "" })),
  });
}

const weekSchema = z.object({
  crewId: z.string().min(1),
  days: z.array(z.object({
    date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    headline: z.string().trim().max(80),
    startTime: z.string().trim().max(20).optional().default(""),
    truck: z.string().trim().max(40).optional().default(""),
  })).max(14),
});
export type WeekInput = z.input<typeof weekSchema>;

/**
 * Save the week grid for one crew. Each day becomes (or updates) a
 * published GamePlan with a headline; stops and briefs already on that
 * day are left alone. A day cleared to blank with no stops is deleted so
 * the crew sees "not planned yet" rather than an empty plan.
 */
export async function saveWeek(input: WeekInput) {
  await requireRole([...ROLES]);
  const d = weekSchema.parse(input);
  const prisma = db();
  for (const day of d.days) {
    const existing = await prisma.gamePlan.findUnique({
      where: { crewId_date: { crewId: d.crewId, date: day.date } },
      include: { _count: { select: { stops: true } } },
    });
    const blank = !day.headline && !day.startTime && !day.truck;
    if (!existing) {
      if (blank) continue;
      await prisma.gamePlan.create({
        data: { crewId: d.crewId, date: day.date, headline: day.headline || null, startTime: day.startTime || null, truck: day.truck || null, published: true },
      });
    } else if (blank && existing._count.stops === 0 && !existing.brief) {
      await prisma.gamePlan.delete({ where: { id: existing.id } });
    } else {
      await prisma.gamePlan.update({
        where: { id: existing.id },
        data: { headline: day.headline || null, startTime: day.startTime || null, truck: day.truck || null, published: existing.published || !!day.headline },
      });
    }
  }
  revalidateAll();
  return { ok: true as const };
}

/** Admin override: mark a stop pending/done/skipped without photos. */
/** Bound from the page: setStopStatus.bind(null, id, "DONE"). Bound args are
 * reliable for progressive-enhancement submits; a submit button's own
 * name/value is not always forwarded. */
export async function setStopStatus(id: string, status: string) {
  await requireRole([...ROLES]);
  if (!id || !["PENDING", "DONE", "SKIPPED"].includes(status)) return;
  await db().gamePlanStop.update({
    where: { id },
    data: {
      status: status as "PENDING" | "DONE" | "SKIPPED",
      doneAt: status === "PENDING" ? null : new Date(),
      ...(status === "PENDING" ? { doneById: null } : {}),
    },
  });
  revalidateAll();
}

// ---- Points ------------------------------------------------------------------

const awardSchema = z.object({
  memberId: z.string().min(1),
  points: z.coerce.number().int().min(-500).max(500).refine((n) => n !== 0, "Points can't be 0"),
  reason: z.string().trim().min(1).max(120),
  note: z.string().trim().max(300).optional().default(""),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  ruleId: z.string().optional(),
});

export async function awardPoints(formData: FormData) {
  await requireRole([...ROLES]);
  const d = awardSchema.parse({
    memberId: formData.get("memberId"),
    points: formData.get("points"),
    reason: formData.get("reason"),
    note: formData.get("note") ?? "",
    date: formData.get("date") || undefined,
    ruleId: formData.get("ruleId") || undefined,
  });
  await db().pointEntry.create({
    data: {
      memberId: d.memberId,
      points: d.points,
      reason: d.reason,
      note: d.note || null,
      date: d.date ?? ymd(),
      ruleId: d.ruleId ?? null,
    },
  });
  revalidateAll();
}

export async function deletePointEntry(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  if (id) await db().pointEntry.delete({ where: { id } }).catch(() => null);
  revalidateAll();
}

// ---- Leads & issues ----------------------------------------------------------

export async function setLeadStatus(id: string, status: string) {
  await requireRole([...ROLES]);
  if (!id || !["NEW", "QUOTED", "WON", "LOST"].includes(status)) return;
  const prisma = db();
  const lead = await prisma.fieldLead.findUnique({ where: { id } });
  if (!lead) return;
  await prisma.fieldLead.update({
    where: { id },
    data: { status: status as "NEW" | "QUOTED" | "WON" | "LOST" },
  });
  // First time a lead is marked WON, the member who flagged it gets the
  // upsell bonus (if the auto rule exists). Flipping back and forth doesn't
  // double-pay: we check for an existing entry tied to this lead note.
  if (status === "WON" && lead.status !== "WON" && lead.memberId) {
    const already = await prisma.pointEntry.findFirst({
      where: { memberId: lead.memberId, note: `lead:${lead.id}` },
      select: { id: true },
    });
    if (!already) {
      await awardAuto("lead_won", lead.memberId, { note: `lead:${lead.id}` });
    }
  }
  revalidateAll();
}

export async function setIssueStatus(id: string, status: string) {
  await requireRole([...ROLES]);
  if (!id || !["OPEN", "RESOLVED"].includes(status)) return;
  await db().fieldIssue.update({
    where: { id },
    data: {
      status: status as "OPEN" | "RESOLVED",
      resolvedAt: status === "RESOLVED" ? new Date() : null,
    },
  });
  revalidateAll();
}

// ---- Team --------------------------------------------------------------------

export async function createCrew(formData: FormData) {
  await requireRole([...ROLES]);
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  if (!name) return;
  await db().crew.create({ data: { name } });
  revalidateAll();
}

export async function updateCrew(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const truck = String(formData.get("truck") ?? "").trim().slice(0, 40);
  const active = formData.get("active") === "on";
  if (!id || !name) return;
  await db().crew.update({ where: { id }, data: { name, truck: truck || null, active } });
  revalidateAll();
}

export async function setMemberPin(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  if (!id) return;
  if (pin === "") {
    await db().crewMember.update({ where: { id }, data: { pinHash: null } });
  } else {
    if (!PIN_RE.test(pin)) throw new Error("PIN must be 4 to 6 digits");
    if (await pinInUse(pin, id)) throw new Error("Someone else already has that PIN. Pick another.");
    await db().crewMember.update({ where: { id }, data: { pinHash: await hashPin(pin) } });
  }
  revalidateAll();
}

export async function addMember(formData: FormData) {
  await requireRole([...ROLES]);
  const crewId = String(formData.get("crewId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const pin = String(formData.get("pin") ?? "").replace(/\D/g, "");
  if (!crewId || !name) return;
  let pinHash: string | null = null;
  if (pin) {
    if (!PIN_RE.test(pin)) throw new Error("PIN must be 4 to 6 digits");
    if (await pinInUse(pin)) throw new Error("Someone else already has that PIN. Pick another.");
    pinHash = await hashPin(pin);
  }
  await db().crewMember.create({ data: { crewId, name, title: title || null, pinHash } });
  revalidateAll();
}

export async function updateMember(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  const crewId = String(formData.get("crewId") ?? "");
  const name = String(formData.get("name") ?? "").trim().slice(0, 60);
  const title = String(formData.get("title") ?? "").trim().slice(0, 60);
  const phone = String(formData.get("phone") ?? "").trim().slice(0, 30);
  const active = formData.get("active") === "on";
  if (!id || !name || !crewId) return;
  await db().crewMember.update({ where: { id }, data: { name, crewId, active, title: title || null, phone: phone || null } });
  revalidateAll();
  revalidatePath(`/admin/game-plan/team/${id}`);
}

export async function saveRule(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  const label = String(formData.get("label") ?? "").trim().slice(0, 80);
  const points = Number(formData.get("points"));
  const active = formData.get("active") === "on";
  if (!label || !Number.isInteger(points)) return;
  const prisma = db();
  if (id) {
    await prisma.pointRule.update({ where: { id }, data: { label, points, active } });
  } else {
    const count = await prisma.pointRule.count();
    await prisma.pointRule.create({ data: { label, points, sortOrder: count + 1 } });
  }
  revalidateAll();
}

export async function deleteRule(formData: FormData) {
  await requireRole([...ROLES]);
  const id = String(formData.get("id") ?? "");
  if (!id) return;
  const rule = await db().pointRule.findUnique({ where: { id } });
  if (!rule || rule.autoKey) return; // auto rules can be deactivated, not deleted
  await db().pointRule.delete({ where: { id } });
  revalidateAll();
}

export async function saveSeasonStart(formData: FormData) {
  await requireRole([...ROLES]);
  const v = String(formData.get("seasonStart") ?? "");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return;
  await setCrewSetting("seasonStart", v);
  revalidateAll();
}


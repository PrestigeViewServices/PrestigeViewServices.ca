import { z } from 'zod'
import { and, eq, isNull, inArray } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import { haversineProvider, type TravelProvider } from './travel'

// ---------------------------------------------------------------------------
// Context assembly — the app decides exactly what the model sees. Privacy
// rule: job addresses, durations, prices, and crew first names go out; full
// customer contact records (phone, email) never do.
// ---------------------------------------------------------------------------

export interface PlannerContext {
  date: string
  settings: {
    targetRevenuePerCrewHour: number
    maxCrewHoursPerDay: number
    dailyOverheadBreakEven: number
    workdayStart: string // 'HH:mm'
    workdayEnd: string
  }
  crews: {
    crewId: string
    name: string
    division: string
    members: { name: string; certifications: { division: string; level: number }[] }[]
    vehicle: string | null
  }[]
  jobs: {
    jobId: string
    customerName: string
    address: string
    routeZone: string | null
    division: string
    title: string
    priority: string
    durationMinutes: number
    quotedAmount: number
    requiredCertificationLevel: number
    requiredEquipment: string[]
    weatherDependent: boolean
    lockedToCrewId: string | null // existing assignment the user chose to keep
    currentCrewId: string | null // where it sits today (may be moved)
    currentStartTime: string | null // 'HH:mm'
  }[]
  /** driveMinutes[jobIdA][jobIdB] straight-line estimate between stops */
  driveMinutes: Record<string, Record<string, number>>
}

export interface AssembleOptions {
  date: string
  divisions: string[] // empty = all
  lockExisting: boolean // keep current assignments fixed
}

export async function assemblePlannerContext(
  db: Db,
  opts: AssembleOptions,
  travel: TravelProvider = haversineProvider,
): Promise<PlannerContext> {
  const settings = db.select().from(s.settings).where(eq(s.settings.id, 'singleton')).get()
  const target = settings?.targetRevenuePerCrewHour ?? 145
  const maxHours = settings?.maxCrewHoursPerDay ?? 10
  const breakEven = (settings?.monthlyOverhead ?? 13088) / (settings?.workingDaysPerMonth ?? 22)

  const crews = db
    .select()
    .from(s.crews)
    .where(and(isNull(s.crews.archivedAt), eq(s.crews.active, true)))
    .all()
    .filter((c) => opts.divisions.length === 0 || opts.divisions.includes(c.division))
  const members = db.select().from(s.crewMembers).where(isNull(s.crewMembers.archivedAt)).all()
  const workerIds = [...new Set(members.map((m) => m.workerId))]
  const workers = workerIds.length
    ? db.select().from(s.workers).where(inArray(s.workers.id, workerIds)).all()
    : []
  const certs = workerIds.length
    ? db
        .select()
        .from(s.certifications)
        .where(and(inArray(s.certifications.workerId, workerIds), isNull(s.certifications.archivedAt)))
        .all()
    : []
  const vehicles = db.select().from(s.vehicles).where(isNull(s.vehicles.archivedAt)).all()

  // Jobs: everything scheduled for the date plus the unscheduled backlog
  const allJobs = db
    .select({
      job: s.jobs,
      customerName: s.customers.name,
      address: s.properties.address,
      routeZone: s.properties.routeZone,
      lat: s.properties.lat,
      lng: s.properties.lng,
    })
    .from(s.jobs)
    .innerJoin(s.customers, eq(s.jobs.customerId, s.customers.id))
    .innerJoin(s.properties, eq(s.jobs.propertyId, s.properties.id))
    .where(isNull(s.jobs.archivedAt))
    .all()
    .filter((r) => {
      const j = r.job
      if (opts.divisions.length > 0 && !opts.divisions.includes(j.division)) return false
      const forDate = j.scheduledDate === opts.date
      const backlog = !j.assignedCrewId && (j.status === 'Unscheduled' || j.status === 'Scheduled')
      return (forDate || backlog) && j.status !== 'Cancelled' && j.status !== 'Complete'
    })

  const jobIds = allJobs.map((r) => r.job.id)
  const lineItems = jobIds.length
    ? db.select().from(s.jobLineItems).where(inArray(s.jobLineItems.jobId, jobIds)).all()
    : []
  const catalogIds = [...new Set(lineItems.map((li) => li.serviceCatalogId).filter((x): x is string => !!x))]
  const catalog = catalogIds.length
    ? db.select().from(s.serviceCatalog).where(inArray(s.serviceCatalog.id, catalogIds)).all()
    : []

  const jobs: PlannerContext['jobs'] = allJobs.map((r) => {
    const jobCatalog = lineItems
      .filter((li) => li.jobId === r.job.id && li.serviceCatalogId)
      .map((li) => catalog.find((c) => c.id === li.serviceCatalogId))
      .filter((c): c is NonNullable<typeof c> => !!c)
    const startTime =
      r.job.scheduledStartAt != null
        ? new Date(r.job.scheduledStartAt).toTimeString().slice(0, 5)
        : null
    return {
      jobId: r.job.id,
      customerName: r.customerName,
      address: r.address,
      routeZone: r.routeZone,
      division: r.job.division,
      title: r.job.title,
      priority: r.job.priority,
      durationMinutes: r.job.estimatedDurationMinutes,
      quotedAmount: r.job.quotedAmount,
      requiredCertificationLevel: Math.max(1, ...jobCatalog.map((c) => c.requiredCertificationLevel)),
      requiredEquipment: [...new Set(jobCatalog.flatMap((c) => c.requiredEquipment))],
      weatherDependent: r.job.weatherDependent,
      lockedToCrewId:
        opts.lockExisting && r.job.scheduledDate === opts.date ? r.job.assignedCrewId : null,
      currentCrewId: r.job.scheduledDate === opts.date ? r.job.assignedCrewId : null,
      currentStartTime: r.job.scheduledDate === opts.date ? startTime : null,
    }
  })

  // Drive-minutes matrix between all stops with coordinates — from the
  // configured TravelProvider (haversine by default, Google/Mapbox when keyed)
  const points = allJobs
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ id: r.job.id, lat: r.lat!, lng: r.lng! }))
  const driveMinutes = await travel.matrix(points)

  return {
    date: opts.date,
    settings: {
      targetRevenuePerCrewHour: target,
      maxCrewHoursPerDay: maxHours,
      dailyOverheadBreakEven: Math.round(breakEven),
      workdayStart: '07:30',
      workdayEnd: '18:00',
    },
    crews: crews.map((crew) => ({
      crewId: crew.id,
      name: crew.name,
      division: crew.division,
      members: members
        .filter((m) => m.crewId === crew.id)
        .map((m) => {
          const w = workers.find((x) => x.id === m.workerId)
          return {
            name: w ? w.name.split(' ')[0] : 'Unknown',
            certifications: certs
              .filter((c) => c.workerId === m.workerId)
              .map((c) => ({ division: c.division, level: c.level })),
          }
        }),
      vehicle: vehicles.find((v) => v.id === crew.defaultVehicleId)?.name ?? null,
    })),
    jobs,
    driveMinutes,
  }
}

// ---------------------------------------------------------------------------
// Plan schema — model output is Zod-validated; malformed output never touches
// the database.
// ---------------------------------------------------------------------------

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/

export const planSchema = z.object({
  crews: z.array(
    z.object({
      crewId: z.string(),
      stops: z.array(
        z.object({
          jobId: z.string(),
          arrival: z.string().regex(timeRe, 'arrival must be HH:mm'),
          departure: z.string().regex(timeRe, 'departure must be HH:mm'),
          driveMinutesFromPrevious: z.number().min(0),
        }),
      ),
      totalCrewHours: z.number().min(0),
      totalRevenue: z.number().min(0),
      revenuePerCrewHour: z.number().min(0),
      rationale: z.string(),
    }),
  ),
  unassigned: z.array(z.object({ jobId: z.string(), reason: z.string() })),
  warnings: z.array(z.string()),
})

export type Plan = z.infer<typeof planSchema>

/** Schema plus semantic checks: the model may not invent crews or jobs. */
export function validatePlan(raw: unknown, context: PlannerContext): { plan?: Plan; error?: string } {
  const parsed = planSchema.safeParse(raw)
  if (!parsed.success) {
    return { error: `Schema validation failed: ${parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ')}` }
  }
  const plan = parsed.data
  const knownCrews = new Set(context.crews.map((c) => c.crewId))
  const knownJobs = new Set(context.jobs.map((j) => j.jobId))
  const seenJobs = new Set<string>()
  for (const crew of plan.crews) {
    if (!knownCrews.has(crew.crewId)) return { error: `Unknown crewId ${crew.crewId} — you may only use crews from the input` }
    for (const stop of crew.stops) {
      if (!knownJobs.has(stop.jobId)) return { error: `Unknown jobId ${stop.jobId} — you may only schedule jobs from the input` }
      if (seenJobs.has(stop.jobId)) return { error: `Job ${stop.jobId} appears more than once in the plan` }
      seenJobs.add(stop.jobId)
      const job = context.jobs.find((j) => j.jobId === stop.jobId)!
      if (job.lockedToCrewId && job.lockedToCrewId !== crew.crewId) {
        return { error: `Job ${stop.jobId} is locked to crew ${job.lockedToCrewId} and cannot be moved` }
      }
    }
  }
  for (const u of plan.unassigned) {
    if (!knownJobs.has(u.jobId)) return { error: `Unknown jobId ${u.jobId} in unassigned list` }
  }
  return { plan }
}

// ---------------------------------------------------------------------------
// Model call
// ---------------------------------------------------------------------------

export const PLANNER_SYSTEM_PROMPT = `You are the dispatch planner for Prestige View Services, a property maintenance company in Petawawa/Pembroke, Ontario. You build the daily crew plan from the jobs and crews you are given.

HARD RULES:
- You may NOT invent jobs, customers, prices, workers, or crews. You only sequence and assign exactly what is in the input. Every jobId and crewId in your output must come from the input.
- A job marked lockedToCrewId must stay on that crew.
- Each job appears at most once: either in one crew's stops or in unassigned.
- Respect the workday window and each crew's maximum hours per day.

OPTIMIZATION OBJECTIVES, in strict priority order:
1. Never schedule a crew without the required certification level for the work (check requiredCertificationLevel against the crew members' certifications for the job's division).
2. Complete all Emergency and High priority jobs.
3. Maximize revenue per crew hour against the target rate.
4. Minimize total drive time — build tight geographic clusters, ideally one route zone per crew per day (use the driveMinutes matrix).
5. Balance hours across crews so no crew is at 10 hours while another is at 4.
6. Group same-division work together to avoid equipment swaps.
7. Front-load weather-dependent exterior work early in the day.

OUTPUT: respond with ONLY a JSON object, no markdown fences, no prose, matching exactly:
{
  "crews": [{
    "crewId": string,
    "stops": [{ "jobId": string, "arrival": "HH:mm", "departure": "HH:mm", "driveMinutesFromPrevious": number }],
    "totalCrewHours": number,
    "totalRevenue": number,
    "revenuePerCrewHour": number,
    "rationale": string   // 1-3 plain-language sentences on why this route
  }],
  "unassigned": [{ "jobId": string, "reason": string }],
  "warnings": [string]
}
Arrival/departure are 24h local times. departure = arrival + job duration. driveMinutesFromPrevious is 0 for the first stop. Jobs that cannot be sensibly scheduled today go in unassigned with a concrete reason.`

export type ModelCaller = (system: string, userContent: string) => Promise<string>

function extractJson(text: string): unknown {
  // The model is told not to fence, but strip fences defensively
  const cleaned = text.replace(/^```(?:json)?\s*/m, '').replace(/```\s*$/m, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found in model response')
  return JSON.parse(cleaned.slice(start, end + 1))
}

/**
 * Build a plan: one model call, Zod + semantic validation, one retry with the
 * validation error fed back. Throws with a human-readable message on failure.
 * Never writes to the database.
 */
export async function buildPlan(context: PlannerContext, callModel: ModelCaller): Promise<Plan> {
  const userContent = JSON.stringify(context)
  let lastError = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0
        ? userContent
        : `${userContent}\n\nYour previous response was rejected: ${lastError}\nReturn corrected JSON only.`
    const text = await callModel(PLANNER_SYSTEM_PROMPT, prompt)
    try {
      const raw = extractJson(text)
      const { plan, error } = validatePlan(raw, context)
      if (plan) return plan
      lastError = error ?? 'unknown validation error'
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'unparseable response'
    }
  }
  throw new Error(`The planner could not produce a valid plan (${lastError}). Try again.`)
}

// ---------------------------------------------------------------------------
// Follow-up chat — same context, may propose a plan revision
// ---------------------------------------------------------------------------

const chatResponseSchema = z.object({
  reply: z.string(),
  plan: planSchema.optional(),
})

export interface PlannerChatMessage {
  role: 'user' | 'assistant'
  content: string
}

export async function plannerChat(
  context: PlannerContext,
  currentPlan: Plan | null,
  messages: PlannerChatMessage[],
  callModel: ModelCaller,
): Promise<{ reply: string; plan?: Plan }> {
  const system = `${PLANNER_SYSTEM_PROMPT}

You are now in follow-up chat mode. The owner asks questions or requests changes against the same input data and the current proposed plan. Respond with ONLY a JSON object:
{ "reply": string, "plan": <full plan object, ONLY when you are proposing a revised plan> }
For pure questions, omit "plan". When revising, return the complete plan (all crews), not a fragment. The same hard rules apply.`

  const transcript = messages.map((m) => `${m.role.toUpperCase()}: ${m.content}`).join('\n')
  const userContent = `INPUT DATA:\n${JSON.stringify(context)}\n\nCURRENT PROPOSED PLAN:\n${currentPlan ? JSON.stringify(currentPlan) : 'none yet'}\n\nCONVERSATION:\n${transcript}`

  let lastError = ''
  for (let attempt = 0; attempt < 2; attempt++) {
    const prompt =
      attempt === 0 ? userContent : `${userContent}\n\nYour previous response was rejected: ${lastError}\nReturn corrected JSON only.`
    const text = await callModel(system, prompt)
    try {
      const raw = extractJson(text)
      const parsed = chatResponseSchema.safeParse(raw)
      if (!parsed.success) {
        lastError = parsed.error.issues.map((i) => i.message).join('; ')
        continue
      }
      if (parsed.data.plan) {
        const { plan, error } = validatePlan(parsed.data.plan, context)
        if (error) {
          lastError = error
          continue
        }
        return { reply: parsed.data.reply, plan }
      }
      return { reply: parsed.data.reply }
    } catch (err) {
      lastError = err instanceof Error ? err.message : 'unparseable response'
    }
  }
  throw new Error(`The planner chat could not produce a valid response (${lastError}).`)
}

// ---------------------------------------------------------------------------
// Applying an approved plan — the ONLY write path, runs after human approval
// ---------------------------------------------------------------------------

export interface ApproveCrewPlanInput {
  crewId: string
  rationale: string
  totalRevenue: number
  totalCrewHours: number
  stops: { jobId: string; arrival: string }[]
}

export function applyPlan(db: Db, date: string, approved: ApproveCrewPlanInput[]) {
  db.transaction((tx) => {
    for (const crew of approved) {
      // Replace any existing draft plan for this crew/date
      tx.delete(s.dayPlans).where(and(eq(s.dayPlans.date, date), eq(s.dayPlans.crewId, crew.crewId))).run()
      tx.insert(s.dayPlans)
        .values({
          date,
          crewId: crew.crewId,
          status: 'Approved',
          generatedBy: 'AI',
          aiRationale: crew.rationale,
          plannedRevenue: crew.totalRevenue,
          plannedCrewHours: crew.totalCrewHours,
          approvedAt: Date.now(),
        })
        .run()
      crew.stops.forEach((stop, idx) => {
        const [h, m] = stop.arrival.split(':').map(Number)
        const startAt = new Date(`${date}T12:00:00`)
        startAt.setHours(h, m, 0, 0)
        tx.update(s.jobs)
          .set({
            assignedCrewId: crew.crewId,
            scheduledDate: date,
            scheduledStartAt: startAt.getTime(),
            sequenceOrder: idx,
            status: 'Scheduled',
            updatedAt: Date.now(),
          })
          .where(eq(s.jobs.id, stop.jobId))
          .run()
        tx.insert(s.activityLog)
          .values({
            entityType: 'job',
            entityId: stop.jobId,
            action: 'ai_plan_applied',
            detail: `crew=${crew.crewId} ${date} ${stop.arrival}`,
          })
          .run()
      })
    }
  })
}

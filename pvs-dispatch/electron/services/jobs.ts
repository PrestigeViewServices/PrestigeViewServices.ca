import { and, eq, gte, inArray, isNull, lte } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import type {
  DashboardStats,
  JobCreateInput,
  JobListItem,
  ScheduleJobInput,
  ScheduleJobResult,
  ScheduleWarning,
} from '../../shared/types'

const now = () => Date.now()

function logActivity(db: Db, entityId: string, action: string, detail?: string) {
  db.insert(s.activityLog).values({ entityType: 'job', entityId, action, detail: detail ?? null }).run()
}

export interface JobListFilter {
  dateFrom?: string // YYYY-MM-DD inclusive
  dateTo?: string
  unscheduledOnly?: boolean
  customerId?: string
  division?: string
}

export function listJobs(db: Db, filter: JobListFilter = {}): JobListItem[] {
  const conditions = [isNull(s.jobs.archivedAt)]
  if (filter.customerId) conditions.push(eq(s.jobs.customerId, filter.customerId))
  if (filter.division) conditions.push(eq(s.jobs.division, filter.division))
  if (filter.unscheduledOnly) {
    conditions.push(isNull(s.jobs.assignedCrewId))
    conditions.push(inArray(s.jobs.status, ['Unscheduled', 'Scheduled']))
  }
  if (filter.dateFrom) conditions.push(gte(s.jobs.scheduledDate, filter.dateFrom))
  if (filter.dateTo) conditions.push(lte(s.jobs.scheduledDate, filter.dateTo))

  const rows = db
    .select({
      job: s.jobs,
      customerName: s.customers.name,
      customerPhone: s.customers.phone,
      address: s.properties.address,
      routeZone: s.properties.routeZone,
      gateCode: s.properties.gateCode,
      petOnSite: s.properties.petOnSite,
      hazards: s.properties.hazards,
      parkingNotes: s.properties.parkingNotes,
      accessNotes: s.properties.accessNotes,
      lat: s.properties.lat,
      lng: s.properties.lng,
      crewName: s.crews.name,
      crewColor: s.crews.colorHex,
    })
    .from(s.jobs)
    .innerJoin(s.customers, eq(s.jobs.customerId, s.customers.id))
    .innerJoin(s.properties, eq(s.jobs.propertyId, s.properties.id))
    .leftJoin(s.crews, eq(s.jobs.assignedCrewId, s.crews.id))
    .where(and(...conditions))
    .all()

  const jobIds = rows.map((r) => r.job.id)
  const lineItems = jobIds.length
    ? db.select().from(s.jobLineItems).where(inArray(s.jobLineItems.jobId, jobIds)).all()
    : []

  return rows.map((r) => ({
    ...r.job,
    customerName: r.customerName,
    customerPhone: r.customerPhone,
    address: r.address,
    routeZone: r.routeZone,
    gateCode: r.gateCode,
    petOnSite: r.petOnSite,
    hazards: r.hazards,
    parkingNotes: r.parkingNotes,
    accessNotes: r.accessNotes,
    lat: r.lat,
    lng: r.lng,
    crewName: r.crewName,
    crewColor: r.crewColor,
    lineItems: lineItems.filter((li) => li.jobId === r.job.id),
  }))
}

export function createJob(db: Db, input: JobCreateInput): string {
  return db.transaction((tx) => {
    const id = crypto.randomUUID()
    const scheduled = !!input.scheduledDate
    tx.insert(s.jobs)
      .values({
        id,
        customerId: input.customerId,
        propertyId: input.propertyId,
        division: input.division,
        title: input.title,
        status: scheduled ? 'Scheduled' : 'Unscheduled',
        priority: input.priority,
        scheduledDate: input.scheduledDate,
        scheduledStartAt: input.scheduledStartAt,
        estimatedDurationMinutes: input.estimatedDurationMinutes,
        quotedAmount: input.quotedAmount,
        estimatedCrewHours: input.estimatedDurationMinutes / 60,
        weatherDependent: input.weatherDependent,
        description: input.description ?? null,
        internalNotes: input.internalNotes ?? null,
        customerFacingNotes: input.customerFacingNotes ?? null,
        source: 'manual',
      })
      .run()
    for (const li of input.lineItems) {
      tx.insert(s.jobLineItems)
        .values({
          jobId: id,
          serviceCatalogId: li.serviceCatalogId,
          description: li.description,
          quantity: li.quantity,
          unit: li.unit,
          price: li.price,
        })
        .run()
    }
    return id
  })
}

export function updateJob(
  db: Db,
  input: { id: string } & Partial<
    Pick<
      JobCreateInput,
      | 'title'
      | 'priority'
      | 'estimatedDurationMinutes'
      | 'quotedAmount'
      | 'weatherDependent'
      | 'description'
      | 'internalNotes'
      | 'customerFacingNotes'
    >
  > & { status?: (typeof s.jobs.$inferSelect)['status']; recurrenceRule?: string | null },
) {
  const { id, ...rest } = input
  db.transaction((tx) => {
    tx.update(s.jobs)
      .set({ ...rest, updatedAt: now() })
      .where(eq(s.jobs.id, id))
      .run()
  })
  if (input.status) logActivity(db, id, 'status_change', input.status)
  else logActivity(db, id, 'edit')
}

export function archiveJob(db: Db, id: string) {
  db.update(s.jobs).set({ archivedAt: now(), updatedAt: now() }).where(eq(s.jobs.id, id)).run()
  logActivity(db, id, 'archived')
}

// ------------------------------ Scheduling ----------------------------------

/** Straight-line distance in km between two coordinates. */
function haversineKm(aLat: number, aLng: number, bLat: number, bLng: number): number {
  const R = 6371
  const dLat = ((bLat - aLat) * Math.PI) / 180
  const dLng = ((bLng - aLng) * Math.PI) / 180
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(h))
}

/** Default TravelProvider: haversine at 40 km/h average + 5 min buffer. */
export function estimateDriveMinutes(aLat: number, aLng: number, bLat: number, bLng: number): number {
  return Math.round((haversineKm(aLat, aLng, bLat, bLng) / 40) * 60) + 5
}

export function validateAssignment(db: Db, input: ScheduleJobInput): ScheduleWarning[] {
  const warnings: ScheduleWarning[] = []
  if (!input.crewId || !input.scheduledDate) return warnings

  const job = db.select().from(s.jobs).where(eq(s.jobs.id, input.jobId)).get()
  if (!job) return warnings
  const settings = db.select().from(s.settings).where(eq(s.settings.id, 'singleton')).get()
  const maxHours = settings?.maxCrewHoursPerDay ?? 10

  const members = db
    .select({ member: s.crewMembers, worker: s.workers })
    .from(s.crewMembers)
    .innerJoin(s.workers, eq(s.crewMembers.workerId, s.workers.id))
    .where(and(eq(s.crewMembers.crewId, input.crewId), isNull(s.crewMembers.archivedAt)))
    .all()

  // Required certification level: highest across the job's line items
  const lineItems = db.select().from(s.jobLineItems).where(eq(s.jobLineItems.jobId, input.jobId)).all()
  const catalogIds = lineItems.map((li) => li.serviceCatalogId).filter((x): x is string => !!x)
  const catalogItems = catalogIds.length
    ? db.select().from(s.serviceCatalog).where(inArray(s.serviceCatalog.id, catalogIds)).all()
    : []
  const requiredLevel = Math.max(1, ...catalogItems.map((c) => c.requiredCertificationLevel))

  if (requiredLevel > 1 && members.length > 0) {
    const memberIds = members.map((m) => m.worker.id)
    const certs = db
      .select()
      .from(s.certifications)
      .where(and(inArray(s.certifications.workerId, memberIds), isNull(s.certifications.archivedAt)))
      .all()
    const hasCertified = certs.some((c) => c.division === job.division && c.level >= requiredLevel)
    if (!hasCertified) {
      warnings.push({
        kind: 'certification',
        message: `No one on this crew holds a Level ${requiredLevel} ${job.division} certification this work requires.`,
      })
    }
  }

  if (members.length > 0 && !members.some((m) => m.member.isLead)) {
    warnings.push({ kind: 'no_crew_lead', message: 'This crew has no designated crew lead.' })
  }

  // Time off overlap with the scheduled window
  if (input.scheduledStartAt) {
    const jobEnd = input.scheduledStartAt + job.estimatedDurationMinutes * 60_000
    const memberIds = members.map((m) => m.worker.id)
    if (memberIds.length) {
      const offs = db
        .select({ off: s.timeOff, workerName: s.workers.name })
        .from(s.timeOff)
        .innerJoin(s.workers, eq(s.timeOff.workerId, s.workers.id))
        .where(and(inArray(s.timeOff.workerId, memberIds), isNull(s.timeOff.archivedAt)))
        .all()
      for (const { off, workerName } of offs) {
        if (off.startAt < jobEnd && off.endAt > input.scheduledStartAt) {
          warnings.push({
            kind: 'time_off',
            message: `${workerName} is on ${off.type} during this job's time window.`,
          })
        }
      }
    }
  }

  // Crew day total vs max hours
  const dayJobs = db
    .select()
    .from(s.jobs)
    .where(
      and(
        eq(s.jobs.assignedCrewId, input.crewId),
        eq(s.jobs.scheduledDate, input.scheduledDate),
        isNull(s.jobs.archivedAt),
      ),
    )
    .all()
  const otherMinutes = dayJobs
    .filter((j) => j.id !== input.jobId)
    .reduce((sum, j) => sum + j.estimatedDurationMinutes, 0)
  const totalHours = (otherMinutes + job.estimatedDurationMinutes) / 60
  if (totalHours > maxHours) {
    warnings.push({
      kind: 'max_hours',
      message: `This puts the crew at ${totalHours.toFixed(1)}h for the day (max ${maxHours}h).`,
    })
  }

  // Drive time feasibility from the previous stop (haversine estimate)
  if (input.scheduledStartAt) {
    const thisProp = db.select().from(s.properties).where(eq(s.properties.id, job.propertyId)).get()
    const prev = dayJobs
      .filter(
        (j) =>
          j.id !== input.jobId &&
          j.scheduledStartAt != null &&
          j.scheduledStartAt < input.scheduledStartAt!,
      )
      .sort((a, b) => (b.scheduledStartAt ?? 0) - (a.scheduledStartAt ?? 0))[0]
    if (prev && thisProp?.lat != null && thisProp.lng != null) {
      const prevProp = db.select().from(s.properties).where(eq(s.properties.id, prev.propertyId)).get()
      if (prevProp?.lat != null && prevProp.lng != null) {
        const prevEnd = (prev.scheduledStartAt ?? 0) + prev.estimatedDurationMinutes * 60_000
        const driveMin = estimateDriveMinutes(prevProp.lat, prevProp.lng, thisProp.lat, thisProp.lng)
        if (prevEnd + driveMin * 60_000 > input.scheduledStartAt) {
          warnings.push({
            kind: 'travel',
            message: `Previous stop ends too late — about ${driveMin} min drive makes this start time impossible.`,
          })
        }
      }
    }
  }

  return warnings
}

/**
 * Assign / reassign / retime a job. Returns the previous scheduling fields so
 * the UI can push an undo entry, plus non-blocking validation warnings.
 */
export function scheduleJob(db: Db, input: ScheduleJobInput): ScheduleJobResult {
  const job = db.select().from(s.jobs).where(eq(s.jobs.id, input.jobId)).get()
  if (!job) throw new Error('Job not found')

  const previous: ScheduleJobInput = {
    jobId: job.id,
    crewId: job.assignedCrewId,
    scheduledDate: job.scheduledDate,
    scheduledStartAt: job.scheduledStartAt,
    sequenceOrder: job.sequenceOrder,
  }

  const warnings = validateAssignment(db, input)

  db.transaction((tx) => {
    const nextStatus =
      input.crewId && input.scheduledDate
        ? job.status === 'Unscheduled'
          ? 'Scheduled'
          : job.status
        : 'Unscheduled'
    tx.update(s.jobs)
      .set({
        assignedCrewId: input.crewId,
        scheduledDate: input.scheduledDate,
        scheduledStartAt: input.scheduledStartAt,
        sequenceOrder: input.sequenceOrder ?? null,
        status: nextStatus,
        updatedAt: now(),
      })
      .where(eq(s.jobs.id, input.jobId))
      .run()
  })
  logActivity(
    db,
    input.jobId,
    'reassigned',
    `crew=${input.crewId ?? 'none'} date=${input.scheduledDate ?? 'none'}`,
  )
  return { previous, warnings }
}

// ------------------------------ Dashboard -----------------------------------

export function dashboardStats(db: Db, date: string): DashboardStats {
  const settings = db.select().from(s.settings).where(eq(s.settings.id, 'singleton')).get()
  const overhead = settings?.monthlyOverhead ?? 13088
  const workingDays = settings?.workingDaysPerMonth ?? 22
  const target = settings?.targetRevenuePerCrewHour ?? 145

  const d = new Date(`${date}T12:00:00`)
  const weekday = d.getDay() // 0 Sun
  const monday = new Date(d)
  monday.setDate(d.getDate() - ((weekday + 6) % 7))
  const sunday = new Date(monday)
  sunday.setDate(monday.getDate() + 6)
  const fmt = (x: Date) => x.toISOString().slice(0, 10)

  const active = db
    .select()
    .from(s.jobs)
    .where(and(isNull(s.jobs.archivedAt)))
    .all()
    .filter((j) => j.status !== 'Cancelled')

  const todays = active.filter((j) => j.scheduledDate === date)
  const week = active.filter(
    (j) => j.scheduledDate && j.scheduledDate >= fmt(monday) && j.scheduledDate <= fmt(sunday),
  )
  const unassigned = active.filter(
    (j) => !j.assignedCrewId && (j.status === 'Unscheduled' || j.status === 'Scheduled'),
  )

  const plannedRevenue = todays.filter((j) => j.assignedCrewId).reduce((sum, j) => sum + j.quotedAmount, 0)
  const plannedMinutes = todays
    .filter((j) => j.assignedCrewId)
    .reduce((sum, j) => sum + j.estimatedDurationMinutes, 0)
  const plannedCrewHours = plannedMinutes / 60

  const crews = db.select().from(s.crews).where(and(isNull(s.crews.archivedAt), eq(s.crews.active, true))).all()
  const maxHours = settings?.maxCrewHoursPerDay ?? 10
  const availableCrewHours = crews.length * maxHours

  const needsAttention: DashboardStats['needsAttention'] = []
  for (const j of unassigned.slice(0, 15)) {
    needsAttention.push({ kind: 'unassigned', message: `Unassigned: ${j.title}`, jobId: j.id })
  }
  // Crews with no lead
  const memberships = db.select().from(s.crewMembers).where(isNull(s.crewMembers.archivedAt)).all()
  for (const crew of crews) {
    const members = memberships.filter((m) => m.crewId === crew.id)
    if (members.length > 0 && !members.some((m) => m.isLead)) {
      needsAttention.push({ kind: 'no_lead', message: `${crew.name} has no designated crew lead` })
    }
  }
  // Workers scheduled today while on time off
  const offs = db.select().from(s.timeOff).where(isNull(s.timeOff.archivedAt)).all()
  const dayStart = new Date(`${date}T00:00:00`).getTime()
  const dayEnd = dayStart + 24 * 60 * 60 * 1000
  const crewsWorkingToday = new Set(todays.map((j) => j.assignedCrewId).filter(Boolean))
  for (const off of offs) {
    if (off.startAt < dayEnd && off.endAt > dayStart) {
      const theirCrews = memberships.filter((m) => m.workerId === off.workerId && crewsWorkingToday.has(m.crewId))
      if (theirCrews.length > 0) {
        const worker = db.select().from(s.workers).where(eq(s.workers.id, off.workerId)).get()
        needsAttention.push({
          kind: 'time_off_conflict',
          message: `${worker?.name ?? 'A worker'} is on ${off.type} but their crew is scheduled today`,
        })
      }
    }
  }

  return {
    date,
    jobsToday: todays.length,
    jobsThisWeek: week.length,
    unassignedJobs: unassigned.length,
    plannedRevenueToday: plannedRevenue,
    dailyOverheadBreakEven: overhead / workingDays,
    plannedCrewHoursToday: plannedCrewHours,
    availableCrewHoursToday: availableCrewHours,
    revenuePerCrewHour: plannedCrewHours > 0 ? plannedRevenue / plannedCrewHours : 0,
    targetRevenuePerCrewHour: target,
    needsAttention,
  }
}

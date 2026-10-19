import { and, eq, isNull, isNotNull } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'

export interface ReportsInput {
  from: string // YYYY-MM-DD inclusive
  to: string
}

export interface ReportsData {
  from: string
  to: string
  revenueByDivision: { division: string; revenue: number; jobs: number }[]
  revenueByCrew: { crewId: string; crewName: string; revenue: number; jobs: number; crewHours: number; revenuePerHour: number }[]
  revenueByMonth: { month: string; revenue: number; crewHours: number; revenuePerHour: number; target: number }[]
  compliance: {
    crewId: string
    crewName: string
    completed: number
    withAfterPhoto: number
    checklistComplete: number
  }[]
  customerLtv: { customerId: string; name: string; lifetimeValue: number; completedRevenue: number }[]
  recurring: {
    activeRecurringJobs: number
    recurringJobValue: number
    activeSnowContracts: number
    snowContractValue: number
  }
  driveTimeShare: number | null // planned drive minutes / total planned minutes, when derivable
  targetRevenuePerCrewHour: number
}

export function reportsData(db: Db, input: ReportsInput): ReportsData {
  const settings = db.select().from(s.settings).where(eq(s.settings.id, 'singleton')).get()
  const target = settings?.targetRevenuePerCrewHour ?? 145

  const jobs = db
    .select({ job: s.jobs, crewName: s.crews.name })
    .from(s.jobs)
    .leftJoin(s.crews, eq(s.jobs.assignedCrewId, s.crews.id))
    .where(and(isNull(s.jobs.archivedAt), isNotNull(s.jobs.scheduledDate)))
    .all()
    .filter(
      (r) =>
        r.job.scheduledDate! >= input.from &&
        r.job.scheduledDate! <= input.to &&
        r.job.status !== 'Cancelled',
    )
  const completed = jobs.filter((r) => r.job.status === 'Complete')

  // Revenue by division (completed work only — booked revenue, not pipeline)
  const byDivision = new Map<string, { revenue: number; jobs: number }>()
  for (const r of completed) {
    const cur = byDivision.get(r.job.division) ?? { revenue: 0, jobs: 0 }
    cur.revenue += r.job.quotedAmount
    cur.jobs += 1
    byDivision.set(r.job.division, cur)
  }

  const byCrew = new Map<string, { crewName: string; revenue: number; jobs: number; minutes: number }>()
  for (const r of completed) {
    if (!r.job.assignedCrewId) continue
    const cur = byCrew.get(r.job.assignedCrewId) ?? { crewName: r.crewName ?? '—', revenue: 0, jobs: 0, minutes: 0 }
    cur.revenue += r.job.quotedAmount
    cur.jobs += 1
    cur.minutes += r.job.estimatedDurationMinutes
    byCrew.set(r.job.assignedCrewId, cur)
  }

  const byMonth = new Map<string, { revenue: number; minutes: number }>()
  for (const r of completed) {
    const month = r.job.scheduledDate!.slice(0, 7)
    const cur = byMonth.get(month) ?? { revenue: 0, minutes: 0 }
    cur.revenue += r.job.quotedAmount
    cur.minutes += r.job.estimatedDurationMinutes
    byMonth.set(month, cur)
  }

  // Compliance: after-photo + all-required-checklist per completed job
  const completedIds = completed.map((r) => r.job.id)
  const photos = completedIds.length
    ? db.select().from(s.jobPhotos).where(isNull(s.jobPhotos.archivedAt)).all().filter((p) => completedIds.includes(p.jobId))
    : []
  const checklist = completedIds.length
    ? db.select().from(s.jobChecklistItems).where(isNull(s.jobChecklistItems.archivedAt)).all().filter((c) => completedIds.includes(c.jobId))
    : []
  const compliance = new Map<string, { crewName: string; completed: number; withAfterPhoto: number; checklistComplete: number }>()
  for (const r of completed) {
    if (!r.job.assignedCrewId) continue
    const cur = compliance.get(r.job.assignedCrewId) ?? {
      crewName: r.crewName ?? '—',
      completed: 0,
      withAfterPhoto: 0,
      checklistComplete: 0,
    }
    cur.completed += 1
    if (photos.some((p) => p.jobId === r.job.id && p.type === 'after')) cur.withAfterPhoto += 1
    const required = checklist.filter((c) => c.jobId === r.job.id && c.required)
    if (required.length === 0 || required.every((c) => c.completedAt)) cur.checklistComplete += 1
    compliance.set(r.job.assignedCrewId, cur)
  }

  // Customer lifetime value ranking (stored LTV + completed revenue in range)
  const customers = db.select().from(s.customers).where(isNull(s.customers.archivedAt)).all()
  const revenueByCustomer = new Map<string, number>()
  for (const r of completed) {
    revenueByCustomer.set(r.job.customerId, (revenueByCustomer.get(r.job.customerId) ?? 0) + r.job.quotedAmount)
  }
  const customerLtv = customers
    .map((c) => ({
      customerId: c.id,
      name: c.name,
      lifetimeValue: c.lifetimeValue,
      completedRevenue: revenueByCustomer.get(c.id) ?? 0,
    }))
    .sort((a, b) => b.lifetimeValue + b.completedRevenue - (a.lifetimeValue + a.completedRevenue))
    .slice(0, 25)

  // Recurring revenue
  const recurringJobs = db
    .select()
    .from(s.jobs)
    .where(and(isNull(s.jobs.archivedAt), isNotNull(s.jobs.recurrenceRule)))
    .all()
    .filter((j) => j.recurrenceRule && !j.parentRecurringJobId)
  const snowContracts = db
    .select()
    .from(s.snowContracts)
    .where(and(isNull(s.snowContracts.archivedAt), eq(s.snowContracts.active, true)))
    .all()

  // Route density proxy: haversine drive minutes between consecutive stops per
  // crew per day / total planned minutes for scheduled days in range
  let driveMinutesTotal = 0
  let workMinutesTotal = 0
  const props = db.select().from(s.properties).all()
  const propById = new Map(props.map((p) => [p.id, p]))
  const byCrewDay = new Map<string, typeof jobs>()
  for (const r of jobs) {
    if (!r.job.assignedCrewId || r.job.scheduledStartAt == null) continue
    const key = `${r.job.assignedCrewId}|${r.job.scheduledDate}`
    byCrewDay.set(key, [...(byCrewDay.get(key) ?? []), r])
  }
  for (const dayJobs of byCrewDay.values()) {
    const sorted = [...dayJobs].sort((a, b) => (a.job.scheduledStartAt ?? 0) - (b.job.scheduledStartAt ?? 0))
    for (let i = 0; i < sorted.length; i++) {
      workMinutesTotal += sorted[i].job.estimatedDurationMinutes
      if (i === 0) continue
      const a = propById.get(sorted[i - 1].job.propertyId)
      const b = propById.get(sorted[i].job.propertyId)
      if (a?.lat != null && a.lng != null && b?.lat != null && b.lng != null) {
        const R = 6371
        const dLat = ((b.lat - a.lat) * Math.PI) / 180
        const dLng = ((b.lng - a.lng) * Math.PI) / 180
        const h =
          Math.sin(dLat / 2) ** 2 +
          Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2
        driveMinutesTotal += Math.round(((2 * R * Math.asin(Math.sqrt(h))) / 40) * 60) + 5
      }
    }
  }

  return {
    from: input.from,
    to: input.to,
    revenueByDivision: [...byDivision.entries()]
      .map(([division, v]) => ({ division, ...v }))
      .sort((a, b) => b.revenue - a.revenue),
    revenueByCrew: [...byCrew.entries()]
      .map(([crewId, v]) => ({
        crewId,
        crewName: v.crewName,
        revenue: v.revenue,
        jobs: v.jobs,
        crewHours: v.minutes / 60,
        revenuePerHour: v.minutes > 0 ? v.revenue / (v.minutes / 60) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue),
    revenueByMonth: [...byMonth.entries()]
      .map(([month, v]) => ({
        month,
        revenue: v.revenue,
        crewHours: v.minutes / 60,
        revenuePerHour: v.minutes > 0 ? v.revenue / (v.minutes / 60) : 0,
        target,
      }))
      .sort((a, b) => a.month.localeCompare(b.month)),
    compliance: [...compliance.entries()].map(([crewId, v]) => ({ crewId, ...v })),
    customerLtv,
    recurring: {
      activeRecurringJobs: recurringJobs.length,
      recurringJobValue: recurringJobs.reduce((sum, j) => sum + j.quotedAmount, 0),
      activeSnowContracts: snowContracts.length,
      snowContractValue: snowContracts.reduce((sum, c) => sum + c.seasonPrice, 0),
    },
    driveTimeShare:
      workMinutesTotal > 0 ? driveMinutesTotal / (driveMinutesTotal + workMinutesTotal) : null,
    targetRevenuePerCrewHour: target,
  }
}

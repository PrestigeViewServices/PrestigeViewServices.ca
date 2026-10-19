import { RRule } from 'rrule'
import { and, eq, isNull, isNotNull } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'

/**
 * Materialize upcoming visits from recurring master jobs. A master job is one
 * with a recurrence_rule and no parent; each occurrence within the horizon
 * becomes a child job (parent_recurring_job_id) unless one already exists for
 * that date. Children inherit crew/time from the master so routes stay stable.
 */
export function generateRecurringJobs(db: Db, horizonDays = 60): number {
  const masters = db
    .select()
    .from(s.jobs)
    .where(and(isNull(s.jobs.archivedAt), isNotNull(s.jobs.recurrenceRule), isNull(s.jobs.parentRecurringJobId)))
    .all()
    .filter((j) => j.status !== 'Cancelled')
  if (masters.length === 0) return 0

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const horizon = new Date(today)
  horizon.setDate(horizon.getDate() + horizonDays)

  let created = 0
  db.transaction((tx) => {
    for (const master of masters) {
      let rule: RRule
      try {
        const dtstart = master.scheduledDate ? new Date(`${master.scheduledDate}T12:00:00`) : new Date(master.createdAt)
        rule = new RRule({ ...RRule.parseString(master.recurrenceRule!), dtstart })
      } catch {
        continue // an unparseable rule shouldn't take the generator down
      }
      const existingChildren = tx
        .select({ scheduledDate: s.jobs.scheduledDate })
        .from(s.jobs)
        .where(and(eq(s.jobs.parentRecurringJobId, master.id), isNull(s.jobs.archivedAt)))
        .all()
      const haveDates = new Set(existingChildren.map((c) => c.scheduledDate))

      for (const occurrence of rule.between(today, horizon, true)) {
        const date = `${occurrence.getFullYear()}-${String(occurrence.getMonth() + 1).padStart(2, '0')}-${String(occurrence.getDate()).padStart(2, '0')}`
        if (date === master.scheduledDate || haveDates.has(date)) continue
        let startAt: number | null = null
        if (master.scheduledStartAt != null) {
          const t = new Date(master.scheduledStartAt)
          const d = new Date(`${date}T12:00:00`)
          d.setHours(t.getHours(), t.getMinutes(), 0, 0)
          startAt = d.getTime()
        }
        tx.insert(s.jobs)
          .values({
            customerId: master.customerId,
            propertyId: master.propertyId,
            division: master.division,
            title: master.title,
            status: master.assignedCrewId ? 'Scheduled' : 'Unscheduled',
            priority: master.priority,
            scheduledDate: date,
            scheduledStartAt: startAt,
            estimatedDurationMinutes: master.estimatedDurationMinutes,
            assignedCrewId: master.assignedCrewId,
            quotedAmount: master.quotedAmount,
            estimatedCrewHours: master.estimatedCrewHours,
            parentRecurringJobId: master.id,
            weatherDependent: master.weatherDependent,
            description: master.description,
            customerFacingNotes: master.customerFacingNotes,
            source: master.source,
          })
          .run()
        haveDates.add(date)
        created++
      }
    }
  })
  return created
}

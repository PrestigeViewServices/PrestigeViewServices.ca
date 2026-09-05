import { and, eq, isNull, lte, inArray } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import type { Crew } from '../../shared/types'

const now = () => Date.now()

export type StormEvent = typeof s.stormEvents.$inferSelect

export interface StormDispatchRow {
  contractId: string
  customerName: string
  customerPhone: string | null
  address: string
  routeZone: string | null
  gateCode: string | null
  hazards: string | null
  tier: string
  triggerCm: number
  slaHours: number
  seasonPrice: number
  slaDeadline: number // epoch ms: storm start + slaHours
  crewId: string | null
  completedAt: number | null
  photoPath: string | null // pvsphoto-style URL when present
  notes: string | null
}

export interface StormDispatch {
  storm: StormEvent
  rows: StormDispatchRow[]
  crews: Crew[]
}

export interface StormSummary {
  totalTriggered: number
  serviced: number
  open: number
  slaBreaches: number
  avgResponseMinutes: number | null
  seasonRevenueCovered: number
}

export function listStorms(db: Db): StormEvent[] {
  return db
    .select()
    .from(s.stormEvents)
    .where(isNull(s.stormEvents.archivedAt))
    .all()
    .sort((a, b) => b.startAt - a.startAt)
}

export interface StormCreateInput {
  name: string
  startAt: number
  classification: 'Light' | 'Standard' | 'Heavy' | 'Extreme'
  snowfallCm: number
  dispatchNotes?: string
}

export function createStorm(db: Db, input: StormCreateInput): string {
  const id = crypto.randomUUID()
  db.transaction((tx) => {
    tx.insert(s.stormEvents)
      .values({
        id,
        name: input.name,
        startAt: input.startAt,
        classification: input.classification,
        snowfallCm: input.snowfallCm,
        triggerThresholdCm: input.snowfallCm,
        status: input.startAt <= now() ? 'Active' : 'Forecast',
        dispatchNotes: input.dispatchNotes ?? null,
      })
      .run()
    // Pre-create a service record per triggered contract — this is the
    // dispatch list and, once completed with a photo, the liability record.
    const triggered = tx
      .select()
      .from(s.snowContracts)
      .where(
        and(
          isNull(s.snowContracts.archivedAt),
          eq(s.snowContracts.active, true),
          lte(s.snowContracts.triggerCm, input.snowfallCm),
        ),
      )
      .all()
    for (const contract of triggered) {
      tx.insert(s.stormServiceRecords).values({ stormEventId: id, snowContractId: contract.id }).run()
    }
  })
  return id
}

/** Re-sync triggered contracts after a snowfall forecast change. */
export function updateStormSnowfall(db: Db, stormId: string, snowfallCm: number) {
  db.transaction((tx) => {
    tx.update(s.stormEvents)
      .set({ snowfallCm, triggerThresholdCm: snowfallCm, updatedAt: now() })
      .where(eq(s.stormEvents.id, stormId))
      .run()
    const triggered = tx
      .select()
      .from(s.snowContracts)
      .where(
        and(
          isNull(s.snowContracts.archivedAt),
          eq(s.snowContracts.active, true),
          lte(s.snowContracts.triggerCm, snowfallCm),
        ),
      )
      .all()
    const existing = tx
      .select()
      .from(s.stormServiceRecords)
      .where(eq(s.stormServiceRecords.stormEventId, stormId))
      .all()
    const have = new Set(existing.map((r) => r.snowContractId))
    for (const contract of triggered) {
      if (!have.has(contract.id)) {
        tx.insert(s.stormServiceRecords).values({ stormEventId: stormId, snowContractId: contract.id }).run()
      }
    }
    // Contracts no longer triggered and not yet serviced drop off the list
    const triggeredIds = new Set(triggered.map((c) => c.id))
    for (const record of existing) {
      if (!triggeredIds.has(record.snowContractId) && !record.completedAt) {
        tx.update(s.stormServiceRecords).set({ archivedAt: now() }).where(eq(s.stormServiceRecords.id, record.id)).run()
      }
    }
  })
}

export function setStormStatus(db: Db, stormId: string, status: 'Forecast' | 'Active' | 'Closed') {
  db.update(s.stormEvents).set({ status, updatedAt: now() }).where(eq(s.stormEvents.id, stormId)).run()
}

export function getStormDispatch(db: Db, stormId: string): StormDispatch {
  const storm = db.select().from(s.stormEvents).where(eq(s.stormEvents.id, stormId)).get()
  if (!storm) throw new Error('Storm not found')
  const records = db
    .select()
    .from(s.stormServiceRecords)
    .where(and(eq(s.stormServiceRecords.stormEventId, stormId), isNull(s.stormServiceRecords.archivedAt)))
    .all()
  const contractIds = records.map((r) => r.snowContractId)
  const contracts = contractIds.length
    ? db
        .select({
          contract: s.snowContracts,
          customerName: s.customers.name,
          customerPhone: s.customers.phone,
          address: s.properties.address,
          routeZone: s.properties.routeZone,
          gateCode: s.properties.gateCode,
          hazards: s.properties.hazards,
        })
        .from(s.snowContracts)
        .innerJoin(s.customers, eq(s.snowContracts.customerId, s.customers.id))
        .innerJoin(s.properties, eq(s.snowContracts.propertyId, s.properties.id))
        .where(inArray(s.snowContracts.id, contractIds))
        .all()
    : []
  const crews = db
    .select()
    .from(s.crews)
    .where(and(isNull(s.crews.archivedAt), eq(s.crews.active, true)))
    .all()

  const rows: StormDispatchRow[] = records
    .map((record) => {
      const c = contracts.find((x) => x.contract.id === record.snowContractId)
      if (!c) return null
      return {
        contractId: c.contract.id,
        customerName: c.customerName,
        customerPhone: c.customerPhone,
        address: c.address,
        routeZone: c.routeZone,
        gateCode: c.gateCode,
        hazards: c.hazards,
        tier: c.contract.tier,
        triggerCm: c.contract.triggerCm,
        slaHours: c.contract.slaHours,
        seasonPrice: c.contract.seasonPrice,
        slaDeadline: storm.startAt + c.contract.slaHours * 60 * 60 * 1000,
        crewId: record.crewId,
        completedAt: record.completedAt,
        photoPath: record.photoPath,
        notes: record.notes,
      }
    })
    .filter((r): r is StormDispatchRow => r !== null)
    // Tightest SLA first, then by zone so crews run tight loops
    .sort(
      (a, b) =>
        a.slaDeadline - b.slaDeadline || (a.routeZone ?? '').localeCompare(b.routeZone ?? ''),
    )

  return { storm, rows, crews }
}

/** One-click: put every un-serviced triggered property in a zone on a crew. */
export function assignZoneToCrew(db: Db, stormId: string, routeZone: string, crewId: string | null) {
  const dispatch = getStormDispatch(db, stormId)
  const contractIds = dispatch.rows
    .filter((r) => (r.routeZone ?? 'Unzoned') === routeZone && !r.completedAt)
    .map((r) => r.contractId)
  if (contractIds.length === 0) return 0
  db.transaction((tx) => {
    for (const contractId of contractIds) {
      tx.update(s.stormServiceRecords)
        .set({ crewId, updatedAt: now() })
        .where(
          and(
            eq(s.stormServiceRecords.stormEventId, stormId),
            eq(s.stormServiceRecords.snowContractId, contractId),
          ),
        )
        .run()
    }
  })
  return contractIds.length
}

/** Completion check-off. photoSourcePath is required — it is the liability record. */
export function completeStormStop(
  db: Db,
  input: { stormId: string; contractId: string; photoStoredPath: string; notes?: string },
) {
  db.update(s.stormServiceRecords)
    .set({
      completedAt: now(),
      photoPath: input.photoStoredPath,
      notes: input.notes ?? null,
      updatedAt: now(),
    })
    .where(
      and(
        eq(s.stormServiceRecords.stormEventId, input.stormId),
        eq(s.stormServiceRecords.snowContractId, input.contractId),
      ),
    )
    .run()
}

export function stormSummary(db: Db, stormId: string): StormSummary {
  const { storm, rows } = getStormDispatch(db, stormId)
  const serviced = rows.filter((r) => r.completedAt)
  const breaches = rows.filter(
    (r) =>
      (r.completedAt && r.completedAt > r.slaDeadline) ||
      (!r.completedAt && storm.status === 'Closed'),
  )
  const responses = serviced.map((r) => (r.completedAt! - storm.startAt) / 60000)
  return {
    totalTriggered: rows.length,
    serviced: serviced.length,
    open: rows.length - serviced.length,
    slaBreaches: breaches.length,
    avgResponseMinutes: responses.length
      ? Math.round(responses.reduce((a, b) => a + b, 0) / responses.length)
      : null,
    seasonRevenueCovered: serviced.reduce((sum, r) => sum + r.seasonPrice, 0),
  }
}

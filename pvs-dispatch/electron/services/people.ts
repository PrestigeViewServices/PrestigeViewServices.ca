import { and, eq, isNull, inArray } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import type {
  CrewSaveInput,
  CrewWithMembers,
  Vehicle,
  Worker,
  WorkerDetail,
  WorkerSaveInput,
} from '../../shared/types'

const now = () => Date.now()

export function listWorkers(db: Db): Worker[] {
  return db.select().from(s.workers).where(isNull(s.workers.archivedAt)).all()
}

export function getWorkerDetail(db: Db, workerId: string): WorkerDetail {
  const worker = db.select().from(s.workers).where(eq(s.workers.id, workerId)).get()
  if (!worker) throw new Error('Worker not found')
  const certifications = db
    .select()
    .from(s.certifications)
    .where(and(eq(s.certifications.workerId, workerId), isNull(s.certifications.archivedAt)))
    .all()
  const avail = db
    .select()
    .from(s.availability)
    .where(eq(s.availability.workerId, workerId))
    .all()
  const off = db
    .select()
    .from(s.timeOff)
    .where(and(eq(s.timeOff.workerId, workerId), isNull(s.timeOff.archivedAt)))
    .all()
  const memberships = db
    .select({ crewName: s.crews.name })
    .from(s.crewMembers)
    .innerJoin(s.crews, eq(s.crewMembers.crewId, s.crews.id))
    .where(and(eq(s.crewMembers.workerId, workerId), isNull(s.crewMembers.archivedAt)))
    .all()
  return {
    ...worker,
    certifications,
    availability: avail,
    timeOff: off,
    crewNames: memberships.map((m) => m.crewName),
  }
}

export function saveWorker(db: Db, input: WorkerSaveInput): Worker {
  return db.transaction((tx) => {
    let workerId = input.id
    const fields = {
      name: input.name,
      phone: input.phone,
      email: input.email,
      role: input.role,
      divisionAffinities: input.divisionAffinities,
      hourlyCost: input.hourlyCost,
      employmentType: input.employmentType,
      hireDate: input.hireDate,
      status: input.status,
      emergencyContact: input.emergencyContact,
      notes: input.notes,
      updatedAt: now(),
    }
    if (workerId) {
      tx.update(s.workers).set(fields).where(eq(s.workers.id, workerId)).run()
    } else {
      workerId = crypto.randomUUID()
      tx.insert(s.workers).values({ id: workerId, ...fields }).run()
    }
    // Replace certifications wholesale (small list, simplest correct thing)
    tx.delete(s.certifications).where(eq(s.certifications.workerId, workerId)).run()
    for (const c of input.certifications) {
      tx.insert(s.certifications)
        .values({
          workerId,
          division: c.division,
          level: c.level,
          expiryDate: c.expiryDate,
        })
        .run()
    }
    return tx.select().from(s.workers).where(eq(s.workers.id, workerId)).get() as Worker
  })
}

export function archiveWorker(db: Db, workerId: string) {
  db.transaction((tx) => {
    tx.update(s.workers).set({ archivedAt: now(), updatedAt: now() }).where(eq(s.workers.id, workerId)).run()
    tx.update(s.crewMembers)
      .set({ archivedAt: now() })
      .where(eq(s.crewMembers.workerId, workerId))
      .run()
  })
}

export function listTimeOff(db: Db, workerId?: string) {
  const base = and(isNull(s.timeOff.archivedAt), workerId ? eq(s.timeOff.workerId, workerId) : undefined)
  return db.select().from(s.timeOff).where(base).all()
}

export function createTimeOff(
  db: Db,
  input: { workerId: string; startAt: number; endAt: number; type: 'vacation' | 'sick' | 'unavailable'; note?: string },
) {
  db.insert(s.timeOff)
    .values({
      workerId: input.workerId,
      startAt: input.startAt,
      endAt: input.endAt,
      type: input.type,
      note: input.note ?? null,
    })
    .run()
}

export function deleteTimeOff(db: Db, id: string) {
  db.update(s.timeOff).set({ archivedAt: now() }).where(eq(s.timeOff.id, id)).run()
}

export function listCrews(db: Db): CrewWithMembers[] {
  const crews = db.select().from(s.crews).where(isNull(s.crews.archivedAt)).all()
  if (crews.length === 0) return []
  const members = db
    .select()
    .from(s.crewMembers)
    .where(and(inArray(s.crewMembers.crewId, crews.map((c) => c.id)), isNull(s.crewMembers.archivedAt)))
    .all()
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
  const workerById = new Map(workers.map((w) => [w.id, w]))

  return crews.map((crew) => ({
    ...crew,
    members: members
      .filter((m) => m.crewId === crew.id && workerById.has(m.workerId))
      .map((m) => ({
        ...m,
        worker: workerById.get(m.workerId)!,
        certifications: certs.filter((c) => c.workerId === m.workerId),
      })),
    vehicle: vehicles.find((v) => v.id === crew.defaultVehicleId) ?? null,
  }))
}

export function saveCrew(db: Db, input: CrewSaveInput) {
  return db.transaction((tx) => {
    let crewId = input.id
    const fields = {
      name: input.name,
      division: input.division,
      colorHex: input.colorHex,
      defaultVehicleId: input.defaultVehicleId,
      active: input.active,
      updatedAt: now(),
    }
    if (crewId) {
      tx.update(s.crews).set(fields).where(eq(s.crews.id, crewId)).run()
    } else {
      crewId = crypto.randomUUID()
      tx.insert(s.crews).values({ id: crewId, ...fields }).run()
    }
    tx.delete(s.crewMembers).where(eq(s.crewMembers.crewId, crewId)).run()
    for (const m of input.members) {
      tx.insert(s.crewMembers).values({ crewId, workerId: m.workerId, isLead: m.isLead }).run()
    }
    return crewId
  })
}

export function archiveCrew(db: Db, crewId: string) {
  db.transaction((tx) => {
    tx.update(s.crews).set({ archivedAt: now(), updatedAt: now() }).where(eq(s.crews.id, crewId)).run()
    // Jobs assigned to an archived crew fall back to the unassigned rail
    tx.update(s.jobs)
      .set({ assignedCrewId: null, updatedAt: now() })
      .where(and(eq(s.jobs.assignedCrewId, crewId), isNull(s.jobs.archivedAt)))
      .run()
  })
}

export function listVehicles(db: Db): Vehicle[] {
  return db.select().from(s.vehicles).where(isNull(s.vehicles.archivedAt)).all()
}

export function saveVehicle(
  db: Db,
  input: { id?: string; name: string; plate: string | null; type: string | null; status: 'active' | 'in shop' },
) {
  if (input.id) {
    db.update(s.vehicles)
      .set({ name: input.name, plate: input.plate, type: input.type, status: input.status, updatedAt: now() })
      .where(eq(s.vehicles.id, input.id))
      .run()
    return input.id
  }
  const id = crypto.randomUUID()
  db.insert(s.vehicles)
    .values({ id, name: input.name, plate: input.plate, type: input.type, status: input.status })
    .run()
  return id
}

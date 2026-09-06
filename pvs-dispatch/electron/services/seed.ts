import type { Db } from '../db'
import * as s from '../db/schema'
import { DEFAULT_DIVISION_COLORS } from '../../shared/types'
import { eq } from 'drizzle-orm'

// Deterministic PRNG so the demo dataset is stable run to run
function mulberry32(seed: number) {
  return () => {
    seed |= 0
    seed = (seed + 0x6d2b79f5) | 0
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

const FIRST = ['Liam', 'Noah', 'Olivia', 'Emma', 'Jacob', 'Sophie', 'Ethan', 'Ava', 'Lucas', 'Mia', 'Mason', 'Chloe', 'Owen', 'Zoe', 'Nathan', 'Ella', 'Cole', 'Ruby', 'Tyler', 'Grace']
const LAST = ['Tremblay', 'MacDonald', 'Leblanc', 'Campbell', 'Gagnon', 'Stewart', 'Roy', 'Wilson', 'Cote', 'Taylor', 'Bergeron', 'Anderson', 'Morin', 'Clark', 'Lavoie', 'Wright', 'Fortin', 'Mitchell', 'Girard', 'Robinson']
const PETAWAWA_STREETS = ['Victoria St', 'Petawawa Blvd', 'Doran Rd', 'Laurentian Dr', 'Herman St', 'Civic Centre Rd', 'Mohns Ave', 'Ethel St', 'Festubert Blvd', 'Menin Rd']
const PEMBROKE_STREETS = ['Pembroke St W', 'Nelson St', 'Christie St', 'Mackay St', 'Bell St', 'Isabella St', 'Renfrew St', 'Douglas Ave', 'Herbert St', 'Boundary Rd']

export function isDatabaseEmpty(db: Db): boolean {
  return db.select().from(s.workers).all().length === 0
}

export function seedDemoData(db: Db) {
  const rand = mulberry32(20260905)
  const pick = <T>(arr: readonly T[]): T => arr[Math.floor(rand() * arr.length)]
  const chance = (p: number) => rand() < p

  db.transaction((tx) => {
    // ---------------- Service catalog ----------------
    const catalog: { id: string; name: string; division: string; minutes: number; price: number; level: number }[] = [
      { id: '', name: 'Lawn Mowing', division: 'LawnPros', minutes: 45, price: 65, level: 1 },
      { id: '', name: 'Spring Cleanup', division: 'LawnPros', minutes: 150, price: 320, level: 1 },
      { id: '', name: 'Fall Cleanup', division: 'LawnPros', minutes: 150, price: 300, level: 1 },
      { id: '', name: 'Aeration', division: 'LawnPros', minutes: 60, price: 140, level: 2 },
      { id: '', name: 'Dethatching', division: 'LawnPros', minutes: 90, price: 180, level: 2 },
      { id: '', name: 'Overseeding', division: 'LawnPros', minutes: 45, price: 120, level: 1 },
      { id: '', name: 'Hedge Trimming', division: 'LawnPros', minutes: 75, price: 150, level: 2 },
      { id: '', name: 'Window Cleaning (out only)', division: 'ClearView', minutes: 90, price: 190, level: 1 },
      { id: '', name: 'Window Cleaning (in & out)', division: 'ClearView', minutes: 150, price: 310, level: 2 },
      { id: '', name: 'Gutter Cleaning', division: 'ClearView', minutes: 90, price: 210, level: 2 },
      { id: '', name: 'Pressure Washing', division: 'ClearView', minutes: 120, price: 280, level: 2 },
      { id: '', name: 'House Washing', division: 'ClearView', minutes: 180, price: 420, level: 3 },
      { id: '', name: 'Driveway Snow Clearing', division: 'SnowLand', minutes: 20, price: 45, level: 1 },
      { id: '', name: 'Walkway Package', division: 'SnowLand', minutes: 15, price: 25, level: 1 },
      { id: '', name: 'Junk Removal (half load)', division: 'Junk Removal', minutes: 90, price: 260, level: 1 },
      { id: '', name: 'Interlock Repair', division: 'Hardscape', minutes: 240, price: 850, level: 3 },
    ]
    for (const c of catalog) {
      c.id = crypto.randomUUID()
      tx.insert(s.serviceCatalog)
        .values({
          id: c.id,
          name: c.name,
          division: c.division,
          defaultDurationMinutes: c.minutes,
          defaultPrice: c.price,
          requiredCertificationLevel: c.level,
          crewSizeRequired: 2,
        })
        .run()
    }

    // ---------------- Vehicles ----------------
    const vehicleIds: string[] = []
    for (const v of [
      { name: 'Truck 1 — F-150 + trailer', type: 'Pickup + trailer' },
      { name: 'Truck 2 — Silverado', type: 'Pickup' },
      { name: 'Van 1 — Transit (ClearView)', type: 'Van' },
      { name: 'Truck 3 — RAM w/ plow', type: 'Plow truck' },
    ]) {
      const id = crypto.randomUUID()
      vehicleIds.push(id)
      tx.insert(s.vehicles).values({ id, name: v.name, type: v.type, plate: `CN${Math.floor(rand() * 90000 + 10000)}` }).run()
    }

    // ---------------- Workers ----------------
    const divisions = ['LawnPros', 'LawnPros', 'ClearView', 'SnowLand']
    const workerIds: string[] = []
    const usedNames = new Set<string>()
    for (let i = 0; i < 12; i++) {
      let name = `${pick(FIRST)} ${pick(LAST)}`
      while (usedNames.has(name)) name = `${pick(FIRST)} ${pick(LAST)}`
      usedNames.add(name)
      const id = crypto.randomUUID()
      workerIds.push(id)
      const isLead = i % 3 === 0 // 4 leads for 4 crews
      const affinity = divisions[i % 4]
      tx.insert(s.workers)
        .values({
          id,
          name,
          phone: `613-55${Math.floor(rand() * 9)}-${Math.floor(rand() * 9000 + 1000)}`,
          email: `${name.toLowerCase().replace(/ /g, '.')}@pvs.ca`,
          role: isLead ? 'Crew Lead' : i % 5 === 4 ? 'Operator' : 'Technician',
          divisionAffinities: [affinity, ...(chance(0.4) ? ['SnowLand'] : [])],
          hourlyCost: isLead ? 28 : 21 + Math.floor(rand() * 4),
          employmentType: chance(0.7) ? 'Full-Time' : 'Seasonal',
          hireDate: `202${Math.floor(rand() * 4 + 2)}-0${Math.floor(rand() * 8 + 1)}-15`,
        })
        .run()
      // Certifications: leads get level 3 in their division, others 1-2
      tx.insert(s.certifications)
        .values({ workerId: id, division: affinity, level: isLead ? 3 : chance(0.5) ? 2 : 1 })
        .run()
      if (chance(0.4)) {
        tx.insert(s.certifications).values({ workerId: id, division: 'SnowLand', level: 1 }).run()
      }
      // Mon-Fri availability
      for (let wd = 1; wd <= 5; wd++) {
        tx.insert(s.availability).values({ workerId: id, weekday: wd, startTime: '07:30', endTime: '17:00' }).run()
      }
    }

    // ---------------- Crews ----------------
    const crewDefs = [
      { name: 'Lawn Crew 1', division: 'LawnPros' },
      { name: 'Lawn Crew 2', division: 'LawnPros' },
      { name: 'ClearView Crew', division: 'ClearView' },
      { name: 'Snow Crew', division: 'SnowLand' },
    ]
    const crewIds: string[] = []
    crewDefs.forEach((c, ci) => {
      const id = crypto.randomUUID()
      crewIds.push(id)
      tx.insert(s.crews)
        .values({
          id,
          name: c.name,
          division: c.division,
          colorHex: DEFAULT_DIVISION_COLORS[c.division] ?? '#3b82f6',
          defaultVehicleId: vehicleIds[ci],
        })
        .run()
      // 3 members per crew: lead + 2 techs
      for (let m = 0; m < 3; m++) {
        const workerId = workerIds[(ci * 3 + m) % workerIds.length]
        tx.insert(s.crewMembers).values({ crewId: id, workerId, isLead: m === 0 }).run()
      }
    })

    // ---------------- Customers, properties, snow contracts ----------------
    const townCenters = [
      { town: 'Petawawa', lat: 45.8942, lng: -77.2831, streets: PETAWAWA_STREETS, zone: 'Petawawa' },
      { town: 'Pembroke', lat: 45.8266, lng: -77.111, streets: PEMBROKE_STREETS, zone: 'Pembroke' },
    ]
    const propertyPool: { propertyId: string; customerId: string; lat: number; lng: number }[] = []
    for (let i = 0; i < 60; i++) {
      let name = `${pick(FIRST)} ${pick(LAST)}`
      while (usedNames.has(name)) name = `${pick(FIRST)} ${pick(LAST)}`
      usedNames.add(name)
      const commercial = chance(0.12)
      const customerId = crypto.randomUUID()
      const center = townCenters[i % 2]
      tx.insert(s.customers)
        .values({
          id: customerId,
          name: commercial ? `${name.split(' ')[1]} Properties Ltd.` : name,
          phone: `613-6${Math.floor(rand() * 90 + 10)}-${Math.floor(rand() * 9000 + 1000)}`,
          email: `${name.toLowerCase().replace(/ /g, '.')}@example.com`,
          customerType: commercial ? 'commercial' : 'residential',
          tags: chance(0.3) ? ['recurring'] : [],
          lifetimeValue: Math.round(rand() * 6000 + 400),
        })
        .run()
      const propertyId = crypto.randomUUID()
      const lat = center.lat + (rand() - 0.5) * 0.03
      const lng = center.lng + (rand() - 0.5) * 0.04
      tx.insert(s.properties)
        .values({
          id: propertyId,
          customerId,
          address: `${Math.floor(rand() * 900 + 100)} ${pick(center.streets)}, ${center.town}, ON`,
          lat,
          lng,
          lotSizeSqft: Math.floor(rand() * 9000 + 3000),
          gateCode: chance(0.25) ? `${Math.floor(rand() * 9000 + 1000)}` : null,
          petOnSite: chance(0.3),
          parkingNotes: chance(0.3) ? 'Park on street, driveway must stay clear' : null,
          accessNotes: chance(0.25) ? 'Backyard access on the left side of the house' : null,
          hazards: chance(0.15) ? 'Steep slope at the back — no riding mower' : null,
          routeZone: center.zone,
        })
        .run()
      propertyPool.push({ propertyId, customerId, lat, lng })

      if (chance(0.35)) {
        const tier = pick(['Residential Standard', 'Residential Priority', 'Commercial'] as const)
        tx.insert(s.snowContracts)
          .values({
            customerId,
            propertyId,
            tier,
            seasonPrice: tier === 'Commercial' ? 2400 : tier === 'Residential Priority' ? 780 : 560,
            triggerCm: tier === 'Commercial' ? 2 : chance(0.5) ? 3 : 5,
            slaHours: tier === 'Commercial' ? 4 : tier === 'Residential Priority' ? 8 : 12,
            includedServices: ['Driveway', 'Walkway'],
          })
          .run()
      }
    }

    // ---------------- Jobs: 200 across ±3 weeks ----------------
    const today = new Date()
    const fmtDate = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
    const nonSnowCatalog = catalog.filter((c) => c.division !== 'SnowLand')

    for (let i = 0; i < 200; i++) {
      const svc = pick(nonSnowCatalog)
      const prop = pick(propertyPool)
      const dayOffset = Math.floor(rand() * 42) - 21 // -21 … +20 days
      const date = new Date(today)
      date.setDate(today.getDate() + dayOffset)
      const weekday = date.getDay()
      const isPast = dayOffset < 0
      const unassignedFuture = !isPast && chance(0.22)
      const skipWeekend = weekday === 0 || weekday === 6

      const jobId = crypto.randomUUID()
      const matching = crewIds.filter((_, idx) => crewDefs[idx].division === svc.division)
      const crewId =
        unassignedFuture || skipWeekend || matching.length === 0 ? null : pick(matching)
      const startHour = 8 + Math.floor(rand() * 8)
      const startAt = new Date(date)
      startAt.setHours(startHour, chance(0.5) ? 0 : 30, 0, 0)

      tx.insert(s.jobs)
        .values({
          id: jobId,
          customerId: prop.customerId,
          propertyId: prop.propertyId,
          division: svc.division,
          title: svc.name,
          status: isPast ? (chance(0.9) ? 'Complete' : 'Needs Follow-Up') : crewId ? 'Scheduled' : 'Unscheduled',
          priority: chance(0.08) ? 'High' : chance(0.02) ? 'Emergency' : 'Normal',
          scheduledDate: crewId || isPast ? fmtDate(date) : chance(0.5) ? fmtDate(date) : null,
          scheduledStartAt: crewId || isPast ? startAt.getTime() : null,
          estimatedDurationMinutes: svc.minutes,
          assignedCrewId: crewId,
          quotedAmount: Math.round(svc.price * (0.85 + rand() * 0.4)),
          estimatedCrewHours: svc.minutes / 60,
          weatherDependent: svc.division === 'ClearView' || svc.name.includes('Mowing'),
          source: chance(0.6) ? 'Jobber import' : 'manual',
        })
        .run()
      tx.insert(s.jobLineItems)
        .values({
          jobId,
          serviceCatalogId: svc.id,
          description: svc.name,
          quantity: 1,
          unit: 'per visit',
          price: svc.price,
        })
        .run()
      for (const label of ['Gates closed on exit', 'Debris removed', 'After photo taken']) {
        tx.insert(s.jobChecklistItems).values({ jobId, label, required: label === 'After photo taken' }).run()
      }
    }

    // Default division colors + route zones into settings
    tx.update(s.settings)
      .set({ divisionColors: DEFAULT_DIVISION_COLORS, routeZones: ['Petawawa', 'Pembroke'], updatedAt: Date.now() })
      .where(eq(s.settings.id, 'singleton'))
      .run()
  })
}

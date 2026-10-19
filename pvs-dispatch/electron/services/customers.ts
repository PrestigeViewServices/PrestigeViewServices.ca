import { and, eq, isNull, like, or, inArray } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import type {
  Customer,
  CustomerDetail,
  CustomerWithProperties,
  Property,
  ServiceCatalogItem,
} from '../../shared/types'
import { listJobs } from './jobs'

const now = () => Date.now()

export function listCustomers(db: Db, search?: string): CustomerWithProperties[] {
  const term = search?.trim()
  const customers = db
    .select()
    .from(s.customers)
    .where(
      and(
        isNull(s.customers.archivedAt),
        term ? or(like(s.customers.name, `%${term}%`), like(s.customers.phone, `%${term}%`)) : undefined,
      ),
    )
    .all()
  if (customers.length === 0) return []
  const props = db
    .select()
    .from(s.properties)
    .where(and(inArray(s.properties.customerId, customers.map((c) => c.id)), isNull(s.properties.archivedAt)))
    .all()
  return customers.map((c) => ({ ...c, properties: props.filter((p) => p.customerId === c.id) }))
}

export function getCustomerDetail(db: Db, customerId: string): CustomerDetail {
  const customer = db.select().from(s.customers).where(eq(s.customers.id, customerId)).get()
  if (!customer) throw new Error('Customer not found')
  const props = db
    .select()
    .from(s.properties)
    .where(and(eq(s.properties.customerId, customerId), isNull(s.properties.archivedAt)))
    .all()
  const jobs = listJobs(db, { customerId })
  return { ...customer, properties: props, jobs }
}

export interface CustomerSaveInput {
  id?: string
  name: string
  phone: string | null
  email: string | null
  billingAddress: string | null
  customerType: 'residential' | 'commercial'
  tags: string[]
  notes: string | null
  doNotService: boolean
}

export function saveCustomer(db: Db, input: CustomerSaveInput): Customer {
  const fields = {
    name: input.name,
    phone: input.phone,
    email: input.email,
    billingAddress: input.billingAddress,
    customerType: input.customerType,
    tags: input.tags,
    notes: input.notes,
    doNotService: input.doNotService,
    updatedAt: now(),
  }
  let id = input.id
  if (id) {
    db.update(s.customers).set(fields).where(eq(s.customers.id, id)).run()
  } else {
    id = crypto.randomUUID()
    db.insert(s.customers).values({ id, ...fields }).run()
  }
  return db.select().from(s.customers).where(eq(s.customers.id, id)).get() as Customer
}

export function archiveCustomer(db: Db, id: string) {
  db.update(s.customers).set({ archivedAt: now(), updatedAt: now() }).where(eq(s.customers.id, id)).run()
}

export interface PropertySaveInput {
  id?: string
  customerId: string
  address: string
  lat: number | null
  lng: number | null
  lotSizeSqft: number | null
  gateCode: string | null
  petOnSite: boolean
  parkingNotes: string | null
  accessNotes: string | null
  hazards: string | null
  routeZone: string | null
}

export function saveProperty(db: Db, input: PropertySaveInput): Property {
  const fields = {
    customerId: input.customerId,
    address: input.address,
    lat: input.lat,
    lng: input.lng,
    lotSizeSqft: input.lotSizeSqft,
    gateCode: input.gateCode,
    petOnSite: input.petOnSite,
    parkingNotes: input.parkingNotes,
    accessNotes: input.accessNotes,
    hazards: input.hazards,
    routeZone: input.routeZone,
    updatedAt: now(),
  }
  let id = input.id
  if (id) {
    db.update(s.properties).set(fields).where(eq(s.properties.id, id)).run()
  } else {
    id = crypto.randomUUID()
    db.insert(s.properties).values({ id, ...fields }).run()
  }
  return db.select().from(s.properties).where(eq(s.properties.id, id)).get() as Property
}

export function archiveProperty(db: Db, id: string) {
  db.update(s.properties).set({ archivedAt: now(), updatedAt: now() }).where(eq(s.properties.id, id)).run()
}

// ------------------------------ Service catalog ------------------------------

export function listCatalog(db: Db): ServiceCatalogItem[] {
  return db.select().from(s.serviceCatalog).where(isNull(s.serviceCatalog.archivedAt)).all()
}

export interface CatalogSaveInput {
  id?: string
  name: string
  division: string
  description: string | null
  defaultDurationMinutes: number
  unit: 'per visit' | 'per hour' | 'per sqft' | 'per pane'
  defaultPrice: number
  crewSizeRequired: number
  requiredCertificationLevel: number
  requiredEquipment: string[]
}

export function saveCatalogItem(db: Db, input: CatalogSaveInput) {
  const fields = {
    name: input.name,
    division: input.division,
    description: input.description,
    defaultDurationMinutes: input.defaultDurationMinutes,
    unit: input.unit,
    defaultPrice: input.defaultPrice,
    crewSizeRequired: input.crewSizeRequired,
    requiredCertificationLevel: input.requiredCertificationLevel,
    requiredEquipment: input.requiredEquipment,
    updatedAt: now(),
  }
  if (input.id) {
    db.update(s.serviceCatalog).set(fields).where(eq(s.serviceCatalog.id, input.id)).run()
    return input.id
  }
  const id = crypto.randomUUID()
  db.insert(s.serviceCatalog).values({ id, ...fields }).run()
  return id
}

export function archiveCatalogItem(db: Db, id: string) {
  db.update(s.serviceCatalog)
    .set({ archivedAt: now(), updatedAt: now() })
    .where(eq(s.serviceCatalog.id, id))
    .run()
}

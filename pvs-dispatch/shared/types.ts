import type { InferSelectModel } from 'drizzle-orm'
import type * as s from '../electron/db/schema'

// Row types inferred straight from the Drizzle schema so the renderer and the
// main process can never drift apart.
export type Worker = InferSelectModel<typeof s.workers>
export type Certification = InferSelectModel<typeof s.certifications>
export type Availability = InferSelectModel<typeof s.availability>
export type TimeOff = InferSelectModel<typeof s.timeOff>
export type Crew = InferSelectModel<typeof s.crews>
export type CrewMember = InferSelectModel<typeof s.crewMembers>
export type Vehicle = InferSelectModel<typeof s.vehicles>
export type Equipment = InferSelectModel<typeof s.equipment>
export type Customer = InferSelectModel<typeof s.customers>
export type Property = InferSelectModel<typeof s.properties>
export type ServiceCatalogItem = InferSelectModel<typeof s.serviceCatalog>
export type Job = InferSelectModel<typeof s.jobs>
export type JobLineItem = InferSelectModel<typeof s.jobLineItems>
export type JobChecklistItem = InferSelectModel<typeof s.jobChecklistItems>
export type JobNote = InferSelectModel<typeof s.jobNotes>
export type ActivityLogEntry = InferSelectModel<typeof s.activityLog>
export type Settings = InferSelectModel<typeof s.settings>

export const DIVISIONS = ['LawnPros', 'ClearView', 'SnowLand', 'Junk Removal', 'Hardscape'] as const
export type Division = (typeof DIVISIONS)[number]

export const DEFAULT_DIVISION_COLORS: Record<string, string> = {
  LawnPros: '#16a34a',
  ClearView: '#0ea5e9',
  SnowLand: '#6366f1',
  'Junk Removal': '#f59e0b',
  Hardscape: '#a16207',
}

export const WORKER_ROLES = ['Crew Lead', 'Technician', 'Operator', 'Sales', 'Ops Manager'] as const
export const JOB_STATUSES = [
  'Unscheduled',
  'Scheduled',
  'Dispatched',
  'In Progress',
  'Complete',
  'Needs Follow-Up',
  'Cancelled',
] as const
export const JOB_PRIORITIES = ['Normal', 'High', 'Emergency'] as const

// ------------------------------ Composites ----------------------------------

export interface WorkerDetail extends Worker {
  certifications: Certification[]
  availability: Availability[]
  timeOff: TimeOff[]
  crewNames: string[]
}

export interface CrewWithMembers extends Crew {
  members: (CrewMember & { worker: Worker; certifications: Certification[] })[]
  vehicle: Vehicle | null
}

export interface CustomerWithProperties extends Customer {
  properties: Property[]
}

export interface CustomerDetail extends CustomerWithProperties {
  jobs: JobListItem[]
}

/** A job with everything the schedule board and lists need in one query. */
export interface JobListItem extends Job {
  customerName: string
  customerPhone: string | null
  address: string
  routeZone: string | null
  gateCode: string | null
  petOnSite: boolean
  hazards: string | null
  parkingNotes: string | null
  accessNotes: string | null
  lat: number | null
  lng: number | null
  crewName: string | null
  crewColor: string | null
  lineItems: JobLineItem[]
}

// ------------------------------ IPC payloads --------------------------------

export interface ScheduleJobInput {
  jobId: string
  crewId: string | null
  scheduledDate: string | null // YYYY-MM-DD local
  scheduledStartAt: number | null // epoch ms
  sequenceOrder?: number | null
}

/** Previous values returned by jobs:schedule so the UI can build an undo stack. */
export interface ScheduleJobResult {
  previous: ScheduleJobInput
  warnings: ScheduleWarning[]
}

export interface ScheduleWarning {
  kind:
    | 'certification'
    | 'time_off'
    | 'max_hours'
    | 'equipment'
    | 'no_crew_lead'
    | 'travel'
  message: string
}

export interface DashboardStats {
  date: string
  jobsToday: number
  jobsThisWeek: number
  unassignedJobs: number
  plannedRevenueToday: number
  dailyOverheadBreakEven: number
  plannedCrewHoursToday: number
  availableCrewHoursToday: number
  revenuePerCrewHour: number
  targetRevenuePerCrewHour: number
  needsAttention: { kind: string; message: string; jobId?: string }[]
}

export interface JobCreateInput {
  customerId: string
  propertyId: string
  division: string
  title: string
  priority: (typeof JOB_PRIORITIES)[number]
  scheduledDate: string | null
  scheduledStartAt: number | null
  estimatedDurationMinutes: number
  quotedAmount: number
  weatherDependent: boolean
  description?: string
  internalNotes?: string
  customerFacingNotes?: string
  lineItems: {
    serviceCatalogId: string | null
    description: string
    quantity: number
    unit: string | null
    price: number
  }[]
}

export interface CrewSaveInput {
  id?: string
  name: string
  division: string
  colorHex: string
  defaultVehicleId: string | null
  active: boolean
  members: { workerId: string; isLead: boolean }[]
}

export interface WorkerSaveInput {
  id?: string
  name: string
  phone: string | null
  email: string | null
  role: (typeof WORKER_ROLES)[number]
  divisionAffinities: string[]
  hourlyCost: number
  employmentType: Worker['employmentType']
  hireDate: string | null
  status: Worker['status']
  emergencyContact: string | null
  notes: string | null
  certifications: { division: string; level: number; expiryDate: string | null }[]
}

// The preload-exposed bridge
export interface PvsApi {
  invoke<T = unknown>(channel: string, payload?: unknown): Promise<T>
}

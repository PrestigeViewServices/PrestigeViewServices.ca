import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core'
import { sql } from 'drizzle-orm'

// ---------------------------------------------------------------------------
// Conventions
//  - UUID text primary keys (generated in app code via crypto.randomUUID)
//  - created_at / updated_at / archived_at on every table (soft deletes)
//  - datetimes are integer epoch milliseconds, UTC. Rendering converts to
//    America/Toronto. `*_date` columns are local calendar dates 'YYYY-MM-DD'
//    used for day-level grouping on the schedule board.
//  - array/object columns are JSON-encoded text
// ---------------------------------------------------------------------------

const id = () =>
  text('id')
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID())

const timestamps = {
  createdAt: integer('created_at')
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
  updatedAt: integer('updated_at')
    .notNull()
    .default(sql`(cast(unixepoch('subsec') * 1000 as integer))`),
  archivedAt: integer('archived_at'),
}

// ------------------------------- People ------------------------------------

export const workers = sqliteTable('workers', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  photoPath: text('photo_path'),
  role: text('role', {
    enum: ['Crew Lead', 'Technician', 'Operator', 'Sales', 'Ops Manager'],
  })
    .notNull()
    .default('Technician'),
  divisionAffinities: text('division_affinities', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  hourlyCost: real('hourly_cost').notNull().default(0),
  employmentType: text('employment_type', {
    enum: ['Full-Time', 'Part-Time', 'Seasonal', 'Contractor'],
  })
    .notNull()
    .default('Full-Time'),
  hireDate: text('hire_date'), // YYYY-MM-DD
  status: text('status', { enum: ['Active', 'Inactive'] })
    .notNull()
    .default('Active'),
  emergencyContact: text('emergency_contact'),
  notes: text('notes'),
  ...timestamps,
})

export const certifications = sqliteTable('certifications', {
  id: id(),
  workerId: text('worker_id')
    .notNull()
    .references(() => workers.id),
  division: text('division').notNull(),
  level: integer('level').notNull().default(1), // 1-3
  issuedDate: text('issued_date'),
  expiryDate: text('expiry_date'),
  notes: text('notes'),
  ...timestamps,
})

export const availability = sqliteTable('availability', {
  id: id(),
  workerId: text('worker_id')
    .notNull()
    .references(() => workers.id),
  weekday: integer('weekday').notNull(), // 0 = Sunday … 6 = Saturday
  startTime: text('start_time').notNull(), // 'HH:mm' local
  endTime: text('end_time').notNull(),
  ...timestamps,
})

export const timeOff = sqliteTable('time_off', {
  id: id(),
  workerId: text('worker_id')
    .notNull()
    .references(() => workers.id),
  startAt: integer('start_at').notNull(),
  endAt: integer('end_at').notNull(),
  type: text('type', { enum: ['vacation', 'sick', 'unavailable'] })
    .notNull()
    .default('unavailable'),
  note: text('note'),
  ...timestamps,
})

export const crews = sqliteTable('crews', {
  id: id(),
  name: text('name').notNull(),
  division: text('division').notNull(),
  colorHex: text('color_hex').notNull().default('#3b82f6'),
  defaultVehicleId: text('default_vehicle_id'),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

export const crewMembers = sqliteTable('crew_members', {
  id: id(),
  crewId: text('crew_id')
    .notNull()
    .references(() => crews.id),
  workerId: text('worker_id')
    .notNull()
    .references(() => workers.id),
  isLead: integer('is_lead', { mode: 'boolean' }).notNull().default(false),
  effectiveFrom: text('effective_from'), // YYYY-MM-DD
  effectiveTo: text('effective_to'),
  ...timestamps,
})

// ------------------------------- Assets ------------------------------------

export const vehicles = sqliteTable('vehicles', {
  id: id(),
  name: text('name').notNull(),
  plate: text('plate'),
  type: text('type'),
  capacityNotes: text('capacity_notes'),
  status: text('status', { enum: ['active', 'in shop'] })
    .notNull()
    .default('active'),
  assignedCrewId: text('assigned_crew_id'),
  ...timestamps,
})

export const equipment = sqliteTable('equipment', {
  id: id(),
  name: text('name').notNull(),
  category: text('category'),
  serial: text('serial'),
  status: text('status', { enum: ['active', 'in repair', 'retired'] })
    .notNull()
    .default('active'),
  assignedVehicleId: text('assigned_vehicle_id'),
  lastServiceDate: text('last_service_date'),
  nextServiceDue: text('next_service_due'),
  ...timestamps,
})

export const equipmentCheckouts = sqliteTable('equipment_checkouts', {
  id: id(),
  equipmentId: text('equipment_id')
    .notNull()
    .references(() => equipment.id),
  jobId: text('job_id').notNull(),
  checkedOutAt: integer('checked_out_at').notNull(),
  returnedAt: integer('returned_at'),
  ...timestamps,
})

// -------------------------- Customers and work ------------------------------

export const customers = sqliteTable('customers', {
  id: id(),
  name: text('name').notNull(),
  phone: text('phone'),
  email: text('email'),
  billingAddress: text('billing_address'),
  customerType: text('customer_type', { enum: ['residential', 'commercial'] })
    .notNull()
    .default('residential'),
  tags: text('tags', { mode: 'json' }).$type<string[]>().notNull().default(sql`'[]'`),
  jobberClientId: text('jobber_client_id'),
  lifetimeValue: real('lifetime_value').notNull().default(0),
  notes: text('notes'),
  doNotService: integer('do_not_service', { mode: 'boolean' }).notNull().default(false),
  ...timestamps,
})

export const properties = sqliteTable('properties', {
  id: id(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  address: text('address').notNull(),
  lat: real('lat'),
  lng: real('lng'),
  lotSizeSqft: integer('lot_size_sqft'),
  gateCode: text('gate_code'),
  petOnSite: integer('pet_on_site', { mode: 'boolean' }).notNull().default(false),
  parkingNotes: text('parking_notes'),
  accessNotes: text('access_notes'),
  hazards: text('hazards'),
  propertyPhotos: text('property_photos', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  routeZone: text('route_zone'),
  ...timestamps,
})

export const serviceCatalog = sqliteTable('service_catalog', {
  id: id(),
  name: text('name').notNull(),
  division: text('division').notNull(),
  description: text('description'),
  defaultDurationMinutes: integer('default_duration_minutes').notNull().default(60),
  unit: text('unit', { enum: ['per visit', 'per hour', 'per sqft', 'per pane'] })
    .notNull()
    .default('per visit'),
  defaultPrice: real('default_price').notNull().default(0),
  crewSizeRequired: integer('crew_size_required').notNull().default(2),
  requiredCertificationLevel: integer('required_certification_level').notNull().default(1),
  requiredEquipment: text('required_equipment', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  ...timestamps,
})

export const jobs = sqliteTable('jobs', {
  id: id(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  division: text('division').notNull(),
  title: text('title').notNull(),
  status: text('status', {
    enum: [
      'Unscheduled',
      'Scheduled',
      'Dispatched',
      'In Progress',
      'Complete',
      'Needs Follow-Up',
      'Cancelled',
    ],
  })
    .notNull()
    .default('Unscheduled'),
  priority: text('priority', { enum: ['Normal', 'High', 'Emergency'] })
    .notNull()
    .default('Normal'),
  scheduledDate: text('scheduled_date'), // local 'YYYY-MM-DD'
  scheduledStartAt: integer('scheduled_start_at'), // epoch ms UTC
  estimatedDurationMinutes: integer('estimated_duration_minutes').notNull().default(60),
  assignedCrewId: text('assigned_crew_id').references(() => crews.id),
  sequenceOrder: integer('sequence_order'),
  quotedAmount: real('quoted_amount').notNull().default(0),
  estimatedCrewHours: real('estimated_crew_hours').notNull().default(0),
  recurrenceRule: text('recurrence_rule'), // RRULE string
  parentRecurringJobId: text('parent_recurring_job_id'),
  source: text('source', { enum: ['Jobber import', 'manual', 'AI'] })
    .notNull()
    .default('manual'),
  jobberJobId: text('jobber_job_id'),
  weatherDependent: integer('weather_dependent', { mode: 'boolean' })
    .notNull()
    .default(false),
  description: text('description'),
  internalNotes: text('internal_notes'),
  customerFacingNotes: text('customer_facing_notes'),
  ...timestamps,
})

export const jobLineItems = sqliteTable('job_line_items', {
  id: id(),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  serviceCatalogId: text('service_catalog_id').references(() => serviceCatalog.id),
  description: text('description').notNull(),
  quantity: real('quantity').notNull().default(1),
  unit: text('unit'),
  price: real('price').notNull().default(0),
  ...timestamps,
})

export const jobChecklistItems = sqliteTable('job_checklist_items', {
  id: id(),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  label: text('label').notNull(),
  required: integer('required', { mode: 'boolean' }).notNull().default(false),
  completedByWorkerId: text('completed_by_worker_id'),
  completedAt: integer('completed_at'),
  ...timestamps,
})

export const jobPhotos = sqliteTable('job_photos', {
  id: id(),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  type: text('type', { enum: ['before', 'after', 'issue'] }).notNull(),
  filePath: text('file_path').notNull(),
  caption: text('caption'),
  takenAt: integer('taken_at'),
  ...timestamps,
})

export const jobNotes = sqliteTable('job_notes', {
  id: id(),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  workerId: text('worker_id'),
  body: text('body').notNull(),
  ...timestamps,
})

export const timeEntries = sqliteTable('time_entries', {
  id: id(),
  jobId: text('job_id')
    .notNull()
    .references(() => jobs.id),
  workerId: text('worker_id')
    .notNull()
    .references(() => workers.id),
  startAt: integer('start_at').notNull(),
  endAt: integer('end_at'),
  source: text('source', { enum: ['manual', 'timer'] }).notNull().default('manual'),
  ...timestamps,
})

export const activityLog = sqliteTable('activity_log', {
  id: id(),
  entityType: text('entity_type').notNull(), // 'job' | 'day_plan' | ...
  entityId: text('entity_id').notNull(),
  action: text('action').notNull(),
  detail: text('detail'),
  actor: text('actor').notNull().default('owner'),
  ...timestamps,
})

// ------------------------------- Planning -----------------------------------

export const dayPlans = sqliteTable('day_plans', {
  id: id(),
  date: text('date').notNull(), // YYYY-MM-DD
  crewId: text('crew_id')
    .notNull()
    .references(() => crews.id),
  status: text('status', { enum: ['Draft', 'Approved', 'Dispatched'] })
    .notNull()
    .default('Draft'),
  generatedBy: text('generated_by', { enum: ['human', 'AI'] })
    .notNull()
    .default('human'),
  aiRationale: text('ai_rationale'),
  plannedRevenue: real('planned_revenue').notNull().default(0),
  plannedCrewHours: real('planned_crew_hours').notNull().default(0),
  approvedAt: integer('approved_at'),
  ...timestamps,
})

export const stormEvents = sqliteTable('storm_events', {
  id: id(),
  name: text('name').notNull(),
  startAt: integer('start_at').notNull(),
  classification: text('classification', {
    enum: ['Light', 'Standard', 'Heavy', 'Extreme'],
  })
    .notNull()
    .default('Standard'),
  snowfallCm: real('snowfall_cm').notNull().default(0),
  triggerThresholdCm: real('trigger_threshold_cm').notNull().default(3),
  slaHoursByTier: text('sla_hours_by_tier', { mode: 'json' })
    .$type<Record<string, number>>()
    .notNull()
    .default(sql`'{}'`),
  status: text('status', { enum: ['Forecast', 'Active', 'Closed'] })
    .notNull()
    .default('Forecast'),
  dispatchNotes: text('dispatch_notes'),
  ...timestamps,
})

export const snowContracts = sqliteTable('snow_contracts', {
  id: id(),
  customerId: text('customer_id')
    .notNull()
    .references(() => customers.id),
  propertyId: text('property_id')
    .notNull()
    .references(() => properties.id),
  tier: text('tier').notNull().default('Residential Standard'),
  seasonPrice: real('season_price').notNull().default(0),
  triggerCm: real('trigger_cm').notNull().default(3),
  slaHours: real('sla_hours').notNull().default(12),
  includedServices: text('included_services', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  active: integer('active', { mode: 'boolean' }).notNull().default(true),
  ...timestamps,
})

export const stormServiceRecords = sqliteTable('storm_service_records', {
  id: id(),
  stormEventId: text('storm_event_id')
    .notNull()
    .references(() => stormEvents.id),
  snowContractId: text('snow_contract_id')
    .notNull()
    .references(() => snowContracts.id),
  crewId: text('crew_id'),
  completedAt: integer('completed_at'),
  photoPath: text('photo_path'),
  notes: text('notes'),
  ...timestamps,
})

// ------------------------------- Settings -----------------------------------

// Single-row config table (id is always 'singleton')
export const settings = sqliteTable('settings', {
  id: text('id').primaryKey().default('singleton'),
  companyName: text('company_name').notNull().default('Prestige View Services'),
  companyPhone: text('company_phone'),
  companyEmail: text('company_email'),
  logoPath: text('logo_path'),
  monthlyOverhead: real('monthly_overhead').notNull().default(13088),
  targetRevenuePerCrewHour: real('target_revenue_per_crew_hour').notNull().default(145),
  workingDaysPerMonth: integer('working_days_per_month').notNull().default(22),
  maxCrewHoursPerDay: real('max_crew_hours_per_day').notNull().default(10),
  divisionColors: text('division_colors', { mode: 'json' })
    .$type<Record<string, string>>()
    .notNull()
    .default(sql`'{}'`),
  routeZones: text('route_zones', { mode: 'json' })
    .$type<string[]>()
    .notNull()
    .default(sql`'[]'`),
  // API keys are stored encrypted via Electron safeStorage (base64 ciphertext)
  anthropicApiKeyEncrypted: text('anthropic_api_key_encrypted'),
  travelProvider: text('travel_provider', {
    enum: ['haversine', 'google', 'mapbox'],
  })
    .notNull()
    .default('haversine'),
  travelApiKeyEncrypted: text('travel_api_key_encrypted'),
  cloudShareEnabled: integer('cloud_share_enabled', { mode: 'boolean' })
    .notNull()
    .default(false),
  cloudShareCredentialsEncrypted: text('cloud_share_credentials_encrypted'),
  backupFolder: text('backup_folder'),
  ...timestamps,
})

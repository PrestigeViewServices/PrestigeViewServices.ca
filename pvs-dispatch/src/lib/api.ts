import type {
  CrewSaveInput,
  CrewWithMembers,
  CustomerDetail,
  CustomerWithProperties,
  DashboardStats,
  JobCreateInput,
  JobListItem,
  PvsApi,
  ScheduleJobInput,
  ScheduleJobResult,
  ScheduleWarning,
  ServiceCatalogItem,
  TimeOff,
  Vehicle,
  Worker,
  WorkerDetail,
  WorkerSaveInput,
} from '@shared/types'
import type { PublicSettings, SettingsUpdateInput } from '../../electron/services/settings'
import type { CatalogSaveInput, CustomerSaveInput, PropertySaveInput } from '../../electron/services/customers'
import type { JobListFilter } from '../../electron/services/jobs'
import type { JobDetailExtras } from '../../electron/services/jobdetail'
import type { PrintExportInput } from '../../electron/print'
import type {
  ApproveCrewPlanInput,
  AssembleOptions,
  Plan,
  PlannerChatMessage,
  PlannerContext,
} from '../../electron/services/planner'
import type { StormCreateInput, StormDispatch, StormEvent, StormSummary } from '../../electron/services/snow'

declare global {
  interface Window {
    pvs: PvsApi
  }
}

const invoke = <T>(channel: string, payload?: unknown): Promise<T> =>
  window.pvs.invoke<T>(`pvs:${channel}`, payload)

export const api = {
  workers: {
    list: () => invoke<Worker[]>('workers:list'),
    get: (id: string) => invoke<WorkerDetail>('workers:get', id),
    save: (input: WorkerSaveInput) => invoke<Worker>('workers:save', input),
    archive: (id: string) => invoke<void>('workers:archive', id),
  },
  timeOff: {
    list: (workerId?: string) => invoke<TimeOff[]>('timeoff:list', workerId),
    create: (input: { workerId: string; startAt: number; endAt: number; type: 'vacation' | 'sick' | 'unavailable'; note?: string }) =>
      invoke<void>('timeoff:create', input),
    delete: (id: string) => invoke<void>('timeoff:delete', id),
  },
  crews: {
    list: () => invoke<CrewWithMembers[]>('crews:list'),
    save: (input: CrewSaveInput) => invoke<string>('crews:save', input),
    archive: (id: string) => invoke<void>('crews:archive', id),
  },
  vehicles: {
    list: () => invoke<Vehicle[]>('vehicles:list'),
    save: (input: { id?: string; name: string; plate: string | null; type: string | null; status: 'active' | 'in shop' }) =>
      invoke<string>('vehicles:save', input),
  },
  customers: {
    list: (search?: string) => invoke<CustomerWithProperties[]>('customers:list', search),
    get: (id: string) => invoke<CustomerDetail>('customers:get', id),
    save: (input: CustomerSaveInput) => invoke<CustomerWithProperties>('customers:save', input),
    archive: (id: string) => invoke<void>('customers:archive', id),
  },
  properties: {
    save: (input: PropertySaveInput) => invoke<void>('properties:save', input),
    archive: (id: string) => invoke<void>('properties:archive', id),
  },
  catalog: {
    list: () => invoke<ServiceCatalogItem[]>('catalog:list'),
    save: (input: CatalogSaveInput) => invoke<string>('catalog:save', input),
    archive: (id: string) => invoke<void>('catalog:archive', id),
  },
  jobs: {
    list: (filter: JobListFilter = {}) => invoke<JobListItem[]>('jobs:list', filter),
    create: (input: JobCreateInput) => invoke<string>('jobs:create', input),
    update: (input: { id: string } & Record<string, unknown>) => invoke<void>('jobs:update', input),
    archive: (id: string) => invoke<void>('jobs:archive', id),
    schedule: (input: ScheduleJobInput) => invoke<ScheduleJobResult>('jobs:schedule', input),
    validate: (input: ScheduleJobInput) => invoke<ScheduleWarning[]>('jobs:validate', input),
  },
  jobExtras: {
    get: (jobId: string) => invoke<JobDetailExtras>('jobs:extras', jobId),
    toggleChecklist: (itemId: string) => invoke<void>('checklist:toggle', itemId),
    addChecklist: (input: { jobId: string; label: string; required: boolean }) =>
      invoke<void>('checklist:add', input),
    removeChecklist: (itemId: string) => invoke<void>('checklist:remove', itemId),
    addNote: (input: { jobId: string; body: string }) => invoke<void>('notes:add', input),
    addPhotos: (input: { jobId: string; type: 'before' | 'after' | 'issue' }) =>
      invoke<number>('photos:add', input),
    removePhoto: (photoId: string) => invoke<void>('photos:remove', photoId),
  },
  print: {
    export: (input: PrintExportInput) => invoke<string | null>('print:export', input),
  },
  planner: {
    build: (input: AssembleOptions) => invoke<{ plan: Plan; context: PlannerContext }>('planner:build', input),
    chat: (input: { options: AssembleOptions; plan: Plan | null; messages: PlannerChatMessage[] }) =>
      invoke<{ reply: string; plan?: Plan }>('planner:chat', input),
    apply: (input: { date: string; approved: ApproveCrewPlanInput[] }) => invoke<void>('planner:apply', input),
  },
  snow: {
    storms: () => invoke<StormEvent[]>('snow:storms'),
    create: (input: StormCreateInput) => invoke<string>('snow:create', input),
    updateSnowfall: (input: { stormId: string; snowfallCm: number }) => invoke<void>('snow:updateSnowfall', input),
    setStatus: (input: { stormId: string; status: 'Forecast' | 'Active' | 'Closed' }) =>
      invoke<void>('snow:setStatus', input),
    dispatch: (stormId: string) => invoke<StormDispatch>('snow:dispatch', stormId),
    assignZone: (input: { stormId: string; routeZone: string; crewId: string | null }) =>
      invoke<number>('snow:assignZone', input),
    complete: (input: { stormId: string; contractId: string; notes?: string }) => invoke<void>('snow:complete', input),
    summary: (stormId: string) => invoke<StormSummary>('snow:summary', stormId),
  },
  dashboard: {
    stats: (date: string) => invoke<DashboardStats>('dashboard:stats', date),
  },
  settings: {
    get: () => invoke<PublicSettings>('settings:get'),
    update: (input: SettingsUpdateInput) => invoke<PublicSettings>('settings:update', input),
    setApiKey: (which: 'anthropic' | 'travel', value: string) =>
      invoke<void>('settings:setApiKey', { which, value }),
    backupNow: () => invoke<string>('settings:backupNow'),
    paths: () => invoke<{ dbFile: string; backupDir: string }>('settings:paths'),
  },
  seed: {
    isEmpty: () => invoke<boolean>('seed:isEmpty'),
    demo: () => invoke<void>('seed:demo'),
  },
}

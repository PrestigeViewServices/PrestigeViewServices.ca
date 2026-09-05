import { dialog, ipcMain, safeStorage } from 'electron'
import { getDb, backupNow, getDbFilePath, getBackupDir } from '../db'
import * as jobdetail from '../services/jobdetail'
import * as planner from '../services/planner'
import { exportPrintView, type PrintExportInput } from '../print'
import Anthropic from '@anthropic-ai/sdk'
import * as people from '../services/people'
import * as customersSvc from '../services/customers'
import * as jobsSvc from '../services/jobs'
import * as settingsSvc from '../services/settings'
import { isDatabaseEmpty, seedDemoData } from '../services/seed'

/**
 * Register one handler. Errors are converted to plain messages so the renderer
 * shows something human-readable instead of a stack trace.
 */
function handle<TIn, TOut>(channel: string, fn: (payload: TIn) => TOut | Promise<TOut>) {
  ipcMain.handle(`pvs:${channel}`, async (_event, payload: TIn) => {
    try {
      return await fn(payload)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Something went wrong'
      console.error(`[ipc pvs:${channel}]`, err)
      throw new Error(message)
    }
  })
}

export function registerIpcHandlers() {
  const db = () => getDb()

  // Workers
  handle('workers:list', () => people.listWorkers(db()))
  handle('workers:get', (id: string) => people.getWorkerDetail(db(), id))
  handle('workers:save', (input: Parameters<typeof people.saveWorker>[1]) => people.saveWorker(db(), input))
  handle('workers:archive', (id: string) => people.archiveWorker(db(), id))
  handle('timeoff:list', (workerId?: string) => people.listTimeOff(db(), workerId))
  handle('timeoff:create', (input: Parameters<typeof people.createTimeOff>[1]) =>
    people.createTimeOff(db(), input),
  )
  handle('timeoff:delete', (id: string) => people.deleteTimeOff(db(), id))

  // Crews & vehicles
  handle('crews:list', () => people.listCrews(db()))
  handle('crews:save', (input: Parameters<typeof people.saveCrew>[1]) => people.saveCrew(db(), input))
  handle('crews:archive', (id: string) => people.archiveCrew(db(), id))
  handle('vehicles:list', () => people.listVehicles(db()))
  handle('vehicles:save', (input: Parameters<typeof people.saveVehicle>[1]) => people.saveVehicle(db(), input))

  // Customers & properties
  handle('customers:list', (search?: string) => customersSvc.listCustomers(db(), search))
  handle('customers:get', (id: string) => customersSvc.getCustomerDetail(db(), id))
  handle('customers:save', (input: customersSvc.CustomerSaveInput) => customersSvc.saveCustomer(db(), input))
  handle('customers:archive', (id: string) => customersSvc.archiveCustomer(db(), id))
  handle('properties:save', (input: customersSvc.PropertySaveInput) => customersSvc.saveProperty(db(), input))
  handle('properties:archive', (id: string) => customersSvc.archiveProperty(db(), id))

  // Service catalog
  handle('catalog:list', () => customersSvc.listCatalog(db()))
  handle('catalog:save', (input: customersSvc.CatalogSaveInput) => customersSvc.saveCatalogItem(db(), input))
  handle('catalog:archive', (id: string) => customersSvc.archiveCatalogItem(db(), id))

  // Jobs & scheduling
  handle('jobs:list', (filter: jobsSvc.JobListFilter) => jobsSvc.listJobs(db(), filter ?? {}))
  handle('jobs:create', (input: Parameters<typeof jobsSvc.createJob>[1]) => jobsSvc.createJob(db(), input))
  handle('jobs:update', (input: Parameters<typeof jobsSvc.updateJob>[1]) => jobsSvc.updateJob(db(), input))
  handle('jobs:archive', (id: string) => jobsSvc.archiveJob(db(), id))
  handle('jobs:schedule', (input: Parameters<typeof jobsSvc.scheduleJob>[1]) =>
    jobsSvc.scheduleJob(db(), input),
  )
  handle('jobs:validate', (input: Parameters<typeof jobsSvc.validateAssignment>[1]) =>
    jobsSvc.validateAssignment(db(), input),
  )

  // Job detail extras: checklist, photos, notes, activity
  handle('jobs:extras', (jobId: string) => jobdetail.getJobDetailExtras(db(), jobId))
  handle('checklist:toggle', (itemId: string) => jobdetail.toggleChecklistItem(db(), itemId))
  handle('checklist:add', (input: { jobId: string; label: string; required: boolean }) =>
    jobdetail.addChecklistItem(db(), input),
  )
  handle('checklist:remove', (itemId: string) => jobdetail.removeChecklistItem(db(), itemId))
  handle('notes:add', (input: { jobId: string; body: string }) => jobdetail.addJobNote(db(), input))
  handle('photos:add', async (input: { jobId: string; type: 'before' | 'after' | 'issue' }) => {
    const { canceled, filePaths } = await dialog.showOpenDialog({
      title: 'Add photos',
      properties: ['openFile', 'multiSelections'],
      filters: [{ name: 'Images', extensions: ['jpg', 'jpeg', 'png', 'webp', 'heic'] }],
    })
    if (canceled || filePaths.length === 0) return 0
    return jobdetail.addJobPhotos(db(), { ...input, sourcePaths: filePaths })
  })
  handle('photos:remove', (photoId: string) => jobdetail.removeJobPhoto(db(), photoId))

  // Print / export
  handle('print:export', (input: PrintExportInput) => exportPrintView(input))

  // AI planner — the model call happens here in the main process; the plan is
  // only written to the database via planner:apply after human approval.
  const PLANNER_MODEL = 'claude-sonnet-4-6'
  const callAnthropicModel: planner.ModelCaller = async (system, userContent) => {
    const ciphertext = settingsSvc.getEncryptedKey(db(), 'anthropic')
    if (!ciphertext) {
      throw new Error('No Anthropic API key configured — add one under Settings → API keys')
    }
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure key storage is not available, cannot decrypt the API key')
    }
    const apiKey = safeStorage.decryptString(Buffer.from(ciphertext, 'base64'))
    const client = new Anthropic({ apiKey, timeout: 120_000, maxRetries: 1 })
    const response = await client.messages.create({
      model: PLANNER_MODEL,
      max_tokens: 16000,
      system,
      messages: [{ role: 'user', content: userContent }],
    })
    return response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('')
  }

  handle('planner:build', async (input: planner.AssembleOptions) => {
    const context = planner.assemblePlannerContext(db(), input)
    if (context.crews.length === 0) throw new Error('No active crews match the selected divisions')
    if (context.jobs.length === 0) throw new Error('No jobs to plan for that date')
    const plan = await planner.buildPlan(context, callAnthropicModel)
    return { plan, context }
  })
  handle(
    'planner:chat',
    async (input: {
      options: planner.AssembleOptions
      plan: planner.Plan | null
      messages: planner.PlannerChatMessage[]
    }) => {
      const context = planner.assemblePlannerContext(db(), input.options)
      return planner.plannerChat(context, input.plan, input.messages, callAnthropicModel)
    },
  )
  handle('planner:apply', (input: { date: string; approved: planner.ApproveCrewPlanInput[] }) =>
    planner.applyPlan(db(), input.date, input.approved),
  )

  // Dashboard
  handle('dashboard:stats', (date: string) => jobsSvc.dashboardStats(db(), date))

  // Settings
  handle('settings:get', () => settingsSvc.getSettings(db()))
  handle('settings:update', (input: settingsSvc.SettingsUpdateInput) =>
    settingsSvc.updateSettings(db(), input),
  )
  handle('settings:setApiKey', (input: { which: 'anthropic' | 'travel'; value: string }) => {
    if (!input.value) {
      settingsSvc.storeEncryptedKey(db(), input.which, null)
      return
    }
    if (!safeStorage.isEncryptionAvailable()) {
      throw new Error('Secure key storage is not available on this machine')
    }
    const ciphertext = safeStorage.encryptString(input.value).toString('base64')
    settingsSvc.storeEncryptedKey(db(), input.which, ciphertext)
  })
  handle('settings:backupNow', async () => backupNow('manual'))
  handle('settings:paths', () => ({ dbFile: getDbFilePath(), backupDir: getBackupDir() }))
  handle('seed:isEmpty', () => isDatabaseEmpty(db()))
  handle('seed:demo', () => {
    if (!isDatabaseEmpty(db())) throw new Error('Demo data can only be loaded into an empty database')
    seedDemoData(db())
  })
}

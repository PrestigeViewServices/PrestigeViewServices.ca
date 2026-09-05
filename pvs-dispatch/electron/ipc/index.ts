import { ipcMain, safeStorage } from 'electron'
import { getDb, backupNow, getDbFilePath, getBackupDir } from '../db'
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

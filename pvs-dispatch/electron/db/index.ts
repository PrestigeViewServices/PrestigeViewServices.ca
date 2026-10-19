import Database from 'better-sqlite3'
import { drizzle, type BetterSQLite3Database } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import fs from 'node:fs'
import * as schema from './schema'

export type Db = BetterSQLite3Database<typeof schema>

let sqlite: Database.Database | null = null
let db: Db | null = null
let dbFilePath = ''
let backupDir = ''

const BACKUP_RETENTION_DAYS = 30

export function getDb(): Db {
  if (!db) throw new Error('Database not initialized')
  return db
}

export function getDbFilePath(): string {
  return dbFilePath
}

export function getBackupDir(): string {
  return backupDir
}

/**
 * Copy the SQLite file into the backups folder using the online backup API
 * (safe while the db is open). Returns the backup file path.
 */
export async function backupNow(label = 'manual'): Promise<string> {
  if (!sqlite) throw new Error('Database not initialized')
  fs.mkdirSync(backupDir, { recursive: true })
  const stamp = new Date().toISOString().replace(/[:.]/g, '-')
  const dest = path.join(backupDir, `pvs-dispatch-${label}-${stamp}.sqlite`)
  await sqlite.backup(dest)
  pruneBackups()
  return dest
}

function pruneBackups() {
  const cutoff = Date.now() - BACKUP_RETENTION_DAYS * 24 * 60 * 60 * 1000
  for (const f of fs.readdirSync(backupDir)) {
    const full = path.join(backupDir, f)
    try {
      if (fs.statSync(full).mtimeMs < cutoff) fs.unlinkSync(full)
    } catch {
      // a file vanishing mid-prune is fine
    }
  }
}

/** Backup once a night. Checks hourly so laptops that sleep still catch up. */
export function scheduleNightlyBackup() {
  let lastBackupDay = ''
  const tick = async () => {
    const today = new Date().toISOString().slice(0, 10)
    if (today !== lastBackupDay) {
      try {
        await backupNow('nightly')
        lastBackupDay = today
      } catch (err) {
        console.error('Nightly backup failed', err)
      }
    }
  }
  void tick()
  setInterval(() => void tick(), 60 * 60 * 1000)
}

export function initDb(userDataDir: string, migrationsFolder: string) {
  const dataDir = path.join(userDataDir, 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  backupDir = path.join(userDataDir, 'backups')
  fs.mkdirSync(backupDir, { recursive: true })
  dbFilePath = path.join(dataDir, 'pvs-dispatch.sqlite')

  const existedBefore = fs.existsSync(dbFilePath)

  sqlite = new Database(dbFilePath)
  sqlite.pragma('journal_mode = WAL')
  sqlite.pragma('foreign_keys = ON')

  // Snapshot before any schema migration touches an existing database
  if (existedBefore) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-')
    fs.copyFileSync(dbFilePath, path.join(backupDir, `pvs-dispatch-premigrate-${stamp}.sqlite`))
  }

  db = drizzle(sqlite, { schema })
  migrate(db, { migrationsFolder })

  // Ensure the singleton settings row exists
  const existing = sqlite.prepare(`SELECT id FROM settings WHERE id = 'singleton'`).get()
  if (!existing) {
    sqlite.prepare(`INSERT INTO settings (id) VALUES ('singleton')`).run()
  }

  return db
}

export function closeDb() {
  sqlite?.close()
  sqlite = null
  db = null
}

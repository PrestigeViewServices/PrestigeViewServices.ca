/**
 * CLI seeding for development: creates/migrates a SQLite file and fills it
 * with the PVS demo dataset. Usage: npm run db:seed [-- path/to/db.sqlite]
 */
import Database from 'better-sqlite3'
import { drizzle } from 'drizzle-orm/better-sqlite3'
import { migrate } from 'drizzle-orm/better-sqlite3/migrator'
import path from 'node:path'
import fs from 'node:fs'
import * as schema from '../electron/db/schema'
import { seedDemoData, isDatabaseEmpty } from '../electron/services/seed'

const target = process.argv[2] ?? path.join(__dirname, '..', 'dev-data', 'pvs-dispatch.sqlite')
fs.mkdirSync(path.dirname(target), { recursive: true })

const sqlite = new Database(target)
sqlite.pragma('journal_mode = WAL')
sqlite.pragma('foreign_keys = ON')
const db = drizzle(sqlite, { schema })
migrate(db, { migrationsFolder: path.join(__dirname, '..', 'drizzle') })
sqlite.prepare(`INSERT OR IGNORE INTO settings (id) VALUES ('singleton')`).run()

if (!isDatabaseEmpty(db)) {
  console.error(`Refusing to seed: ${target} already has data`)
  process.exit(1)
}
seedDemoData(db)

const count = (t: string) => (sqlite.prepare(`SELECT count(*) c FROM ${t}`).get() as { c: number }).c
console.log(`Seeded ${target}`)
for (const t of ['workers', 'crews', 'customers', 'properties', 'jobs', 'snow_contracts', 'service_catalog']) {
  console.log(`  ${t}: ${count(t)}`)
}

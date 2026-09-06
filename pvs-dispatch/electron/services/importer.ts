import { z } from 'zod'
import { and, eq, isNull } from 'drizzle-orm'
import fs from 'node:fs'
import type { Db } from '../db'
import * as s from '../db/schema'

// ---------------------------------------------------------------------------
// Small quote-aware CSV parser (Jobber exports are plain RFC-4180 CSV)
// ---------------------------------------------------------------------------

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []
  let row: string[] = []
  let field = ''
  let inQuotes = false
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"'
          i++
        } else {
          inQuotes = false
        }
      } else {
        field += ch
      }
    } else if (ch === '"') {
      inQuotes = true
    } else if (ch === ',') {
      row.push(field)
      field = ''
    } else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++
      row.push(field)
      field = ''
      if (row.length > 1 || row[0] !== '') rows.push(row)
      row = []
    } else {
      field += ch
    }
  }
  if (field !== '' || row.length > 0) {
    row.push(field)
    if (row.length > 1 || row[0] !== '') rows.push(row)
  }
  return rows
}

export interface CsvPreview {
  filePath: string
  headers: string[]
  rowCount: number
  preview: string[][]
}

export function previewCsv(filePath: string): CsvPreview {
  const text = fs.readFileSync(filePath, 'utf8')
  const rows = parseCsv(text)
  if (rows.length < 2) throw new Error('The CSV needs a header row and at least one data row')
  return { filePath, headers: rows[0], rowCount: rows.length - 1, preview: rows.slice(1, 6) }
}

// ---------------------------------------------------------------------------
// Customer + property import with column mapping
// ---------------------------------------------------------------------------

/** Renderer maps our fields to CSV header names (null = not in this file). */
export interface ImportMapping {
  name: string
  phone: string | null
  email: string | null
  billingAddress: string | null
  propertyAddress: string | null
  customerType: string | null
  jobberClientId: string | null
  routeZone: string | null
  notes: string | null
}

const rowSchema = z.object({
  name: z.string().trim().min(1, 'name is required'),
  phone: z.string().trim().optional(),
  email: z.union([z.literal(''), z.string().trim().email('invalid email')]).optional(),
  billingAddress: z.string().trim().optional(),
  propertyAddress: z.string().trim().optional(),
  customerType: z.string().trim().optional(),
  jobberClientId: z.string().trim().optional(),
  routeZone: z.string().trim().optional(),
  notes: z.string().trim().optional(),
})

export interface ImportResult {
  created: number
  updated: number
  skipped: number
  propertiesCreated: number
  errors: { line: number; message: string }[]
}

export function importCustomersCsv(
  db: Db,
  input: { filePath: string; mapping: ImportMapping; updateExisting: boolean },
): ImportResult {
  const text = fs.readFileSync(input.filePath, 'utf8')
  const rows = parseCsv(text)
  const headers = rows[0]
  const idx = (header: string | null) => (header ? headers.indexOf(header) : -1)
  const cols = {
    name: idx(input.mapping.name),
    phone: idx(input.mapping.phone),
    email: idx(input.mapping.email),
    billingAddress: idx(input.mapping.billingAddress),
    propertyAddress: idx(input.mapping.propertyAddress),
    customerType: idx(input.mapping.customerType),
    jobberClientId: idx(input.mapping.jobberClientId),
    routeZone: idx(input.mapping.routeZone),
    notes: idx(input.mapping.notes),
  }
  if (cols.name === -1) throw new Error('The Name column mapping is required')

  const result: ImportResult = { created: 0, updated: 0, skipped: 0, propertiesCreated: 0, errors: [] }

  db.transaction((tx) => {
    const existing = tx.select().from(s.customers).where(isNull(s.customers.archivedAt)).all()
    const byJobberId = new Map(existing.filter((c) => c.jobberClientId).map((c) => [c.jobberClientId!, c]))
    const byNamePhone = new Map(existing.map((c) => [`${c.name.toLowerCase()}|${c.phone ?? ''}`, c]))

    for (let i = 1; i < rows.length; i++) {
      const raw = rows[i]
      const get = (col: number) => (col >= 0 ? (raw[col] ?? '') : '')
      const parsed = rowSchema.safeParse({
        name: get(cols.name),
        phone: get(cols.phone),
        email: get(cols.email),
        billingAddress: get(cols.billingAddress),
        propertyAddress: get(cols.propertyAddress),
        customerType: get(cols.customerType),
        jobberClientId: get(cols.jobberClientId),
        routeZone: get(cols.routeZone),
        notes: get(cols.notes),
      })
      if (!parsed.success) {
        result.errors.push({ line: i + 1, message: parsed.error.issues.map((x) => x.message).join('; ') })
        continue
      }
      const row = parsed.data
      const customerType = /comm/i.test(row.customerType ?? '') ? 'commercial' : 'residential'

      let customer =
        (row.jobberClientId && byJobberId.get(row.jobberClientId)) ||
        byNamePhone.get(`${row.name.toLowerCase()}|${row.phone ?? ''}`)

      if (customer) {
        if (!input.updateExisting) {
          result.skipped++
        } else {
          tx.update(s.customers)
            .set({
              phone: row.phone || customer.phone,
              email: row.email || customer.email,
              billingAddress: row.billingAddress || customer.billingAddress,
              customerType,
              jobberClientId: row.jobberClientId || customer.jobberClientId,
              notes: row.notes || customer.notes,
              updatedAt: Date.now(),
            })
            .where(eq(s.customers.id, customer.id))
            .run()
          result.updated++
        }
      } else {
        const id = crypto.randomUUID()
        tx.insert(s.customers)
          .values({
            id,
            name: row.name,
            phone: row.phone || null,
            email: row.email || null,
            billingAddress: row.billingAddress || null,
            customerType,
            jobberClientId: row.jobberClientId || null,
            notes: row.notes || null,
          })
          .run()
        customer = tx.select().from(s.customers).where(eq(s.customers.id, id)).get()!
        byNamePhone.set(`${row.name.toLowerCase()}|${row.phone ?? ''}`, customer)
        if (row.jobberClientId) byJobberId.set(row.jobberClientId, customer)
        result.created++
      }

      const address = row.propertyAddress || row.billingAddress
      if (customer && address) {
        const existingProp = tx
          .select()
          .from(s.properties)
          .where(and(eq(s.properties.customerId, customer.id), isNull(s.properties.archivedAt)))
          .all()
          .find((p) => p.address.toLowerCase() === address.toLowerCase())
        if (!existingProp) {
          tx.insert(s.properties)
            .values({ customerId: customer.id, address, routeZone: row.routeZone || null })
            .run()
          result.propertiesCreated++
        }
      }
    }
  })

  return result
}

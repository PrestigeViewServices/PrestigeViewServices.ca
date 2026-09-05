import { eq } from 'drizzle-orm'
import type { Db } from '../db'
import * as s from '../db/schema'
import type { Settings } from '../../shared/types'

/** Settings as sent to the renderer: ciphertext never leaves the main process. */
export type PublicSettings = Omit<
  Settings,
  'anthropicApiKeyEncrypted' | 'travelApiKeyEncrypted' | 'cloudShareCredentialsEncrypted'
> & {
  hasAnthropicKey: boolean
  hasTravelKey: boolean
}

export function getSettings(db: Db): PublicSettings {
  const row = db.select().from(s.settings).where(eq(s.settings.id, 'singleton')).get()
  if (!row) throw new Error('Settings row missing')
  const { anthropicApiKeyEncrypted, travelApiKeyEncrypted, cloudShareCredentialsEncrypted, ...rest } = row
  void cloudShareCredentialsEncrypted
  return {
    ...rest,
    hasAnthropicKey: !!anthropicApiKeyEncrypted,
    hasTravelKey: !!travelApiKeyEncrypted,
  }
}

export interface SettingsUpdateInput {
  companyName?: string
  companyPhone?: string | null
  companyEmail?: string | null
  monthlyOverhead?: number
  targetRevenuePerCrewHour?: number
  workingDaysPerMonth?: number
  maxCrewHoursPerDay?: number
  divisionColors?: Record<string, string>
  routeZones?: string[]
  travelProvider?: 'haversine' | 'google' | 'mapbox'
}

export function updateSettings(db: Db, input: SettingsUpdateInput): PublicSettings {
  db.update(s.settings)
    .set({ ...input, updatedAt: Date.now() })
    .where(eq(s.settings.id, 'singleton'))
    .run()
  return getSettings(db)
}

/** Store already-encrypted API key ciphertext (base64). Empty string clears. */
export function storeEncryptedKey(
  db: Db,
  which: 'anthropic' | 'travel',
  ciphertextBase64: string | null,
) {
  const col =
    which === 'anthropic'
      ? { anthropicApiKeyEncrypted: ciphertextBase64 }
      : { travelApiKeyEncrypted: ciphertextBase64 }
  db.update(s.settings)
    .set({ ...col, updatedAt: Date.now() })
    .where(eq(s.settings.id, 'singleton'))
    .run()
}

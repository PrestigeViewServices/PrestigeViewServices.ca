import { estimateDriveMinutes } from './jobs'

export interface TravelPoint {
  id: string
  lat: number
  lng: number
}

/**
 * TravelProvider contract: a full drive-minutes matrix between points.
 * The haversine estimator is the zero-config default; Google Distance Matrix
 * and Mapbox Matrix upgrade to real drive times when a key is configured.
 * Every provider falls back to haversine per element on failure — the app
 * must keep working offline.
 */
export interface TravelProvider {
  name: string
  matrix(points: TravelPoint[]): Promise<Record<string, Record<string, number>>>
}

function haversineMatrix(points: TravelPoint[]): Record<string, Record<string, number>> {
  const out: Record<string, Record<string, number>> = {}
  for (const a of points) {
    out[a.id] = {}
    for (const b of points) {
      if (a.id === b.id) continue
      out[a.id][b.id] = estimateDriveMinutes(a.lat, a.lng, b.lat, b.lng)
    }
  }
  return out
}

export const haversineProvider: TravelProvider = {
  name: 'haversine',
  matrix: async (points) => haversineMatrix(points),
}

/** Google Distance Matrix, chunked to stay under the 100-elements-per-request cap. */
export function googleProvider(apiKey: string): TravelProvider {
  return {
    name: 'google',
    async matrix(points) {
      const out = haversineMatrix(points) // pre-fill: any API failure keeps an estimate
      const CHUNK = 10 // 10x10 = 100 elements
      for (let oi = 0; oi < points.length; oi += CHUNK) {
        const origins = points.slice(oi, oi + CHUNK)
        for (let di = 0; di < points.length; di += CHUNK) {
          const dests = points.slice(di, di + CHUNK)
          try {
            const url = new URL('https://maps.googleapis.com/maps/api/distancematrix/json')
            url.searchParams.set('origins', origins.map((p) => `${p.lat},${p.lng}`).join('|'))
            url.searchParams.set('destinations', dests.map((p) => `${p.lat},${p.lng}`).join('|'))
            url.searchParams.set('key', apiKey)
            const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
            if (!res.ok) continue
            const data = (await res.json()) as {
              rows?: { elements?: { status: string; duration?: { value: number } }[] }[]
            }
            data.rows?.forEach((row, r) => {
              row.elements?.forEach((el, c) => {
                if (el.status === 'OK' && el.duration && origins[r].id !== dests[c].id) {
                  out[origins[r].id][dests[c].id] = Math.round(el.duration.value / 60)
                }
              })
            })
          } catch {
            // keep haversine estimates for this chunk
          }
        }
      }
      return out
    },
  }
}

/** Mapbox Matrix API — up to 25 coordinates in one call; beyond that, haversine. */
export function mapboxProvider(apiKey: string): TravelProvider {
  return {
    name: 'mapbox',
    async matrix(points) {
      const out = haversineMatrix(points)
      if (points.length < 2 || points.length > 25) return out
      try {
        const coords = points.map((p) => `${p.lng},${p.lat}`).join(';')
        const url = new URL(`https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${coords}`)
        url.searchParams.set('annotations', 'duration')
        url.searchParams.set('access_token', apiKey)
        const res = await fetch(url, { signal: AbortSignal.timeout(15_000) })
        if (!res.ok) return out
        const data = (await res.json()) as { durations?: (number | null)[][] }
        data.durations?.forEach((row, r) => {
          row.forEach((seconds, c) => {
            if (seconds != null && r !== c) out[points[r].id][points[c].id] = Math.round(seconds / 60)
          })
        })
      } catch {
        // offline or bad key — estimates stand
      }
      return out
    },
  }
}

export function selectProvider(
  which: 'haversine' | 'google' | 'mapbox',
  apiKey: string | null,
): TravelProvider {
  if (which === 'google' && apiKey) return googleProvider(apiKey)
  if (which === 'mapbox' && apiKey) return mapboxProvider(apiKey)
  return haversineProvider
}

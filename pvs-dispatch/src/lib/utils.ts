import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'
import { format } from 'date-fns'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export const money = (n: number) =>
  n.toLocaleString('en-CA', { style: 'currency', currency: 'CAD', maximumFractionDigits: 0 })

export const hours = (n: number) => `${n.toFixed(1)}h`

export const timeOf = (epochMs: number) => format(new Date(epochMs), 'h:mm a')

export const todayStr = () => format(new Date(), 'yyyy-MM-dd')

/** 'YYYY-MM-DD' -> Date at local noon (avoids DST/day-boundary drift) */
export const dateFromStr = (d: string) => new Date(`${d}T12:00:00`)

export const shortAddress = (address: string) => address.split(',')[0]

export function minutesLabel(min: number) {
  if (min < 60) return `${min}m`
  const h = Math.floor(min / 60)
  const m = min % 60
  return m ? `${h}h ${m}m` : `${h}h`
}

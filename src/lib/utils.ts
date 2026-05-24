import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatWeight(weightKg: number | null, units: 'kg' | 'lbs'): string {
  if (weightKg == null) return '—'
  if (units === 'lbs') return `${Math.round(weightKg * 2.20462 * 10) / 10}`
  return `${weightKg}`
}

export function toKg(value: number, units: 'kg' | 'lbs'): number {
  return units === 'lbs' ? Math.round((value / 2.20462) * 100) / 100 : value
}

export function fromKg(value: number, units: 'kg' | 'lbs'): number {
  return units === 'lbs' ? Math.round(value * 2.20462 * 10) / 10 : value
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  return `${hours}h ${mins % 60}m`
}

export function workoutDurationSecs(startedAt: string, finishedAt: string | null): number {
  const start = new Date(startedAt).getTime()
  const end = finishedAt ? new Date(finishedAt).getTime() : Date.now()
  return Math.max(0, Math.floor((end - start) / 1000))
}

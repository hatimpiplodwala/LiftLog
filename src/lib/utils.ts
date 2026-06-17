import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Pulls a user-facing message off a thrown value, falling back when it isn't an Error.
export function errMessage(err: unknown, fallback: string): string {
  return err instanceof Error ? err.message : fallback
}

export function formatWeight(weightKg: number | null, units: 'kg' | 'lbs'): string {
  if (weightKg == null) return '—'
  const value = units === 'lbs' ? Math.round(weightKg * 2.20462 * 10) / 10 : weightKg
  // Group thousands so large volume totals read as "12,480" not "12480".
  return value.toLocaleString('en-US')
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

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { computeStreak } from './streak'

// Tests run with TZ=UTC (see vitest.config.ts), so 'Z' timestamps and the
// system clock share one timezone — no DST or offset drift.
const NOW = '2024-01-15T12:00:00.000Z' // "today" = 2024-01-15
const at = (day: string, time = 'T12:00:00.000Z') => `2024-01-${day}${time}`

describe('computeStreak', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date(NOW))
  })
  afterEach(() => vi.useRealTimers())

  it('is zero with no workouts', () => {
    expect(computeStreak([])).toBe(0)
  })

  it('counts a single workout today', () => {
    expect(computeStreak([at('15')])).toBe(1)
  })

  it('counts consecutive days up to today', () => {
    expect(computeStreak([at('15'), at('14'), at('13')])).toBe(3)
  })

  it('does not depend on input order', () => {
    expect(computeStreak([at('13'), at('15'), at('14')])).toBe(3)
  })

  it('collapses multiple workouts on the same day into one', () => {
    expect(computeStreak([at('15', 'T08:00:00.000Z'), at('15', 'T19:00:00.000Z')])).toBe(1)
  })

  it('keeps the streak alive when today has no workout yet (grace day)', () => {
    // Worked out yesterday + the day before, nothing today -> still 2.
    expect(computeStreak([at('14'), at('13')])).toBe(2)
  })

  it('breaks once yesterday is also missed', () => {
    // Latest workout is two days ago: neither today nor yesterday -> 0.
    expect(computeStreak([at('13'), at('12')])).toBe(0)
  })

  it('stops at the first gap', () => {
    // Today and two-days-ago, but yesterday missing -> only today counts.
    expect(computeStreak([at('15'), at('13')])).toBe(1)
  })

  it('uses local date keys, so a late-night workout counts for its own day', () => {
    // 23:30 on the 14th + the 13th, with nothing today -> grace keeps it at 2.
    expect(computeStreak([at('14', 'T23:30:00.000Z'), at('13')])).toBe(2)
  })
})

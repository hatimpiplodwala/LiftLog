import { afterEach, describe, expect, it, vi } from 'vitest'
import { cn, formatDuration, formatWeight, fromKg, toKg, workoutDurationSecs } from './utils'

describe('cn', () => {
  it('joins truthy class names', () => {
    expect(cn('a', 'b')).toBe('a b')
  })

  it('drops falsy values', () => {
    expect(cn('a', false, undefined, null, 'b')).toBe('a b')
  })

  it('dedupes conflicting tailwind classes, keeping the last', () => {
    expect(cn('px-2', 'px-4')).toBe('px-4')
  })
})

describe('formatWeight', () => {
  it('renders an em dash for null', () => {
    expect(formatWeight(null, 'kg')).toBe('—')
  })

  it('passes kg through unchanged', () => {
    expect(formatWeight(100, 'kg')).toBe('100')
    expect(formatWeight(62.5, 'kg')).toBe('62.5')
  })

  it('keeps zero (zero is a real weight, not "missing")', () => {
    expect(formatWeight(0, 'kg')).toBe('0')
  })

  it('converts kg to lbs rounded to one decimal', () => {
    // 100 kg * 2.20462 = 220.462 -> 220.5
    expect(formatWeight(100, 'lbs')).toBe('220.5')
  })
})

describe('toKg / fromKg', () => {
  it('is a no-op for kg', () => {
    expect(toKg(80, 'kg')).toBe(80)
    expect(fromKg(80, 'kg')).toBe(80)
  })

  it('converts lbs input to kg (2 decimals)', () => {
    expect(toKg(220, 'lbs')).toBe(99.79)
  })

  it('converts kg to lbs for display (1 decimal)', () => {
    expect(fromKg(100, 'lbs')).toBe(220.5)
  })

  it('round-trips lbs within rounding tolerance', () => {
    const lbs = 185
    expect(fromKg(toKg(lbs, 'lbs'), 'lbs')).toBeCloseTo(lbs, 0)
  })
})

describe('formatDuration', () => {
  it('shows seconds under a minute', () => {
    expect(formatDuration(0)).toBe('0s')
    expect(formatDuration(45)).toBe('45s')
    expect(formatDuration(59)).toBe('59s')
  })

  it('shows whole minutes under an hour', () => {
    expect(formatDuration(60)).toBe('1m')
    expect(formatDuration(90)).toBe('1m')
    expect(formatDuration(3599)).toBe('59m')
  })

  it('shows hours and remainder minutes from an hour up', () => {
    expect(formatDuration(3600)).toBe('1h 0m')
    expect(formatDuration(3661)).toBe('1h 1m')
    expect(formatDuration(7320)).toBe('2h 2m')
  })
})

describe('workoutDurationSecs', () => {
  afterEach(() => vi.restoreAllMocks())

  it('computes elapsed seconds between two timestamps', () => {
    expect(
      workoutDurationSecs('2024-01-01T00:00:00.000Z', '2024-01-01T00:01:40.000Z'),
    ).toBe(100)
  })

  it('never returns negative when finished precedes start', () => {
    expect(
      workoutDurationSecs('2024-01-01T00:05:00.000Z', '2024-01-01T00:00:00.000Z'),
    ).toBe(0)
  })

  it('measures against now when not yet finished', () => {
    vi.spyOn(Date, 'now').mockReturnValue(
      new Date('2024-01-01T00:00:30.000Z').getTime(),
    )
    expect(workoutDurationSecs('2024-01-01T00:00:00.000Z', null)).toBe(30)
  })
})

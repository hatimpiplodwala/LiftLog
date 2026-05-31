import { describe, expect, it } from 'vitest'
import { isSetPR, type ExercisePR } from './useExercises'

const pr = (over: Partial<ExercisePR> = {}): ExercisePR => ({
  maxWeightKg: 0,
  maxReps: 0,
  maxDurationSecs: 0,
  ...over,
})

const set = (over: Partial<{ reps: number | null; weight_kg: number | null; duration_secs: number | null }> = {}) => ({
  reps: null,
  weight_kg: null,
  duration_secs: null,
  ...over,
})

describe('isSetPR', () => {
  it('is never a PR without an existing PR baseline', () => {
    expect(isSetPR(set({ weight_kg: 200 }), undefined, 'strength')).toBe(false)
  })

  describe('strength (compares weight)', () => {
    it('ties the record (>=) and beats it', () => {
      expect(isSetPR(set({ weight_kg: 100 }), pr({ maxWeightKg: 100 }), 'strength')).toBe(true)
      expect(isSetPR(set({ weight_kg: 110 }), pr({ maxWeightKg: 100 }), 'strength')).toBe(true)
    })

    it('is not a PR below the record', () => {
      expect(isSetPR(set({ weight_kg: 80 }), pr({ maxWeightKg: 100 }), 'strength')).toBe(false)
    })

    it('needs a logged weight and a non-zero baseline', () => {
      expect(isSetPR(set({ weight_kg: null }), pr({ maxWeightKg: 100 }), 'strength')).toBe(false)
      expect(isSetPR(set({ weight_kg: 50 }), pr({ maxWeightKg: 0 }), 'strength')).toBe(false)
    })

    it('ignores reps/duration for strength', () => {
      expect(isSetPR(set({ weight_kg: 50, reps: 100 }), pr({ maxWeightKg: 100, maxReps: 1 }), 'strength')).toBe(false)
    })
  })

  describe('bodyweight (compares reps)', () => {
    it('ties and beats the rep record', () => {
      expect(isSetPR(set({ reps: 10 }), pr({ maxReps: 10 }), 'bodyweight')).toBe(true)
      expect(isSetPR(set({ reps: 15 }), pr({ maxReps: 10 }), 'bodyweight')).toBe(true)
    })

    it('is not a PR below, with null reps, or a zero baseline', () => {
      expect(isSetPR(set({ reps: 8 }), pr({ maxReps: 10 }), 'bodyweight')).toBe(false)
      expect(isSetPR(set({ reps: null }), pr({ maxReps: 10 }), 'bodyweight')).toBe(false)
      expect(isSetPR(set({ reps: 5 }), pr({ maxReps: 0 }), 'bodyweight')).toBe(false)
    })
  })

  describe('cardio (compares duration)', () => {
    it('ties and beats the duration record', () => {
      expect(isSetPR(set({ duration_secs: 300 }), pr({ maxDurationSecs: 300 }), 'cardio')).toBe(true)
      expect(isSetPR(set({ duration_secs: 420 }), pr({ maxDurationSecs: 300 }), 'cardio')).toBe(true)
    })

    it('is not a PR below, with null duration, or a zero baseline', () => {
      expect(isSetPR(set({ duration_secs: 200 }), pr({ maxDurationSecs: 300 }), 'cardio')).toBe(false)
      expect(isSetPR(set({ duration_secs: null }), pr({ maxDurationSecs: 300 }), 'cardio')).toBe(false)
      expect(isSetPR(set({ duration_secs: 120 }), pr({ maxDurationSecs: 0 }), 'cardio')).toBe(false)
    })
  })
})

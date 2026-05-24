import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Exercise, Category, ExerciseType } from '@/types/database.types'

export function useExercises() {
  return useQuery({
    queryKey: ['exercises'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('exercises')
        .select('*')
        .order('name')
      if (error) throw error
      return data as Exercise[]
    },
  })
}

interface CreateExerciseArgs {
  name: string
  category: Category
  type: ExerciseType
}

export function useCreateExercise() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: CreateExerciseArgs) => {
      const { data, error } = await supabase
        .from('exercises')
        .insert({ ...args, created_by: user!.id })
        .select()
        .single()
      if (error) throw error
      return data as Exercise
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('exercises').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useLastSetForExercise(exerciseId: string | null) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user && !!exerciseId,
    queryKey: ['last-set', exerciseId, user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, duration_secs, workouts!inner(user_id, finished_at)')
        .eq('exercise_id', exerciseId!)
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .order('completed_at', { ascending: false })
        .limit(1)
        .maybeSingle()
      if (error) throw error
      return data as { reps: number | null; weight_kg: number | null; duration_secs: number | null } | null
    },
  })
}

export interface ExercisePR {
  maxWeightKg: number
  maxReps: number
  maxDurationSecs: number
}

export function useExercisePR(exerciseId: string | null) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user && !!exerciseId,
    queryKey: ['exercise-pr', exerciseId, user?.id],
    queryFn: async (): Promise<ExercisePR> => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, duration_secs, workouts!inner(user_id)')
        .eq('exercise_id', exerciseId!)
        .eq('workouts.user_id', user!.id)
      if (error) throw error
      const rows = (data ?? []) as {
        reps: number | null
        weight_kg: number | null
        duration_secs: number | null
      }[]
      let maxWeightKg = 0
      let maxReps = 0
      let maxDurationSecs = 0
      for (const r of rows) {
        if (r.weight_kg != null && r.weight_kg > maxWeightKg) maxWeightKg = r.weight_kg
        if (r.reps != null && r.reps > maxReps) maxReps = r.reps
        if (r.duration_secs != null && r.duration_secs > maxDurationSecs) {
          maxDurationSecs = r.duration_secs
        }
      }
      return { maxWeightKg, maxReps, maxDurationSecs }
    },
  })
}

export interface PrevSessionSet {
  reps: number | null
  weight_kg: number | null
  duration_secs: number | null
  set_number: number
}

export function usePreviousSessionSets(
  exerciseId: string | null,
  excludeWorkoutId: string | null,
) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user && !!exerciseId,
    queryKey: ['prev-session-sets', exerciseId, excludeWorkoutId, user?.id],
    queryFn: async (): Promise<PrevSessionSet[]> => {
      let q = supabase
        .from('workout_sets')
        .select(
          'reps, weight_kg, duration_secs, set_number, workout_id, completed_at, workouts!inner(user_id, finished_at, started_at)',
        )
        .eq('exercise_id', exerciseId!)
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .order('started_at', { foreignTable: 'workouts', ascending: false })
        .order('set_number', { ascending: true })
        .limit(200)
      if (excludeWorkoutId) q = q.neq('workout_id', excludeWorkoutId)
      const { data, error } = await q
      if (error) throw error
      const rows = (data ?? []) as {
        reps: number | null
        weight_kg: number | null
        duration_secs: number | null
        set_number: number
        workout_id: string
      }[]
      if (rows.length === 0) return []
      const mostRecentWorkoutId = rows[0].workout_id
      return rows
        .filter((r) => r.workout_id === mostRecentWorkoutId)
        .map((r) => ({
          reps: r.reps,
          weight_kg: r.weight_kg,
          duration_secs: r.duration_secs,
          set_number: r.set_number,
        }))
        .sort((a, b) => a.set_number - b.set_number)
    },
  })
}

export function isSetPR(
  set: { reps: number | null; weight_kg: number | null; duration_secs: number | null },
  pr: ExercisePR | undefined,
  exerciseType: 'strength' | 'cardio' | 'bodyweight',
): boolean {
  if (!pr) return false
  if (exerciseType === 'cardio') {
    return set.duration_secs != null && pr.maxDurationSecs > 0 && set.duration_secs >= pr.maxDurationSecs
  }
  if (exerciseType === 'bodyweight') {
    return set.reps != null && pr.maxReps > 0 && set.reps >= pr.maxReps
  }
  return set.weight_kg != null && pr.maxWeightKg > 0 && set.weight_kg >= pr.maxWeightKg
}

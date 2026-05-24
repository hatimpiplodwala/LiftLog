import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Exercise, Category, ExerciseType } from '@/types/database.types'

export function useExercises() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['exercises', user?.id],
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

// Single query for all exercise PRs; useExercisePR() selects from this Map so N consumers share one fetch.
export function useAllExercisePRs() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['exercise-prs', user?.id],
    queryFn: async (): Promise<Map<string, ExercisePR>> => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('exercise_id, reps, weight_kg, duration_secs, workouts!inner(user_id)')
        .eq('workouts.user_id', user!.id)
      if (error) throw error
      const rows = (data ?? []) as {
        exercise_id: string
        reps: number | null
        weight_kg: number | null
        duration_secs: number | null
      }[]
      const map = new Map<string, ExercisePR>()
      for (const r of rows) {
        const cur = map.get(r.exercise_id) ?? {
          maxWeightKg: 0,
          maxReps: 0,
          maxDurationSecs: 0,
        }
        if (r.weight_kg != null && r.weight_kg > cur.maxWeightKg) cur.maxWeightKg = r.weight_kg
        if (r.reps != null && r.reps > cur.maxReps) cur.maxReps = r.reps
        if (r.duration_secs != null && r.duration_secs > cur.maxDurationSecs) {
          cur.maxDurationSecs = r.duration_secs
        }
        map.set(r.exercise_id, cur)
      }
      return map
    },
  })
}

export function useExercisePR(exerciseId: string | null): { data: ExercisePR | undefined } {
  const { data: prs } = useAllExercisePRs()
  return { data: exerciseId ? prs?.get(exerciseId) : undefined }
}

export interface PrevSessionSet {
  reps: number | null
  weight_kg: number | null
  duration_secs: number | null
  set_number: number
}

// Two-step: locate previous workout_id (limit 1), then fetch only its sets — avoids a 200-row over-fetch.
export function usePreviousSessionSets(
  exerciseId: string | null,
  excludeWorkoutId: string | null,
) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user && !!exerciseId,
    queryKey: ['prev-session-sets', exerciseId, excludeWorkoutId, user?.id],
    queryFn: async (): Promise<PrevSessionSet[]> => {
      let head = supabase
        .from('workout_sets')
        .select('workout_id, workouts!inner(user_id, finished_at, started_at)')
        .eq('exercise_id', exerciseId!)
        .eq('workouts.user_id', user!.id)
        .not('workouts.finished_at', 'is', null)
        .order('started_at', { foreignTable: 'workouts', ascending: false })
        .limit(1)
      if (excludeWorkoutId) head = head.neq('workout_id', excludeWorkoutId)
      const { data: headRows, error: headErr } = await head
      if (headErr) throw headErr
      const prevId = (headRows ?? [])[0]?.workout_id as string | undefined
      if (!prevId) return []

      const { data, error } = await supabase
        .from('workout_sets')
        .select('reps, weight_kg, duration_secs, set_number')
        .eq('exercise_id', exerciseId!)
        .eq('workout_id', prevId)
        .order('set_number', { ascending: true })
      if (error) throw error
      return (data ?? []) as PrevSessionSet[]
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

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Exercise, Category, ExerciseType } from '@/types/database.types'

export function useExercises() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['exercises', user?.id],
    queryFn: async () =>
      unwrap<Exercise[]>(supabase.from('exercises').select('*').order('name')),
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
    mutationFn: async (args: CreateExerciseArgs) =>
      unwrap<Exercise>(
        supabase.from('exercises').insert({ ...args, created_by: user!.id }).select().single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export function useDeleteExercise() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(supabase.from('exercises').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['exercises'] }),
  })
}

export interface LastSet {
  reps: number | null
  weight_kg: number | null
  duration_secs: number | null
}

// Batched: the most recent finished-workout set for each exercise, in one round
// trip. Keyed on the sorted id list so reordering exercises doesn't refetch.
export function useLastSets(exerciseIds: string[]) {
  const { user } = useAuth()
  const ids = [...exerciseIds].sort()
  return useQuery({
    enabled: !!user && ids.length > 0,
    queryKey: ['last-sets', user?.id, ids],
    queryFn: async (): Promise<Map<string, LastSet>> => {
      const rows = await unwrap<(LastSet & { exercise_id: string; weight_kg: number | string | null })[]>(
        supabase.rpc('get_last_sets', { exercise_ids: ids }),
      )
      return new Map(
        rows.map((r) => [
          r.exercise_id,
          { reps: r.reps, weight_kg: r.weight_kg == null ? null : Number(r.weight_kg), duration_secs: r.duration_secs },
        ]),
      )
    },
  })
}

export interface ExercisePR {
  maxWeightKg: number
  maxReps: number
  maxDurationSecs: number
}

// Single query for all exercise PRs; useExercisePR() selects from this Map so N consumers share one fetch.
// Aggregated server-side (get_exercise_prs RPC, RLS-scoped to the caller's sets)
// so we transfer one row per exercise instead of the full set history.
export function useAllExercisePRs() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['exercise-prs', user?.id],
    queryFn: async (): Promise<Map<string, ExercisePR>> => {
      // numeric/int can arrive as strings from PostgREST; coerce so callers compare numbers.
      const rows = await unwrap<
        {
          exercise_id: string
          max_weight_kg: number | string
          max_reps: number | string
          max_duration_secs: number | string
        }[]
      >(supabase.rpc('get_exercise_prs'))
      const map = new Map<string, ExercisePR>()
      for (const r of rows) {
        map.set(r.exercise_id, {
          maxWeightKg: Number(r.max_weight_kg),
          maxReps: Number(r.max_reps),
          maxDurationSecs: Number(r.max_duration_secs),
        })
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

// Batched: each exercise's sets from its most recent prior finished workout,
// computed server-side (get_previous_session_sets RPC) in one round trip.
export function usePreviousSessionSets(exerciseIds: string[], excludeWorkoutId: string | null) {
  const { user } = useAuth()
  const ids = [...exerciseIds].sort()
  return useQuery({
    enabled: !!user && ids.length > 0,
    queryKey: ['prev-session-sets', user?.id, ids, excludeWorkoutId],
    queryFn: async (): Promise<Map<string, PrevSessionSet[]>> => {
      const rows = await unwrap<(PrevSessionSet & { exercise_id: string; weight_kg: number | string | null })[]>(
        supabase.rpc('get_previous_session_sets', {
          exercise_ids: ids,
          exclude_workout_id: excludeWorkoutId,
        }),
      )
      // Rows arrive ordered by (exercise_id, set_number), so per-exercise order is preserved.
      const map = new Map<string, PrevSessionSet[]>()
      for (const r of rows) {
        const arr = map.get(r.exercise_id) ?? []
        arr.push({
          reps: r.reps,
          weight_kg: r.weight_kg == null ? null : Number(r.weight_kg),
          duration_secs: r.duration_secs,
          set_number: r.set_number,
        })
        map.set(r.exercise_id, arr)
      }
      return map
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

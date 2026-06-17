import { useQuery, useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import { supabase, unwrap } from '@/lib/supabase'
import { groupSetsByExercise } from '@/lib/workout'
import { useAuth } from '@/contexts/AuthContext'
import type { Workout, WorkoutSet } from '@/types/database.types'

// Every set mutation touches the same derived caches; keep the list in one place.
// Note: the last-set / previous-session caches only reflect *finished* workouts,
// so logging in the in-progress session can't change them — no need to refetch.
function invalidateSetCaches(qc: QueryClient, vars: { workout_id: string }) {
  qc.invalidateQueries({ queryKey: ['workout-sets', vars.workout_id] })
  qc.invalidateQueries({ queryKey: ['exercise-prs'] })
}

export function useWorkouts(opts?: { limit?: number; finishedOnly?: boolean }) {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['workouts', user?.id, opts],
    queryFn: async () => {
      let q = supabase
        .from('workouts')
        .select('*')
        .eq('user_id', user!.id)
        .order('started_at', { ascending: false })
      if (opts?.finishedOnly) q = q.not('finished_at', 'is', null)
      if (opts?.limit) q = q.limit(opts.limit)
      return unwrap<Workout[]>(q)
    },
  })
}

// Timestamps only — keeps Dashboard streak + heatmap from pulling full workout rows.
export function useFinishedAts() {
  const { user } = useAuth()
  const since = subMonths(new Date(), 12)
  const sinceKey = format(since, 'yyyy-MM-dd')
  return useQuery({
    enabled: !!user,
    queryKey: ['finished-ats', user?.id, sinceKey],
    queryFn: async () => {
      const rows = await unwrap<{ finished_at: string }[]>(
        supabase
          .from('workouts')
          .select('finished_at')
          .eq('user_id', user!.id)
          .not('finished_at', 'is', null)
          .gte('finished_at', since.toISOString())
          .order('finished_at', { ascending: false }),
      )
      return rows.map((r) => r.finished_at)
    },
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['workout', id],
    queryFn: async () =>
      unwrap<Workout>(supabase.from('workouts').select('*').eq('id', id!).single()),
  })
}

export function useWorkoutExerciseOrder(workoutId: string | undefined) {
  return useQuery({
    enabled: !!workoutId,
    queryKey: ['workout-exercise-order', workoutId],
    queryFn: async () => {
      const rows = await unwrap<{ exercise_id: string }[]>(
        supabase
          .from('workout_sets')
          .select('exercise_id, set_number, completed_at')
          .eq('workout_id', workoutId!)
          .order('completed_at', { ascending: true }),
      )
      return groupSetsByExercise(rows).map((g) => g.exerciseId)
    },
  })
}

export function useWorkoutSets(workoutId: string | undefined) {
  return useQuery({
    enabled: !!workoutId,
    queryKey: ['workout-sets', workoutId],
    queryFn: async () =>
      unwrap<WorkoutSet[]>(
        supabase.from('workout_sets').select('*').eq('workout_id', workoutId!).order('completed_at'),
      ),
  })
}

export function useCreateWorkout() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { name: string }) =>
      unwrap<Workout>(
        supabase.from('workouts').insert({ user_id: user!.id, name: args.name }).select().single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useUpdateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; updates: Partial<Workout> }) =>
      unwrap<Workout>(
        supabase.from('workouts').update(args.updates).eq('id', args.id).select().single(),
      ),
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workouts'] })
      qc.invalidateQueries({ queryKey: ['workout', vars.id] })
    },
  })
}

export function useDeleteWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(supabase.from('workouts').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useInsertSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      workout_id: string
      exercise_id: string
      set_number: number
      reps: number | null
      weight_kg: number | null
      duration_secs: number | null
    }) => unwrap<WorkoutSet>(supabase.from('workout_sets').insert(args).select().single()),
    onSuccess: (_data, vars) => invalidateSetCaches(qc, vars),
  })
}

export function useUpdateSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: {
      id: string
      updates: Partial<WorkoutSet>
      workout_id: string
      exercise_id: string
    }) => {
      await unwrap(supabase.from('workout_sets').update(args.updates).eq('id', args.id))
    },
    onSuccess: (_data, vars) => invalidateSetCaches(qc, vars),
  })
}

export function useDeleteSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; workout_id: string; exercise_id: string }) => {
      await unwrap(supabase.from('workout_sets').delete().eq('id', args.id))
    },
    onSuccess: (_data, vars) => invalidateSetCaches(qc, vars),
  })
}

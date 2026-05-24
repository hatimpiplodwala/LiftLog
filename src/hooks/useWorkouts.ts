import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Workout, WorkoutSet } from '@/types/database.types'

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
      const { data, error } = await q
      if (error) throw error
      return data as Workout[]
    },
  })
}

export function useWorkout(id: string | undefined) {
  return useQuery({
    enabled: !!id,
    queryKey: ['workout', id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('id', id!)
        .single()
      if (error) throw error
      return data as Workout
    },
  })
}

export function useWorkoutByShareToken(token: string | undefined) {
  return useQuery({
    enabled: !!token,
    queryKey: ['workout-share', token],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workouts')
        .select('*')
        .eq('share_token', token!)
        .single()
      if (error) throw error
      return data as Workout
    },
  })
}

export function useWorkoutExerciseOrder(workoutId: string | undefined) {
  return useQuery({
    enabled: !!workoutId,
    queryKey: ['workout-exercise-order', workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('exercise_id, set_number, completed_at')
        .eq('workout_id', workoutId!)
        .order('completed_at', { ascending: true })
      if (error) throw error
      const seen = new Set<string>()
      const order: string[] = []
      for (const row of (data ?? []) as { exercise_id: string }[]) {
        if (!seen.has(row.exercise_id)) {
          seen.add(row.exercise_id)
          order.push(row.exercise_id)
        }
      }
      return order
    },
  })
}

export function useWorkoutSets(workoutId: string | undefined) {
  return useQuery({
    enabled: !!workoutId,
    queryKey: ['workout-sets', workoutId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_sets')
        .select('*')
        .eq('workout_id', workoutId!)
        .order('completed_at')
      if (error) throw error
      return data as WorkoutSet[]
    },
  })
}

export function useCreateWorkout() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { name: string }) => {
      const { data, error } = await supabase
        .from('workouts')
        .insert({ user_id: user!.id, name: args.name })
        .select()
        .single()
      if (error) throw error
      return data as Workout
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['workouts'] }),
  })
}

export function useUpdateWorkout() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; updates: Partial<Workout> }) => {
      const { data, error } = await supabase
        .from('workouts')
        .update(args.updates)
        .eq('id', args.id)
        .select()
        .single()
      if (error) throw error
      return data as Workout
    },
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
      const { error } = await supabase.from('workouts').delete().eq('id', id)
      if (error) throw error
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
    }) => {
      const { data, error } = await supabase
        .from('workout_sets')
        .insert(args)
        .select()
        .single()
      if (error) throw error
      return data as WorkoutSet
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workout-sets', vars.workout_id] })
      qc.invalidateQueries({ queryKey: ['exercise-pr', vars.exercise_id] })
      qc.invalidateQueries({ queryKey: ['last-set', vars.exercise_id] })
      qc.invalidateQueries({ queryKey: ['prev-session-sets', vars.exercise_id] })
    },
  })
}

export function useUpdateSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; updates: Partial<WorkoutSet>; workout_id: string }) => {
      const { error } = await supabase
        .from('workout_sets')
        .update(args.updates)
        .eq('id', args.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workout-sets', vars.workout_id] })
      qc.invalidateQueries({ queryKey: ['exercise-pr'] })
      qc.invalidateQueries({ queryKey: ['last-set'] })
    },
  })
}

export function useDeleteSet() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { id: string; workout_id: string }) => {
      const { error } = await supabase.from('workout_sets').delete().eq('id', args.id)
      if (error) throw error
    },
    onSuccess: (_data, vars) => {
      qc.invalidateQueries({ queryKey: ['workout-sets', vars.workout_id] })
      qc.invalidateQueries({ queryKey: ['exercise-pr'] })
      qc.invalidateQueries({ queryKey: ['last-set'] })
    },
  })
}

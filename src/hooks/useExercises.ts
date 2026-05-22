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

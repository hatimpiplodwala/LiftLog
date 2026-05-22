import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { WorkoutTemplate, TemplateExercise } from '@/types/database.types'

export function useTemplates() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['templates', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workout_templates')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data as WorkoutTemplate[]
    },
  })
}

export function useTemplateExercises(templateId: string | undefined) {
  return useQuery({
    enabled: !!templateId,
    queryKey: ['template-exercises', templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('template_exercises')
        .select('*')
        .eq('template_id', templateId!)
        .order('sort_order')
      if (error) throw error
      return data as TemplateExercise[]
    },
  })
}

export function useCreateTemplate() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { name: string; exerciseIds: string[] }) => {
      const { data: tpl, error: e1 } = await supabase
        .from('workout_templates')
        .insert({ user_id: user!.id, name: args.name })
        .select()
        .single()
      if (e1) throw e1
      if (args.exerciseIds.length > 0) {
        const rows = args.exerciseIds.map((exercise_id, i) => ({
          template_id: tpl.id,
          exercise_id,
          sort_order: i,
        }))
        const { error: e2 } = await supabase.from('template_exercises').insert(rows)
        if (e2) throw e2
      }
      return tpl as WorkoutTemplate
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('workout_templates').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

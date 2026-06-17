import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { WorkoutTemplate, TemplateExercise } from '@/types/database.types'

export function useTemplates() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['templates', user?.id],
    queryFn: async () =>
      unwrap<WorkoutTemplate[]>(
        supabase
          .from('workout_templates')
          .select('*')
          .eq('user_id', user!.id)
          .order('created_at', { ascending: false }),
      ),
  })
}

export function useTemplateExercises(templateId: string | undefined) {
  return useQuery({
    enabled: !!templateId,
    queryKey: ['template-exercises', templateId],
    queryFn: async () =>
      unwrap<TemplateExercise[]>(
        supabase
          .from('template_exercises')
          .select('*')
          .eq('template_id', templateId!)
          .order('sort_order'),
      ),
  })
}

export function useCreateTemplate() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { name: string; exerciseIds: string[] }) => {
      const tpl = await unwrap<WorkoutTemplate>(
        supabase.from('workout_templates').insert({ user_id: user!.id, name: args.name }).select().single(),
      )
      if (args.exerciseIds.length > 0) {
        const rows = args.exerciseIds.map((exercise_id, i) => ({
          template_id: tpl.id,
          exercise_id,
          sort_order: i,
        }))
        await unwrap(supabase.from('template_exercises').insert(rows))
      }
      return tpl
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

export function useDeleteTemplate() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      await unwrap(supabase.from('workout_templates').delete().eq('id', id))
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['templates'] }),
  })
}

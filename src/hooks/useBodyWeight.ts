import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BodyWeightLog } from '@/types/database.types'

export function useBodyWeights() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['body-weights', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('logged_at', { ascending: false })
      if (error) throw error
      return data as BodyWeightLog[]
    },
  })
}

export function useInsertBodyWeight() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { weight_kg: number; logged_at?: string }) => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .insert({ user_id: user!.id, weight_kg: args.weight_kg, logged_at: args.logged_at })
        .select()
        .single()
      if (error) throw error
      return data as BodyWeightLog
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-weights'] }),
  })
}

export function useDeleteBodyWeight() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('body_weight_logs').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['body-weights'] }),
  })
}

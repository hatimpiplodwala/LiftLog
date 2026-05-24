import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format, subMonths } from 'date-fns'
import { supabase } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { BodyWeightLog } from '@/types/database.types'

export function useBodyWeights() {
  const { user } = useAuth()
  // Bound the window so the query is constant-time as users accumulate years
  // of entries. 12 months covers every consumer (Profile shows latest + recent
  // 5; Progress chart's "change since start" is naturally bounded too).
  const since = subMonths(new Date(), 12)
  const sinceKey = format(since, 'yyyy-MM-dd')
  return useQuery({
    enabled: !!user,
    queryKey: ['body-weights', user?.id, sinceKey],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('logged_at', since.toISOString())
        .order('logged_at', { ascending: false })
        .limit(500)
      if (error) throw error
      return data as BodyWeightLog[]
    },
  })
}

export function useInsertBodyWeight() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (args: { weight_kg: number }) => {
      const { data, error } = await supabase
        .from('body_weight_logs')
        .insert({ user_id: user!.id, weight_kg: args.weight_kg })
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

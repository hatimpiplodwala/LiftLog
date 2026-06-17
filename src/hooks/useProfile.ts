import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase, unwrap } from '@/lib/supabase'
import { useAuth } from '@/contexts/AuthContext'
import type { Profile } from '@/types/database.types'

export function useProfile() {
  const { user } = useAuth()
  return useQuery({
    enabled: !!user,
    queryKey: ['profile', user?.id],
    queryFn: async () =>
      unwrap<Profile>(supabase.from('profiles').select('*').eq('id', user!.id).single()),
  })
}

export function useUpdateProfile() {
  const { user } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (updates: Partial<Profile>) =>
      unwrap<Profile>(
        supabase.from('profiles').update(updates).eq('id', user!.id).select().single(),
      ),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['profile'] }),
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useOutfitLogs() {
  const { session } = useAuth()
  const userId = session?.user?.id
  return useQuery({
    queryKey: ['outfit_logs', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('outfit_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50)
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useAddOutfitLog() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ occasion, weather, itemIds }) => {
      const { data, error } = await supabase
        .from('outfit_logs')
        .insert({ user_id: session.user.id, occasion, weather, item_ids: itemIds })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outfit_logs', session.user.id] }),
  })
}

export function useUpdateOutfitLog() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, worn_at, rating, comment }) => {
      const { data, error } = await supabase
        .from('outfit_logs')
        .update({ worn_at, rating, comment })
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['outfit_logs', session.user.id] }),
  })
}

export function useSavedLooks() {
  const { session } = useAuth()
  const userId = session?.user?.id
  return useQuery({
    queryKey: ['saved_looks', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('saved_looks')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useSaveLook() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ occasion, weather, itemIds }) => {
      const { data, error } = await supabase
        .from('saved_looks')
        .insert({ user_id: session.user.id, occasion, weather, item_ids: itemIds })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['saved_looks', session.user.id] }),
  })
}

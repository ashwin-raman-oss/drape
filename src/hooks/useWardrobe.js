import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { useAuth } from './useAuth'

export function useWardrobe() {
  const { session } = useAuth()
  const userId = session?.user?.id

  return useQuery({
    queryKey: ['wardrobe', userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('wardrobe_items')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data
    },
    enabled: !!userId,
  })
}

export function useAddItem() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (itemData) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('wardrobe_items')
        .insert({ ...itemData, user_id: session.user.id })
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['wardrobe', data?.user_id ?? session?.user?.id] }),
  })
}

export function useUpdateItem() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const { data, error } = await supabase
        .from('wardrobe_items')
        .update(updates)
        .eq('id', id)
        .eq('user_id', session.user.id)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => qc.invalidateQueries({ queryKey: ['wardrobe', data?.user_id ?? session?.user?.id] }),
  })
}

export function useDeleteItem() {
  const { session } = useAuth()
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id) => {
      if (!session?.user?.id) throw new Error('Not authenticated')
      const { error } = await supabase
        .from('wardrobe_items')
        .delete()
        .eq('id', id)
        .eq('user_id', session.user.id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['wardrobe', session?.user?.id] }),
  })
}

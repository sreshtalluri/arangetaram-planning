import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Type definitions for portfolio_images table
// These will be generated from database.types.ts once the table exists
export interface PortfolioImage {
  id: string
  vendor_id: string
  storage_path: string
  caption: string | null
  order_index: number
  created_at: string | null
}

export function usePortfolio(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['portfolio', vendorId],
    queryFn: async (): Promise<PortfolioImage[]> => {
      if (!vendorId) return []
      const { data, error } = await supabase
        .from('portfolio_images')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('order_index', { ascending: true })
      if (error) throw error
      return (data as PortfolioImage[]) || []
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  })
}

export function useAddPortfolioImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (image: {
      vendor_id: string
      storage_path: string
      caption?: string
      order_index: number
    }) => {
      const { data, error } = await supabase
        .from('portfolio_images')
        .insert(image)
        .select()
        .single()
      if (error) throw error
      return data as PortfolioImage
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', data.vendor_id] })
    },
  })
}

export function useDeletePortfolioImage() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, vendorId }: { id: string; vendorId: string }) => {
      const { error } = await supabase
        .from('portfolio_images')
        .delete()
        .eq('id', id)
      if (error) throw error
      return { id, vendorId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', data.vendorId] })
    },
  })
}

export function useReorderPortfolio() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vendorId,
      images,
    }: {
      vendorId: string
      images: { id: string; order_index: number }[]
    }) => {
      // Update all order indices in parallel
      const updates = images.map((img) =>
        supabase
          .from('portfolio_images')
          .update({ order_index: img.order_index })
          .eq('id', img.id)
      )
      await Promise.all(updates)
      return { vendorId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio', data.vendorId] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format, parseISO } from 'date-fns'

// Type definitions for vendor_availability table
// These will be generated from database.types.ts once the table exists
export interface VendorAvailability {
  id: string
  vendor_id: string
  blocked_date: string // Stored as 'YYYY-MM-DD' string
  note: string | null
  created_at: string | null
}

export function useAvailability(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['availability', vendorId],
    queryFn: async (): Promise<VendorAvailability[]> => {
      if (!vendorId) return []
      const { data, error } = await supabase
        .from('vendor_availability')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('blocked_date', { ascending: true })
      if (error) throw error
      return (data as VendorAvailability[]) || []
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  })
}

export function useBlockDates() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vendorId,
      dates,
      note,
    }: {
      vendorId: string
      dates: Date[]
      note?: string
    }) => {
      const records = dates.map((date) => ({
        vendor_id: vendorId,
        blocked_date: format(date, 'yyyy-MM-dd'),
        note,
      }))
      // Use upsert to handle duplicates gracefully
      const { error } = await supabase
        .from('vendor_availability')
        .upsert(records, { onConflict: 'vendor_id,blocked_date' })
      if (error) throw error
      return { vendorId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.vendorId] })
    },
  })
}

export function useUnblockDate() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ vendorId, date }: { vendorId: string; date: Date }) => {
      const { error } = await supabase
        .from('vendor_availability')
        .delete()
        .eq('vendor_id', vendorId)
        .eq('blocked_date', format(date, 'yyyy-MM-dd'))
      if (error) throw error
      return { vendorId }
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['availability', data.vendorId] })
    },
  })
}

// Helper to convert availability records to Date objects for calendar
export function useBlockedDates(vendorId: string | undefined) {
  const { data: availability, ...rest } = useAvailability(vendorId)
  const blockedDates = availability?.map((a) => parseISO(a.blocked_date)) || []
  return { blockedDates, availability, ...rest }
}

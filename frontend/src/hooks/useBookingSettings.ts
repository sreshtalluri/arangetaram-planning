import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Type definitions for vendor_booking_settings table
// Using 'as any' for .from() calls because this table is not yet in database.types.ts
export interface BookingSettings {
  vendor_id: string
  booking_type: 'exclusive' | 'multi'
  max_per_day: number
  buffer_days_before: number
  buffer_days_after: number
  created_at: string
  updated_at: string
}

/**
 * Fetch booking settings for a vendor
 */
export function useBookingSettings(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['booking-settings', vendorId],
    queryFn: async (): Promise<BookingSettings | null> => {
      if (!vendorId) return null
      const { data, error } = await (supabase
        .from('vendor_booking_settings' as any) as any)
        .select('*')
        .eq('vendor_id', vendorId)
        .single()
      // PGRST116 = no rows found, return null instead of throwing
      if (error && error.code === 'PGRST116') return null
      if (error) throw error
      return data as BookingSettings
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  })
}

/**
 * Update booking settings for a vendor
 */
export function useUpdateBookingSettings() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vendorId,
      settings,
    }: {
      vendorId: string
      settings: Partial<Omit<BookingSettings, 'vendor_id' | 'created_at' | 'updated_at'>>
    }) => {
      const { data, error } = await (supabase
        .from('vendor_booking_settings' as any) as any)
        .update(settings)
        .eq('vendor_id', vendorId)
        .select()
        .single()
      if (error) throw error
      return data as BookingSettings
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['booking-settings', data.vendor_id] })
    },
  })
}

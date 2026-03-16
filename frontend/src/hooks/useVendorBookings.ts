import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import { format } from 'date-fns'

// Type definitions for vendor_bookings table
// Using 'as any' for .from() calls because this table is not yet in database.types.ts
export interface VendorBooking {
  id: string
  vendor_id: string
  event_id: string | null
  inquiry_id: string | null
  booked_date: string
  blocked_dates: string[]
  status: 'confirmed' | 'cancelled'
  source: 'inquiry' | 'manual'
  note: string | null
  created_at: string
}

export interface VendorBookingWithDetails extends VendorBooking {
  event?: {
    id: string
    event_name: string
    event_date: string
  }
}

/**
 * Fetch bookings for a vendor with optional event details
 */
export function useVendorBookings(vendorId: string | undefined, includesCancelled = false) {
  return useQuery({
    queryKey: ['vendor-bookings', vendorId, includesCancelled],
    queryFn: async (): Promise<VendorBookingWithDetails[]> => {
      if (!vendorId) return []
      let query = (supabase
        .from('vendor_bookings' as any) as any)
        .select(`
          *,
          event:events (
            id,
            event_name,
            event_date
          )
        `)
        .eq('vendor_id', vendorId)
      if (!includesCancelled) {
        query = query.eq('status', 'confirmed')
      }
      query = query.order('booked_date', { ascending: true })
      const { data, error } = await query
      if (error) throw error
      return (data as VendorBookingWithDetails[]) || []
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

/**
 * Create a new booking for a vendor
 */
export function useCreateBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      vendorId,
      eventId,
      inquiryId,
      bookedDate,
      blockedDates,
      source,
      note,
    }: {
      vendorId: string
      eventId?: string
      inquiryId?: string
      bookedDate: Date
      blockedDates: Date[]
      source?: 'inquiry' | 'manual'
      note?: string
    }) => {
      const { data, error } = await (supabase
        .from('vendor_bookings' as any) as any)
        .insert({
          vendor_id: vendorId,
          event_id: eventId || null,
          inquiry_id: inquiryId || null,
          booked_date: format(bookedDate, 'yyyy-MM-dd'),
          blocked_dates: blockedDates.map((d) => format(d, 'yyyy-MM-dd')),
          source: source || 'manual',
          note: note || null,
        })
        .select()
        .single()
      if (error) throw error
      return data as VendorBooking
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', data.vendor_id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

/**
 * Cancel a booking by setting its status to 'cancelled'
 */
export function useCancelBooking() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (bookingId: string) => {
      const { data, error } = await (supabase
        .from('vendor_bookings' as any) as any)
        .update({ status: 'cancelled' })
        .eq('id', bookingId)
        .select()
        .single()
      if (error) throw error
      return data as VendorBooking
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-bookings', data.vendor_id] })
      queryClient.invalidateQueries({ queryKey: ['vendors'] })
    },
  })
}

/**
 * Fetch all blocked dates for a vendor from both manual blocks and confirmed bookings.
 * Useful for calendar display showing all unavailable dates.
 */
export function useAllBlockedDates(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['all-blocked-dates', vendorId],
    queryFn: async (): Promise<{
      manualBlocks: string[]
      bookingBlocks: { date: string; eventName?: string; isBufferDay: boolean }[]
    }> => {
      if (!vendorId) return { manualBlocks: [], bookingBlocks: [] }

      // Fetch manual blocks from vendor_availability
      const { data: availabilityData, error: availabilityError } = await supabase
        .from('vendor_availability')
        .select('blocked_date')
        .eq('vendor_id', vendorId)
      if (availabilityError) throw availabilityError

      const manualBlocks = (availabilityData || []).map((a: any) => a.blocked_date as string)

      // Fetch confirmed bookings with event details
      const { data: bookingsData, error: bookingsError } = await (supabase
        .from('vendor_bookings' as any) as any)
        .select(`
          booked_date,
          blocked_dates,
          event:events (
            event_name
          )
        `)
        .eq('vendor_id', vendorId)
        .eq('status', 'confirmed')
      if (bookingsError) throw bookingsError

      const bookingBlocks: { date: string; eventName?: string; isBufferDay: boolean }[] = []
      for (const booking of bookingsData || []) {
        const eventName = booking.event?.event_name
        const blockedDates: string[] = booking.blocked_dates || []
        for (const date of blockedDates) {
          bookingBlocks.push({
            date,
            eventName,
            isBufferDay: date !== booking.booked_date,
          })
        }
      }

      return { manualBlocks, bookingBlocks }
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Type definitions for inquiries table
// Note: Using 'as any' for .from() calls because inquiries table is not yet in database.types.ts
// These will be replaced with generated types once the migration is applied
export interface Inquiry {
  id: string
  user_id: string
  vendor_id: string
  event_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined'
  response_message: string | null
  responded_at: string | null
  user_read_at: string | null
  vendor_read_at: string | null
  created_at: string
  updated_at: string
}

export interface InquiryWithDetails extends Inquiry {
  event: {
    id: string
    event_name: string
    event_date: string
    location: string | null
    guest_count: number | null
    budget: number | null
  }
  vendor_profile: {
    id: string
    business_name: string
    category: string
    profile_photo_url: string | null
    contact_email: string | null
    contact_phone: string | null
  }
  user_profile: {
    id: string
    full_name: string | null
    email: string
  }
}

export interface InquiryStats {
  total: number
  pending: number
  accepted: number
  declined: number
}

/**
 * Fetch all inquiries sent by a user with event and vendor details
 */
export function useUserInquiries(userId: string | undefined) {
  return useQuery({
    queryKey: ['inquiries', 'user', userId],
    queryFn: async (): Promise<InquiryWithDetails[]> => {
      if (!userId) return []
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .select(`
          *,
          event:events (
            id,
            event_name,
            event_date,
            location,
            guest_count,
            budget
          ),
          vendor_profile:vendor_profiles (
            id,
            business_name,
            category,
            profile_photo_url,
            contact_email,
            contact_phone
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as InquiryWithDetails[]) || []
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Inquiries may update frequently
  })
}

/**
 * Fetch all inquiries received by a vendor with event and user details
 */
export function useVendorInquiries(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['inquiries', 'vendor', vendorId],
    queryFn: async (): Promise<InquiryWithDetails[]> => {
      if (!vendorId) return []
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .select(`
          *,
          event:events (
            id,
            event_name,
            event_date,
            location,
            guest_count,
            budget
          ),
          user_profile:profiles (
            id,
            full_name,
            email
          )
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data as InquiryWithDetails[]) || []
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

/**
 * Send a new inquiry to a vendor
 */
export function useSendInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      userId,
      vendorId,
      eventId,
      message,
    }: {
      userId: string
      vendorId: string
      eventId: string
      message?: string | null
    }) => {
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .insert({
          user_id: userId,
          vendor_id: vendorId,
          event_id: eventId,
          message: message || null,
        })
        .select()
        .single()
      // Handle unique constraint violation (duplicate inquiry)
      if (error && error.code === '23505') {
        throw new Error('You have already sent an inquiry to this vendor for this event.')
      }
      if (error) throw error
      return data as Inquiry
    },
    onSuccess: (_, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'user', userId] })
    },
  })
}

/**
 * Respond to an inquiry (accept or decline)
 */
export function useRespondToInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({
      inquiryId,
      status,
      responseMessage,
    }: {
      inquiryId: string
      status: 'accepted' | 'declined'
      responseMessage?: string | null
    }) => {
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .update({
          status,
          response_message: responseMessage || null,
          responded_at: new Date().toISOString(),
        })
        .eq('id', inquiryId)
        .select()
        .single()
      if (error) throw error
      return data as Inquiry
    },
    onSuccess: (data) => {
      // Invalidate both user and vendor queries to refresh lists
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'user', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'vendor', data.vendor_id] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-stats', data.vendor_id] })
      queryClient.invalidateQueries({ queryKey: ['unread-count'] })
    },
  })
}

/**
 * Mark an inquiry as read (updates user_read_at or vendor_read_at based on role)
 */
export function useMarkInquiryRead(role: 'user' | 'vendor') {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (inquiryId: string) => {
      const updateField = role === 'user' ? 'user_read_at' : 'vendor_read_at'
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .update({ [updateField]: new Date().toISOString() })
        .eq('id', inquiryId)
        .select()
        .single()
      if (error) throw error
      return data as Inquiry
    },
    onSuccess: (data) => {
      // Invalidate relevant queries
      if (role === 'user') {
        queryClient.invalidateQueries({ queryKey: ['inquiries', 'user', data.user_id] })
        queryClient.invalidateQueries({ queryKey: ['unread-count', data.user_id, 'user'] })
      } else {
        queryClient.invalidateQueries({ queryKey: ['inquiries', 'vendor', data.vendor_id] })
        queryClient.invalidateQueries({ queryKey: ['unread-count', data.vendor_id, 'vendor'] })
      }
    },
  })
}

/**
 * Get unread count for badge display
 * - For vendor: count where vendor_read_at IS NULL
 * - For user: count where status != 'pending' AND user_read_at IS NULL (responses not read)
 */
export function useUnreadCount(userId: string | undefined, role: 'user' | 'vendor') {
  return useQuery({
    queryKey: ['unread-count', userId, role],
    queryFn: async (): Promise<number> => {
      if (!userId) return 0

      if (role === 'vendor') {
        // Vendor: count inquiries not yet read by vendor
        const { count, error } = await (supabase
          .from('inquiries' as any) as any)
          .select('*', { count: 'exact', head: true })
          .eq('vendor_id', userId)
          .is('vendor_read_at', null)
        if (error) throw error
        return count || 0
      } else {
        // User: count responses not yet read by user (status changed from pending)
        const { count, error } = await (supabase
          .from('inquiries' as any) as any)
          .select('*', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'pending')
          .is('user_read_at', null)
        if (error) throw error
        return count || 0
      }
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // Refresh more frequently for badge accuracy
    refetchInterval: 30 * 1000, // Auto-refresh every 30 seconds
  })
}

/**
 * Get inquiry statistics for a vendor
 */
export function useInquiryStats(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['inquiry-stats', vendorId],
    queryFn: async (): Promise<InquiryStats> => {
      if (!vendorId) return { total: 0, pending: 0, accepted: 0, declined: 0 }

      // Fetch all inquiries for the vendor to compute stats
      const { data, error } = await (supabase
        .from('inquiries' as any) as any)
        .select('status')
        .eq('vendor_id', vendorId)
      if (error) throw error

      const inquiries = data || []
      const stats: InquiryStats = {
        total: inquiries.length,
        pending: 0,
        accepted: 0,
        declined: 0,
      }

      for (const inquiry of inquiries) {
        if (inquiry.status === 'pending') stats.pending++
        else if (inquiry.status === 'accepted') stats.accepted++
        else if (inquiry.status === 'declined') stats.declined++
      }

      return stats
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

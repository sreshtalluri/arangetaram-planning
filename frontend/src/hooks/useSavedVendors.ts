import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { VendorProfile } from './useVendorProfile'

// Type definitions for saved_vendors table
// Note: Using 'as any' for .from() calls because saved_vendors table is not yet in database.types.ts
// These will be replaced with generated types once the migration is applied
export interface SavedVendor {
  id: string
  user_id: string
  vendor_id: string
  created_at: string | null
}

export interface SavedVendorWithDetails {
  saved_vendor_id: string
  vendor: VendorProfile
}

/**
 * Fetch all saved vendors for a user with vendor profile details
 */
export function useSavedVendors(userId: string | undefined) {
  return useQuery({
    queryKey: ['saved-vendors', userId],
    queryFn: async (): Promise<SavedVendorWithDetails[]> => {
      if (!userId) return []
      const { data, error } = await (supabase
        .from('saved_vendors' as any) as any)
        .select(`
          id,
          vendor_id,
          vendor_profiles (
            id,
            business_name,
            description,
            category,
            service_areas,
            price_min,
            price_max,
            profile_photo_url,
            is_published,
            created_at,
            updated_at
          )
        `)
        .eq('user_id', userId)
      if (error) throw error
      // Transform data to expected shape
      return (data || []).map((item: any) => ({
        saved_vendor_id: item.id,
        vendor: item.vendor_profiles as VendorProfile,
      }))
    },
    enabled: !!userId,
    staleTime: 30 * 1000, // Saved vendors may change more frequently
  })
}

/**
 * Check if a specific vendor is saved by the user
 */
export function useIsSaved(userId: string | undefined, vendorId: string | undefined) {
  return useQuery({
    queryKey: ['is-saved', userId, vendorId],
    queryFn: async (): Promise<boolean> => {
      if (!userId || !vendorId) return false
      const { data, error } = await (supabase
        .from('saved_vendors' as any) as any)
        .select('id')
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
        .maybeSingle()
      if (error) throw error
      return !!data
    },
    enabled: !!userId && !!vendorId,
    staleTime: 30 * 1000,
  })
}

/**
 * Save a vendor to user's list
 */
export function useSaveVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, vendorId }: { userId: string; vendorId: string }) => {
      const { data, error } = await (supabase
        .from('saved_vendors' as any) as any)
        .insert({ user_id: userId, vendor_id: vendorId })
        .select()
        .single()
      // Handle unique constraint violation gracefully (already saved)
      if (error && error.code === '23505') {
        // Unique violation - vendor already saved, not an error
        return null
      }
      if (error) throw error
      return data as SavedVendor
    },
    onSuccess: (_, { userId, vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-vendors', userId] })
      queryClient.invalidateQueries({ queryKey: ['is-saved', userId, vendorId] })
    },
  })
}

/**
 * Remove a vendor from user's saved list
 */
export function useUnsaveVendor() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, vendorId }: { userId: string; vendorId: string }) => {
      const { error } = await (supabase
        .from('saved_vendors' as any) as any)
        .delete()
        .eq('user_id', userId)
        .eq('vendor_id', vendorId)
      if (error) throw error
      return { userId, vendorId }
    },
    onSuccess: ({ userId, vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ['saved-vendors', userId] })
      queryClient.invalidateQueries({ queryKey: ['is-saved', userId, vendorId] })
    },
  })
}

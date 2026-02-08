import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Type definitions for vendor_profiles table
// These will be generated from database.types.ts once the table exists
export interface VendorProfile {
  id: string
  business_name: string
  description: string | null
  category: string
  service_areas: string[]
  price_min: number | null
  price_max: number | null
  profile_photo_url: string | null
  is_published: boolean
  created_at: string | null
  updated_at: string | null
}

export interface VendorProfileInsert {
  id: string
  business_name: string
  description?: string | null
  category: string
  service_areas?: string[]
  price_min?: number | null
  price_max?: number | null
  profile_photo_url?: string | null
  is_published?: boolean
}

export interface VendorProfileUpdate {
  id: string
  business_name?: string
  description?: string | null
  category?: string
  service_areas?: string[]
  price_min?: number | null
  price_max?: number | null
  profile_photo_url?: string | null
  is_published?: boolean
}

export function useVendorProfile(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-profile', vendorId],
    queryFn: async (): Promise<VendorProfile | null> => {
      if (!vendorId) return null
      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', vendorId)
        .single()
      // PGRST116 = no rows returned (vendor hasn't created profile yet)
      if (error && error.code !== 'PGRST116') throw error
      return data as VendorProfile | null
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000, // Profile changes infrequently
  })
}

export function useCreateVendorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (profile: VendorProfileInsert) => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .insert(profile)
        .select()
        .single()
      if (error) throw error
      return data as VendorProfile
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile', data.id] })
    },
  })
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: VendorProfileUpdate) => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as VendorProfile
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile', data.id] })
    },
  })
}

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type VendorLocation = Database['public']['Tables']['vendor_locations']['Row']
type VendorLocationInsert = Database['public']['Tables']['vendor_locations']['Insert']

export function useVendorLocations(vendorId: string | undefined) {
  const queryClient = useQueryClient()

  const locations = useQuery({
    queryKey: ['vendor-locations', vendorId],
    queryFn: async () => {
      if (!vendorId) return []
      const { data, error } = await supabase
        .from('vendor_locations')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('is_primary', { ascending: false })
      if (error) throw error
      return data as VendorLocation[]
    },
    enabled: !!vendorId,
  })

  const addLocation = useMutation({
    mutationFn: async (location: VendorLocationInsert) => {
      const { data, error } = await supabase
        .from('vendor_locations')
        .insert(location)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  const removeLocation = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('vendor_locations')
        .delete()
        .eq('id', locationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  const setPrimary = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('vendor_locations')
        .update({ is_primary: true })
        .eq('id', locationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  return {
    locations: locations.data || [],
    isLoading: locations.isLoading,
    addLocation,
    removeLocation,
    setPrimary,
  }
}

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface PublicVendor {
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
  contact_phone: string | null
  contact_email: string | null
  // Computed fields for display
  price_range: string
  price_estimate: string
  location: string
  rating: number
  review_count: number
  portfolio_images: string[]
  services: string[]
  distance_miles: number | null
}

interface UseVendorsParams {
  category?: string
  search?: string
  price_range?: string
  availableDate?: string // yyyy-MM-dd format - exclude blocked vendors
  // New location-based params
  searchLat?: number
  searchLng?: number
  radiusMiles?: number     // default 25
}

// Map price_min to price range symbol
function getPriceRange(priceMin: number | null): string {
  if (!priceMin) return '$$'
  if (priceMin < 500) return '$'
  if (priceMin < 2000) return '$$'
  if (priceMin < 5000) return '$$$'
  return '$$$$'
}

// Format price estimate
function getPriceEstimate(priceMin: number | null, priceMax: number | null): string {
  if (!priceMin && !priceMax) return 'Contact for pricing'
  if (priceMin && priceMax) return `$${priceMin.toLocaleString()} - $${priceMax.toLocaleString()}`
  if (priceMin) return `From $${priceMin.toLocaleString()}`
  return `Up to $${priceMax?.toLocaleString()}`
}

export function useVendors(params: UseVendorsParams = {}) {
  return useQuery({
    queryKey: ['vendors', params],
    queryFn: async (): Promise<PublicVendor[]> => {
      // If coordinate-based search, use RPC function
      if (params.searchLat && params.searchLng) {
        const { data, error } = await (supabase.rpc as any)('search_vendors_by_location', {
          search_lat: params.searchLat,
          search_lng: params.searchLng,
          radius_miles: params.radiusMiles || 25,
          category_filter: params.category || null,
          search_query: params.search || null,
          price_range_filter: params.price_range || null,
          available_date_filter: params.availableDate || null,
        })
        if (error) throw error
        // RPC already returns sorted by distance, filtered, etc.
        return (data || []).map((vendor: any) => ({
          ...vendor,
          service_areas: vendor.service_areas || [],
          is_published: vendor.is_published ?? false,
          price_range: getPriceRange(vendor.price_min),
          price_estimate: getPriceEstimate(vendor.price_min, vendor.price_max),
          location: vendor.nearest_city && vendor.nearest_state
            ? `${vendor.nearest_city}, ${vendor.nearest_state}`
            : 'Location not set',
          distance_miles: vendor.distance_miles
            ? Math.round(vendor.distance_miles * 10) / 10
            : null,
          rating: 0,
          review_count: 0,
          portfolio_images: [],
          services: [],
        }))
      }

      // Fallback: non-coordinate query
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('is_published', true)

      // Filter by category
      if (params.category) {
        query = query.eq('category', params.category)
      }

      // Search by business name or description
      if (params.search) {
        query = query.or(`business_name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      const { data, error } = await query.order('created_at', { ascending: false })

      if (error) throw error

      // Transform data for display
      let vendors: PublicVendor[] = (data || []).map((vendor) => ({
        ...vendor,
        service_areas: vendor.service_areas || [],
        is_published: vendor.is_published ?? false,
        price_range: getPriceRange(vendor.price_min),
        price_estimate: getPriceEstimate(vendor.price_min, vendor.price_max),
        location: vendor.service_areas?.[0] || 'Location not set',
        distance_miles: null,
        rating: 0, // TODO: Implement reviews
        review_count: 0,
        portfolio_images: [], // TODO: Fetch from portfolio_images table
        services: [], // TODO: Add services field
      }))

      // Filter by price range if specified
      if (params.price_range) {
        vendors = vendors.filter(v => v.price_range === params.price_range)
      }

      // Filter by availability date - exclude vendors blocked on that date
      if (params.availableDate) {
        const { data: blockedVendors } = await supabase
          .from('vendor_availability')
          .select('vendor_id')
          .eq('blocked_date', params.availableDate)

        const blockedIds = new Set(blockedVendors?.map(b => b.vendor_id) || [])
        vendors = vendors.filter(v => !blockedIds.has(v.id))
      }

      return vendors
    },
    staleTime: 30 * 1000, // Cache for 30 seconds
  })
}

export function useVendorById(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor', vendorId],
    queryFn: async (): Promise<PublicVendor | null> => {
      if (!vendorId) return null

      // Fetch vendor profile
      const { data: vendor, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', vendorId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null // Not found
        throw error
      }

      // Fetch portfolio images
      const { data: portfolioImages } = await supabase
        .from('portfolio_images')
        .select('storage_path')
        .eq('vendor_id', vendorId)
        .order('order_index', { ascending: true })

      // Get public URLs for portfolio images
      const imageUrls = (portfolioImages || []).map(img => {
        const { data } = supabase.storage
          .from('portfolio-images')
          .getPublicUrl(img.storage_path)
        return data.publicUrl
      })

      return {
        ...vendor,
        service_areas: vendor.service_areas || [],
        is_published: vendor.is_published ?? false,
        price_range: getPriceRange(vendor.price_min),
        price_estimate: getPriceEstimate(vendor.price_min, vendor.price_max),
        location: vendor.service_areas?.[0] || 'Location not set',
        distance_miles: null,
        rating: 0,
        review_count: 0,
        portfolio_images: imageUrls,
        services: [],
      }
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  })
}

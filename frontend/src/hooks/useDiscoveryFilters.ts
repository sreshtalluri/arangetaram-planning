import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export interface Filters {
  category: string
  location: string        // display text (city name or zip)
  locationLat: string     // latitude as string in URL params
  locationLng: string     // longitude as string in URL params
  radius: string          // radius in miles as string
  priceRange: string
  availableDate: string
  search: string
}

export function useDiscoveryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<Filters>(() => ({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    locationLat: searchParams.get('lat') || '',
    locationLng: searchParams.get('lng') || '',
    radius: searchParams.get('radius') || '25',
    priceRange: searchParams.get('price') || '',
    availableDate: searchParams.get('date') || '',
    search: searchParams.get('q') || '',
  }), [searchParams])

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    const paramKey = key === 'search' ? 'q' :
                     key === 'priceRange' ? 'price' :
                     key === 'availableDate' ? 'date' :
                     key === 'locationLat' ? 'lat' :
                     key === 'locationLng' ? 'lng' : key
    if (value) {
      newParams.set(paramKey, value)
    } else {
      newParams.delete(paramKey)
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const setLocationFilter = useCallback((
    displayName: string,
    lat: number,
    lng: number
  ) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('location', displayName)
    newParams.set('lat', lat.toString())
    newParams.set('lng', lng.toString())
    if (!newParams.has('radius')) {
      newParams.set('radius', '25')
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearLocationFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('location')
    newParams.delete('lat')
    newParams.delete('lng')
    newParams.delete('radius')
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const hasActiveFilters = useMemo(() => {
    return filters.category !== '' ||
      filters.location !== '' ||
      filters.priceRange !== '' ||
      filters.availableDate !== '' ||
      filters.search !== ''
  }, [filters])

  return {
    filters,
    setFilter,
    setLocationFilter,
    clearLocationFilter,
    clearFilters,
    hasActiveFilters,
  }
}

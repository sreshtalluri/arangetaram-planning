import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export interface Filters {
  category: string
  location: string
  priceRange: string
  availableDate: string // yyyy-MM-dd format
  search: string
}

export function useDiscoveryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<Filters>(() => ({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    priceRange: searchParams.get('price') || '',
    availableDate: searchParams.get('date') || '',
    search: searchParams.get('q') || '',
  }), [searchParams])

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    const paramKey = key === 'search' ? 'q' :
                     key === 'priceRange' ? 'price' :
                     key === 'availableDate' ? 'date' : key
    if (value) {
      newParams.set(paramKey, value)
    } else {
      newParams.delete(paramKey)
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const hasActiveFilters = Object.values(filters).some(v => v !== '')

  return { filters, setFilter, clearFilters, hasActiveFilters }
}

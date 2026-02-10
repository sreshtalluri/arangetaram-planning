import { useState, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
import { useRecommendations } from '../../hooks/useRecommendations'
import { CATEGORIES } from '../../lib/categories'
import { RecommendationCard } from './RecommendationCard'
import { Button } from '../ui/button'
import type { Event } from '../../hooks/useEvents'

interface RecommendationsSectionProps {
  event: Event
}

export function RecommendationsSection({ event }: RecommendationsSectionProps) {
  const navigate = useNavigate()
  const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

  const {
    recommendations,
    isLoading,
    isError,
    error,
    refreshRecommendations,
    isFetching,
  } = useRecommendations({ eventId: event.id })

  // Filter out dismissed vendors
  const filteredRecommendations = useMemo(() => {
    const result: typeof recommendations = {}
    for (const [category, data] of Object.entries(recommendations)) {
      const filteredVendors = data.vendors.filter(
        (v) => !dismissedIds.has(v.id)
      )
      if (filteredVendors.length > 0) {
        result[category] = { vendors: filteredVendors }
      }
    }
    return result
  }, [recommendations, dismissedIds])

  const handleDismiss = (vendorId: string) => {
    setDismissedIds((prev) => new Set([...prev, vendorId]))
  }

  const handleViewProfile = (vendorId: string) => {
    navigate(`/vendors/${vendorId}`)
  }

  // Loading state with contextual message
  if (isLoading) {
    const eventMonth = new Date(event.event_date).toLocaleDateString('en-US', {
      month: 'long',
    })
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C] mx-auto mb-3" />
        <p className="text-[#4A4A4A]">
          Finding vendors for your {eventMonth} Arangetram...
        </p>
      </div>
    )
  }

  // Error state with retry
  if (isError) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
        <p className="text-[#4A4A4A] mb-4">
          {(error as Error)?.message || 'Failed to load recommendations'}
        </p>
        <Button onClick={refreshRecommendations} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Try Again
        </Button>
      </div>
    )
  }

  const categoryKeys = Object.keys(filteredRecommendations)

  // Empty state (no recommendations after filtering)
  if (categoryKeys.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
        <p className="text-[#4A4A4A] mb-4">
          No more recommendations available. Try refreshing!
        </p>
        <Button onClick={refreshRecommendations} variant="outline">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh Recommendations
        </Button>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header with refresh button */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-[#C5A059]" />
          <h2 className="text-xl font-semibold text-[#1A1A1A]">
            Recommended for You
          </h2>
        </div>
        <Button
          onClick={refreshRecommendations}
          variant="ghost"
          size="sm"
          disabled={isFetching}
          className="text-[#0F4C5C]"
        >
          <RefreshCw
            className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`}
          />
          Refresh
        </Button>
      </div>

      {/* Categories */}
      {categoryKeys.map((category) => {
        const categoryInfo = CATEGORIES.find((c) => c.id === category)
        const vendors = filteredRecommendations[category]?.vendors || []

        return (
          <div key={category}>
            <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">
              {categoryInfo?.name || category}
            </h3>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {vendors.slice(0, 3).map((vendor) => (
                <RecommendationCard
                  key={vendor.id}
                  vendor={vendor}
                  onDismiss={handleDismiss}
                  onViewProfile={handleViewProfile}
                />
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}

export default RecommendationsSection

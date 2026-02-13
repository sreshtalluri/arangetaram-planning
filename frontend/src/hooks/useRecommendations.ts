import { useQuery, useQueryClient } from '@tanstack/react-query'
import { fetchRecommendations } from '../lib/ai-client'
import type { PublicVendor } from './useVendors'

export interface RecommendedVendor extends PublicVendor {
  aiExplanation: string
}

export interface CategoryRecommendations {
  vendors: RecommendedVendor[]
}

export interface RecommendationsResponse {
  categories: Record<string, CategoryRecommendations>
  allCovered?: boolean
}

interface UseRecommendationsOptions {
  eventId: string | undefined
  enabled?: boolean
}

/**
 * Fetch AI-powered vendor recommendations for an event
 * Uses hybrid approach: database filter then AI ranking
 */
export function useRecommendations({ eventId, enabled = true }: UseRecommendationsOptions) {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['recommendations', eventId],
    queryFn: async (): Promise<RecommendationsResponse> => {
      if (!eventId) throw new Error('Event ID required')
      return fetchRecommendations(eventId)
    },
    enabled: !!eventId && enabled,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    retry: 1, // Auto-retry once on failure (per CONTEXT.md)
  })

  // Refresh recommendations (invalidate cache)
  const refreshRecommendations = () => {
    if (eventId) {
      queryClient.invalidateQueries({ queryKey: ['recommendations', eventId] })
    }
  }

  return {
    ...query,
    recommendations: query.data?.categories || {},
    allCovered: query.data?.allCovered || false,
    refreshRecommendations,
  }
}

/**
 * Get recommendations for a specific category
 */
export function useCategoryRecommendations(eventId: string | undefined, category: string) {
  const { recommendations, ...rest } = useRecommendations({ eventId })
  return {
    ...rest,
    vendors: recommendations[category]?.vendors || [],
  }
}

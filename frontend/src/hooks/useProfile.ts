import { useQuery } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type Profile = Database['public']['Tables']['profiles']['Row']

export function useProfile(userId: string | undefined) {
  return useQuery({
    queryKey: ['profile', userId],
    queryFn: async (): Promise<Profile | null> => {
      if (!userId) return null

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) {
        // PGRST116 = no rows returned (user hasn't completed profile yet)
        if (error.code === 'PGRST116') {
          return null
        }
        throw error
      }
      return data
    },
    enabled: !!userId, // Only run query if userId exists
    staleTime: 60 * 1000, // Profile changes infrequently
  })
}

// Export Profile type for consumers
export type { Profile }

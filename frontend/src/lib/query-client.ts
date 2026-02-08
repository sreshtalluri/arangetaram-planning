import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000, // 1 minute - data considered fresh
      gcTime: 5 * 60 * 1000, // 5 minutes - cache retention (formerly cacheTime)
      retry: 1, // Retry failed requests once
      refetchOnWindowFocus: true, // Refetch when tab regains focus
    },
  },
})

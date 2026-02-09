import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

// Type definitions for events table
// Note: Using 'as any' for .from() calls because events table is not yet in database.types.ts
// These will be replaced with generated types once the migration is applied
export interface Event {
  id: string
  user_id: string
  event_name: string
  event_date: string // DATE stored as string (YYYY-MM-DD)
  location: string | null
  guest_count: number | null
  budget: number | null
  categories_needed: string[]
  categories_covered: string[]
  created_at: string | null
  updated_at: string | null
}

export interface EventInsert {
  user_id: string
  event_name: string
  event_date: string
  location?: string | null
  guest_count?: number | null
  budget?: number | null
  categories_needed?: string[]
  categories_covered?: string[]
}

export interface EventUpdate {
  id: string
  event_name?: string
  event_date?: string
  location?: string | null
  guest_count?: number | null
  budget?: number | null
  categories_needed?: string[]
  categories_covered?: string[]
}

/**
 * Fetch all events for a user
 */
export function useEvents(userId: string | undefined) {
  return useQuery({
    queryKey: ['events', userId],
    queryFn: async (): Promise<Event[]> => {
      if (!userId) return []
      const { data, error } = await (supabase
        .from('events' as any) as any)
        .select('*')
        .eq('user_id', userId)
        .order('event_date', { ascending: true })
      if (error) throw error
      return (data as Event[]) || []
    },
    enabled: !!userId,
    staleTime: 60 * 1000, // Events don't change frequently
  })
}

/**
 * Fetch a single event by ID
 */
export function useEvent(eventId: string | undefined) {
  return useQuery({
    queryKey: ['event', eventId],
    queryFn: async (): Promise<Event | null> => {
      if (!eventId) return null
      const { data, error } = await (supabase
        .from('events' as any) as any)
        .select('*')
        .eq('id', eventId)
        .single()
      // PGRST116 = no rows returned
      if (error && error.code !== 'PGRST116') throw error
      return data as Event | null
    },
    enabled: !!eventId,
    staleTime: 60 * 1000,
  })
}

/**
 * Create a new event
 */
export function useCreateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (event: EventInsert) => {
      const { data, error } = await (supabase
        .from('events' as any) as any)
        .insert(event)
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', data.user_id] })
    },
  })
}

/**
 * Update an existing event
 */
export function useUpdateEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, ...updates }: EventUpdate) => {
      const { data, error } = await (supabase
        .from('events' as any) as any)
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()
      if (error) throw error
      return data as Event
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['events', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['event', data.id] })
    },
  })
}

/**
 * Delete an event
 */
export function useDeleteEvent() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ eventId, userId }: { eventId: string; userId: string }) => {
      const { error } = await (supabase
        .from('events' as any) as any)
        .delete()
        .eq('id', eventId)
      if (error) throw error
      return { eventId, userId }
    },
    onSuccess: ({ eventId, userId }) => {
      queryClient.invalidateQueries({ queryKey: ['events', userId] })
      queryClient.invalidateQueries({ queryKey: ['event', eventId] })
    },
  })
}

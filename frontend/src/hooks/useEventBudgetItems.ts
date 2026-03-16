import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// TODO: Remove 'as any' casts once database.types.ts is regenerated to include event_budget_items table (run supabase gen types after migration 00008)

export type BudgetStatus = 'estimated' | 'agreed' | 'paid' | 'cancelled';

export interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  vendor_id: string | null;
  inquiry_id: string | null;
  label: string | null;
  agreed_price: number | null;
  price_notes: string | null;
  status: BudgetStatus;
  created_at: string | null;
  updated_at: string | null;
}

export interface BudgetItemInsert {
  event_id: string;
  category: string;
  vendor_id?: string;
  label?: string;
  agreed_price?: number;
  price_notes?: string;
  status?: BudgetStatus;
}

export interface BudgetItemUpdate {
  agreed_price?: number | null;
  price_notes?: string | null;
  status?: BudgetStatus;
}

// Fetch all budget items for an event
export function useEventBudgetItems(eventId: string | undefined) {
  return useQuery({
    queryKey: ['budget-items', eventId],
    queryFn: async () => {
      if (!eventId) return [];
      const { data, error } = await (
        supabase.from('event_budget_items' as any) as any)
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as BudgetItem[];
    },
    enabled: !!eventId,
  });
}

// Add a manual budget item
export function useAddBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (item: BudgetItemInsert) => {
      const { data, error } = await (
        supabase.from('event_budget_items' as any) as any)
        .insert(item)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', data.event_id] });
    },
    onError: (error: Error) => {
      console.error('Failed to add budget item:', error);
    },
  });
}

// Update a budget item (price, notes, status)
export function useUpdateBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      id,
      eventId,
      updates,
    }: {
      id: string;
      eventId: string;
      updates: BudgetItemUpdate;
    }) => {
      const { data, error } = await (
        supabase.from('event_budget_items' as any) as any)
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return { ...data, eventId };
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', data.eventId] });
    },
    onError: (error: Error) => {
      console.error('Failed to update budget item:', error);
    },
  });
}

// Delete a budget item
export function useDeleteBudgetItem() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, eventId }: { id: string; eventId: string }) => {
      const { error } = await (
        supabase.from('event_budget_items' as any) as any)
        .delete()
        .eq('id', id);

      if (error) throw error;
      return { eventId };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['budget-items', data.eventId] });
    },
    onError: (error: Error) => {
      console.error('Failed to delete budget item:', error);
    },
  });
}

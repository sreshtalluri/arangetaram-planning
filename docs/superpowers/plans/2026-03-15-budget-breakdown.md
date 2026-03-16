# Budget Breakdown Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Track per-vendor pricing for events with a budget breakdown view, replacing the single total budget display.

**Architecture:** New `event_budget_items` table with auto-creation via extended DB trigger on inquiry acceptance. New event detail page (`/events/:id`) with budget summary and category breakdown. Vendor pricing captured during inquiry response flow.

**Tech Stack:** Supabase (PostgreSQL + RLS), React 19, TypeScript, React Router DOM, TanStack React Query, Shadcn UI, Tailwind CSS

**Spec:** `docs/superpowers/specs/2026-03-15-budget-breakdown-design.md`

**Worktree:** Execute in a dedicated worktree on branch `feature/budget-breakdown`

---

## File Structure

### New Files
- `supabase/migrations/00008_budget_items.sql` — table, indexes, triggers, RLS policies
- `frontend/src/pages/EventDetailPage.tsx` — event detail page with budget breakdown
- `frontend/src/hooks/useEventBudgetItems.ts` — CRUD hook for budget items
- `frontend/src/components/budget/BudgetSummaryBar.tsx` — total/committed/remaining metrics + progress bar
- `frontend/src/components/budget/BudgetBreakdownTable.tsx` — category breakdown table with inline editing
- `frontend/src/components/budget/AddBudgetItemDialog.tsx` — manual entry form dialog

### Modified Files
- `supabase/migrations/00007_inquiry_acceptance_trigger.sql` — extend trigger (or new migration patching it)
- `frontend/src/App.js` — add `/events/:id` route
- `frontend/src/components/dashboard/EventCard.tsx` — link to detail page, update budget display
- `frontend/src/components/inquiry/RespondInquiryDialog.jsx` — add price/notes fields
- `frontend/src/hooks/useInquiries.ts` — pass quoted_price/notes in useRespondToInquiry
- `frontend/src/pages/UserDashboard.jsx` — fetch and pass budget data to EventCards
- `frontend/src/hooks/useEvents.ts` — add Event type export if needed

---

## Chunk 1: Database Schema & Trigger

### Task 1: Create `event_budget_items` table migration

**Files:**
- Create: `supabase/migrations/00008_budget_items.sql`

- [ ] **Step 1: Write the migration file**

```sql
-- Create event_budget_items table
CREATE TABLE public.event_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendor_profiles(id),
  inquiry_id UUID REFERENCES public.inquiries(id),
  label TEXT,
  agreed_price INTEGER,
  price_notes TEXT,
  status TEXT NOT NULL DEFAULT 'estimated'
    CHECK (status IN ('estimated', 'agreed', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_budget_items_event_id ON public.event_budget_items(event_id);
CREATE INDEX idx_budget_items_vendor_id ON public.event_budget_items(vendor_id);

-- Updated_at trigger (consistent with all other tables)
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.event_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.event_budget_items ENABLE ROW LEVEL SECURITY;

-- Event owner: full access
CREATE POLICY "Event owners can manage their budget items"
  ON public.event_budget_items
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Vendor: read own items
CREATE POLICY "Vendors can view their own budget items"
  ON public.event_budget_items
  FOR SELECT
  USING (vendor_id = auth.uid());

-- Vendor: update own items (restricted fields enforced by trigger below)
CREATE POLICY "Vendors can update their own budget items"
  ON public.event_budget_items
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Restrict vendor updates to allowed fields only
CREATE OR REPLACE FUNCTION public.restrict_budget_item_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is not the event owner, restrict fields
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = NEW.event_id AND user_id = auth.uid()
  ) THEN
    -- Vendor can only update agreed_price, price_notes, status
    IF NEW.event_id != OLD.event_id
       OR NEW.category != OLD.category
       OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
       OR NEW.inquiry_id IS DISTINCT FROM OLD.inquiry_id
       OR NEW.label IS DISTINCT FROM OLD.label THEN
      RAISE EXCEPTION 'Vendors can only update price, notes, and status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER restrict_budget_item_updates
  BEFORE UPDATE ON public.event_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_budget_item_updates();

-- Add quoted_price columns to inquiries table
ALTER TABLE public.inquiries
  ADD COLUMN quoted_price INTEGER,
  ADD COLUMN quoted_price_notes TEXT;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00008_budget_items.sql
git commit -m "feat: add event_budget_items table with RLS and quoted_price on inquiries"
```

---

### Task 2: Extend inquiry acceptance trigger for auto-creation

**Files:**
- Create: `supabase/migrations/00009_budget_item_auto_creation.sql`

Note: We create a new migration rather than modifying 00007 to preserve migration history. This replaces the function with `SECURITY DEFINER` so the trigger can INSERT into `event_budget_items` despite RLS. The original function in 00007 did not use `SECURITY DEFINER` — this is an intentional change that also applies to the existing `categories_covered` update logic. The `handle_updated_at()` function is defined in `supabase/migrations/00001_profiles.sql`.

- [ ] **Step 1: Write the trigger extension migration**

```sql
-- Replace the inquiry acceptance trigger to also create budget items
CREATE OR REPLACE FUNCTION public.handle_inquiry_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Existing logic: update categories_covered on the event
    UPDATE public.events
    SET categories_covered = array_append(
      COALESCE(categories_covered, '{}'),
      (SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id)
    )
    WHERE id = NEW.event_id
    AND NOT (
      COALESCE(categories_covered, '{}') @>
      ARRAY[(SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id)]
    );

    -- New logic: create budget item
    INSERT INTO public.event_budget_items (
      event_id, category, vendor_id, inquiry_id, label, agreed_price, price_notes, status
    )
    VALUES (
      NEW.event_id,
      (SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id),
      NEW.vendor_id,
      NEW.id,
      (SELECT business_name FROM public.vendor_profiles WHERE id = NEW.vendor_id),
      NEW.quoted_price,
      NEW.quoted_price_notes,
      CASE WHEN NEW.quoted_price IS NOT NULL THEN 'agreed' ELSE 'estimated' END
    );
  END IF;

  -- Handle declined: cancel linked budget item
  IF NEW.status = 'declined' AND (OLD.status IS NULL OR OLD.status != 'declined') THEN
    UPDATE public.event_budget_items
    SET status = 'cancelled'
    WHERE inquiry_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

- [ ] **Step 2: Commit**

```bash
git add supabase/migrations/00009_budget_item_auto_creation.sql
git commit -m "feat: extend inquiry trigger to auto-create budget items"
```

---

## Chunk 2: Frontend Data Layer

### Task 3: Create `useEventBudgetItems` hook

**Files:**
- Create: `frontend/src/hooks/useEventBudgetItems.ts`

- [ ] **Step 1: Write the hook**

Note: This codebase uses `(supabase.from('table_name' as any) as any)` for tables not in `database.types.ts`. The `event_budget_items` table is new and won't be in the generated types, so all `.from()` calls must use this pattern. See `frontend/src/hooks/useInquiries.ts:5` and `frontend/src/hooks/useSavedVendors.ts:6` for examples.

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../lib/supabase';

// Note: Using 'as any' for .from() calls because event_budget_items table is not yet in database.types.ts

export interface BudgetItem {
  id: string;
  event_id: string;
  category: string;
  vendor_id: string | null;
  inquiry_id: string | null;
  label: string | null;
  agreed_price: number | null;
  price_notes: string | null;
  status: 'estimated' | 'agreed' | 'paid' | 'cancelled';
  created_at: string | null;
  updated_at: string | null;
}

export interface BudgetItemInsert {
  event_id: string;
  category: string;
  label?: string;
  agreed_price?: number;
  price_notes?: string;
  status?: string;
}

export interface BudgetItemUpdate {
  agreed_price?: number | null;
  price_notes?: string | null;
  status?: string;
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
  });
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useEventBudgetItems.ts
git commit -m "feat: add useEventBudgetItems CRUD hook"
```

---

### Task 4: Update `useRespondToInquiry` to pass quoted price

**Files:**
- Modify: `frontend/src/hooks/useInquiries.ts:171-210`

- [ ] **Step 1: Update the mutation params type and Supabase call**

In `frontend/src/hooks/useInquiries.ts`, find the `useRespondToInquiry` function (around line 171). Update the mutation to accept and pass `quotedPrice` and `quotedPriceNotes`:

Change the mutationFn params to include:
```typescript
quotedPrice?: number;
quotedPriceNotes?: string;
```

And update the Supabase `.update()` call to include:
```typescript
quoted_price: params.quotedPrice ?? null,
quoted_price_notes: params.quotedPriceNotes ?? null,
```

alongside the existing `status`, `response_message`, and `responded_at` fields.

- [ ] **Step 2: Verify existing invalidation covers budget items**

The `onSuccess` already invalidates `['events']` queries. Add invalidation for budget items:
```typescript
queryClient.invalidateQueries({ queryKey: ['budget-items'] });
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/hooks/useInquiries.ts
git commit -m "feat: pass quoted_price through useRespondToInquiry hook"
```

---

## Chunk 3: Budget Breakdown UI Components

### Task 5: Create `BudgetSummaryBar` component

**Files:**
- Create: `frontend/src/components/budget/BudgetSummaryBar.tsx`

- [ ] **Step 1: Write the component**

Reference `@frontend-design` skill for polished UI. The component receives:
- `totalBudget: number | null` — from event.budget
- `committedAmount: number` — sum of all non-cancelled budget items with agreed_price
- `bookedCount: number` — number of categories with budget items
- `totalCategories: number` — total categories_needed count

Displays:
- Three metric cards: Total Budget, Committed, Remaining
- Progress bar (percentage = committed / total)
- If no total budget: "Total Budget: Not set" with muted styling
- If over budget: remaining shows "$0", "Over budget" label, red/amber progress bar
- Use Shadcn Card component, Tailwind for layout

```typescript
import { Card, CardContent } from '../ui/card';
import { DollarSign, TrendingUp, Wallet } from 'lucide-react';

interface BudgetSummaryBarProps {
  totalBudget: number | null;
  committedAmount: number;
  bookedCount: number;
  totalCategories: number;
}

export function BudgetSummaryBar({
  totalBudget,
  committedAmount,
  bookedCount,
  totalCategories,
}: BudgetSummaryBarProps) {
  const remaining = totalBudget ? Math.max(0, totalBudget - committedAmount) : null;
  const percentage = totalBudget ? Math.min(100, (committedAmount / totalBudget) * 100) : 0;
  const isOverBudget = totalBudget !== null && committedAmount > totalBudget;

  return (
    <Card>
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-base">Budget Overview</h3>
          <span className="text-sm text-muted-foreground">
            {bookedCount} of {totalCategories} categories booked
          </span>
        </div>

        <div className="grid grid-cols-3 gap-6 mb-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Total Budget</p>
            <p className="text-2xl font-bold">
              {totalBudget !== null ? `$${totalBudget.toLocaleString()}` : 'Not set'}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Committed</p>
            <p className="text-2xl font-bold text-blue-600">
              ${committedAmount.toLocaleString()}
            </p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Remaining</p>
            {isOverBudget ? (
              <div>
                <p className="text-2xl font-bold text-red-600">$0</p>
                <span className="text-xs text-red-600 font-medium">Over budget</span>
              </div>
            ) : (
              <p className="text-2xl font-bold text-green-600">
                {remaining !== null ? `$${remaining.toLocaleString()}` : '—'}
              </p>
            )}
          </div>
        </div>

        {totalBudget !== null && (
          <div>
            <div className="w-full bg-muted rounded-full h-2.5 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  isOverBudget ? 'bg-red-500' : 'bg-blue-600'
                }`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {percentage.toFixed(1)}% allocated
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/budget/BudgetSummaryBar.tsx
git commit -m "feat: add BudgetSummaryBar component"
```

---

### Task 6: Create `BudgetBreakdownTable` component

**Files:**
- Create: `frontend/src/components/budget/BudgetBreakdownTable.tsx`

- [ ] **Step 1: Write the component**

Reference `@frontend-design` skill for polished UI. This is the main breakdown table showing:
- Booked categories with vendor name, price, notes, status badge
- Unbooked categories as dimmed "Open" rows
- Inline editing for price and notes on click
- Delete button per row
- "Add Item" button in header

Uses `getCategoryByValue()` from `frontend/src/lib/vendor-categories.ts` for category icons/labels. Uses Shadcn Table, Badge, Button, Input components.

Key props:
```typescript
interface BudgetBreakdownTableProps {
  budgetItems: BudgetItem[];
  categoriesNeeded: string[];
  onUpdateItem: (id: string, updates: BudgetItemUpdate) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
}
```

Features:
- Each row shows: category icon + label, vendor/label, price (editable), notes (editable), status badge
- Status badges: Estimated (yellow), Agreed (green), Paid (blue), Cancelled (red/dimmed), Open (gray)
- Unbooked categories: cross-reference `categoriesNeeded` against budget items' categories. Categories in `categoriesNeeded` without a corresponding non-cancelled budget item show as "Open" rows
- Clicking price or notes cell enters inline edit mode (input field, save on blur/enter, cancel on escape)
- Category icons/labels must have **sufficient contrast** — use dark text colors, not the muted category colors directly as text

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/budget/BudgetBreakdownTable.tsx
git commit -m "feat: add BudgetBreakdownTable component with inline editing"
```

---

### Task 7: Create `AddBudgetItemDialog` component

**Files:**
- Create: `frontend/src/components/budget/AddBudgetItemDialog.tsx`

- [ ] **Step 1: Write the component**

Uses Shadcn Dialog, Input, Select, Textarea, Button components. Form fields:
- Category: select dropdown populated from `categoriesNeeded` prop (using labels from `vendor-categories.ts`)
- Label: free text input (e.g., vendor name or description)
- Price: number input with dollar formatting
- Notes: textarea for what's included

Props:
```typescript
interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriesNeeded: string[];
  onSubmit: (item: { category: string; label: string; agreed_price?: number; price_notes?: string }) => void;
}
```

On submit, calls `onSubmit` with the form data. Parent component handles the mutation via `useAddBudgetItem`.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/budget/AddBudgetItemDialog.tsx
git commit -m "feat: add AddBudgetItemDialog for manual budget entries"
```

---

## Chunk 4: Event Detail Page & Integration

### Task 8: Create `EventDetailPage`

**Files:**
- Create: `frontend/src/pages/EventDetailPage.tsx`

- [ ] **Step 1: Write the page component**

Reference `@frontend-design` skill for polished page layout. Uses React Router `useParams` to get event ID. Fetches event via `useEvent(id)` and budget items via `useEventBudgetItems(id)`. Composes:

- Event header: name, date, location, guest count, "Edit Event" button (links to `/events/create?edit={id}`)
- `<BudgetSummaryBar>` with computed props from budget items
- `<BudgetBreakdownTable>` with handlers wired to mutation hooks
- `<AddBudgetItemDialog>` controlled by local state

Computation logic:
- `committedAmount` = sum of `agreed_price` for items where status is not 'cancelled'
- `bookedCount` = count of distinct categories with non-cancelled budget items
- Unbooked categories = `event.categories_needed` minus booked categories

```typescript
import { useParams, Link } from 'react-router-dom';
import { useEvent } from '../hooks/useEvents';
import {
  useEventBudgetItems,
  useAddBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
} from '../hooks/useEventBudgetItems';
import { BudgetSummaryBar } from '../components/budget/BudgetSummaryBar';
import { BudgetBreakdownTable } from '../components/budget/BudgetBreakdownTable';
import { AddBudgetItemDialog } from '../components/budget/AddBudgetItemDialog';
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/pages/EventDetailPage.tsx
git commit -m "feat: add EventDetailPage with budget breakdown"
```

---

### Task 9: Add route and update EventCard

**Files:**
- Modify: `frontend/src/App.js:25-67` — add route
- Modify: `frontend/src/components/dashboard/EventCard.tsx` — link to detail page + updated budget display

- [ ] **Step 1: Add route to App.js**

At the top of `frontend/src/App.js`, add the import alongside the other lazy imports:
```jsx
import EventDetailPage from './pages/EventDetailPage';
```

Then add a new `<Route>` inside the existing `<Routes>` block, wrapped in `ProtectedRoute`. Add after the existing `/events/create` route (around line 41). **Important:** Place `/events/:id` AFTER `/events/create` so the static path matches first:

```jsx
<Route
  path="/events/:id"
  element={
    <ProtectedRoute>
      <EventDetailPage />
    </ProtectedRoute>
  }
/>
```

- [ ] **Step 2: Update EventCard to link to detail page**

In `frontend/src/components/dashboard/EventCard.tsx`:

1. Import `useNavigate` from react-router-dom and `useEventBudgetItems` from the hook
2. Add `const navigate = useNavigate()` inside the component
3. Call `useEventBudgetItems(event.id)` inside the component to fetch budget items
4. Compute `committedAmount` = sum of `agreed_price` for non-cancelled items
5. Wrap the Card in a clickable container: add `onClick={() => navigate(`/events/${event.id}`)}` to the outermost Card element with `className="cursor-pointer hover:shadow-md transition-shadow"`
6. Update the budget display: if `committedAmount > 0`, show `$${committedAmount.toLocaleString()} / $${event.budget.toLocaleString()}` with a small inline progress bar div. Otherwise fall back to current `$${event.budget.toLocaleString()}`

This approach fetches budget items per EventCard. This is an N+1 pattern but acceptable for now since users typically have 1-3 events. Can optimize later with an RPC if needed.

- [ ] **Step 3: Commit**

```bash
git add frontend/src/App.js frontend/src/components/dashboard/EventCard.tsx
git commit -m "feat: add event detail route and link EventCard to detail page"
```

---

### Task 10: Update RespondInquiryDialog with price fields

**Files:**
- Modify: `frontend/src/components/inquiry/RespondInquiryDialog.jsx:71-101`

- [ ] **Step 1: Add price and notes inputs to the dialog**

In `RespondInquiryDialog.jsx`, add two form fields that appear when the vendor is accepting (not declining):

- "Your Price" — number input with dollar sign prefix, optional
- "Price Notes" — text input for what's included, optional

These fields should only show when the response action is "accept". Add local state for `quotedPrice` and `quotedPriceNotes`.

Update the `handleRespond` function (around line 28) to pass these values to the mutation:

```jsx
respondToInquiry({
  inquiryId: inquiry.id,
  status: action,
  responseMessage: message,
  quotedPrice: action === 'accepted' ? quotedPrice : undefined,
  quotedPriceNotes: action === 'accepted' ? quotedPriceNotes : undefined,
});
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/inquiry/RespondInquiryDialog.jsx
git commit -m "feat: add quoted price fields to vendor inquiry response"
```

---

## Chunk 5: Final Integration & Cleanup

### Task 11: Verify dashboard integration

**Files:**
- No modifications needed — EventCard now fetches its own budget data internally (from Task 9)

- [ ] **Step 1: Verify EventCard renders correctly in UserDashboard**

Since EventCard (`frontend/src/components/dashboard/EventCard.tsx`) now calls `useEventBudgetItems` internally, no changes to `frontend/src/pages/UserDashboard.jsx` (note: `.jsx`, not `.tsx`) are needed. Verify the dashboard still renders correctly with the updated EventCard.

- [ ] **Step 2: No commit needed — covered by Task 9**

---

### Task 12: Add vendor budget item visibility to InquiryCard

**Files:**
- Modify: `frontend/src/components/inquiry/InquiryCard.jsx`

Per the spec: "Vendor can see their own budget item for accepted inquiries." When an inquiry has status `'accepted'`, show the vendor's budget item (their agreed price and notes) on the InquiryCard.

- [ ] **Step 1: Fetch vendor's budget item for accepted inquiries**

In `InquiryCard.jsx`, when the inquiry status is `'accepted'`, use the inquiry's `event_id` to fetch the vendor's budget item. Since this is a JSX file, use `useEventBudgetItems` and filter client-side for the item matching the inquiry's `vendor_id`. Display the agreed price and notes below the existing inquiry details.

Show:
- "Your quoted price: $X" (or "Not set" if null)
- Price notes if present
- Status badge (Estimated/Agreed/Paid)

Vendor can click to edit their price and notes inline (using `useUpdateBudgetItem`).

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/inquiry/InquiryCard.jsx
git commit -m "feat: show vendor's budget item on accepted inquiry cards"
```

---

### Task 13: Add `.superpowers/` to `.gitignore`

**Files:**
- Modify: `.gitignore`

- [ ] **Step 1: Add entry**

Add `.superpowers/` to `.gitignore` if not already present. This directory was created by the brainstorming visual companion and should not be committed.

- [ ] **Step 2: Commit**

```bash
git add .gitignore
git commit -m "chore: add .superpowers/ to gitignore"
```

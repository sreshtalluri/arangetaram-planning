# Budget Enhancements Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a dedicated Budget navbar tab with collapsible per-event breakdowns, enhance vendor assignment with platform vendor linking and manual entry, show vendor names on dashboard, and remove the standalone EventDetailPage.

**Architecture:** New BudgetPage at `/budget` reuses existing budget components. AddBudgetItemDialog enhanced with two-mode selector (platform vendor search vs manual entry). CategoryProgress enhanced to show vendor names from budget items. EventDetailPage removed with redirect.

**Tech Stack:** React 19, TypeScript, Tailwind CSS, Shadcn UI, TanStack React Query, React Router DOM, Supabase

**Spec:** `docs/superpowers/specs/2026-03-15-budget-enhancements-design.md`

**Worktree:** Continue in existing worktree on branch `feature/budget-breakdown`

---

## File Structure

### New Files
- `frontend/src/pages/BudgetPage.tsx` — budget page with collapsible per-event sections

### Modified Files
- `frontend/src/components/Navbar.jsx` — add Budget link
- `frontend/src/App.js` — add `/budget` route, remove `/events/:id` route + import, add redirect
- `frontend/src/hooks/useEventBudgetItems.ts` — add `vendor_id` to `BudgetItemInsert`
- `frontend/src/components/budget/AddBudgetItemDialog.tsx` — two-mode selector with vendor search, `defaultCategory` prop
- `frontend/src/components/dashboard/CategoryProgress.tsx` — show vendor names, assign action, new props
- `frontend/src/components/dashboard/EventCard.tsx` — remove click-through, pass budget items to CategoryProgress, own dialog state for assign

### Deleted Files
- `frontend/src/pages/EventDetailPage.tsx`

---

## Chunk 1: Routing, Navbar & Budget Page

### Task 1: Update routing — remove EventDetailPage, add Budget route and redirect

**Files:**
- Modify: `frontend/src/App.js`
- Delete: `frontend/src/pages/EventDetailPage.tsx`

- [ ] **Step 1: Update App.js**

In `frontend/src/App.js`:

1. Remove the `EventDetailPage` import (line 20):
```jsx
// DELETE: import EventDetailPage from "./pages/EventDetailPage";
```

2. Add `BudgetPage` and `Navigate` imports:
```jsx
import BudgetPage from "./pages/BudgetPage";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
```

3. Replace the `/events/:id` route (lines 44-51) with a redirect:
```jsx
<Route path="/events/:id" element={<Navigate to="/budget" replace />} />
```

4. Add the `/budget` route after the `/events/create` route:
```jsx
<Route path="/budget" element={<BudgetPage />} />
```

Note: No `ProtectedRoute` wrapper — BudgetPage handles auth state internally.

- [ ] **Step 2: Delete EventDetailPage.tsx**

Delete `frontend/src/pages/EventDetailPage.tsx`.

- [ ] **Step 3: Commit**

```bash
git rm frontend/src/pages/EventDetailPage.tsx
git add frontend/src/App.js
git commit -m "feat: replace EventDetailPage with /budget route and redirect"
```

---

### Task 2: Add Budget link to Navbar

**Files:**
- Modify: `frontend/src/components/Navbar.jsx`

- [ ] **Step 1: Add Budget link**

In `frontend/src/components/Navbar.jsx`, find the navigation links section (lines 37-50). Add a "Budget" link between "Browse Vendors" and "Plan Event":

```jsx
<Link
  to="/budget"
  className="text-[#4A4A4A] hover:text-[#800020] font-medium transition-colors"
>
  Budget
</Link>
```

Insert it after the "Browse Vendors" link (line 43) and before the "Plan Event" link (line 44).

Note: The nav links use `hidden md:flex` (line 37) — there is no separate mobile menu component in this codebase, so no mobile nav changes needed.

- [ ] **Step 2: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "feat: add Budget link to navbar"
```

---

### Task 3: Create BudgetPage with collapsible per-event sections

**Files:**
- Create: `frontend/src/pages/BudgetPage.tsx`

- [ ] **Step 1: Write the page component**

Reference `@frontend-design` skill for polished UI. This page:
- Uses `useAuth()` from `../hooks/useAuth` to check login state
- Uses `useEvents(user?.id)` from `../hooks/useEvents` to get all user events (note: `useEvents` requires a `userId` parameter)
- For each event, uses `useEventBudgetItems(event.id)` to get budget items
- Renders the `Navbar` at top (import from `../components/Navbar`)

Structure:
```typescript
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Navbar } from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';
import { useEvents } from '../hooks/useEvents';
import {
  useEventBudgetItems,
  useAddBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
} from '../hooks/useEventBudgetItems';
import { BudgetSummaryBar } from '../components/budget/BudgetSummaryBar';
import { BudgetBreakdownTable } from '../components/budget/BudgetBreakdownTable';
import { AddBudgetItemDialog } from '../components/budget/AddBudgetItemDialog';
import { ChevronDown, ChevronRight } from 'lucide-react';
```

**States:**
- Not logged in: show Navbar + centered prompt "Log in to manage your event budgets" with link to `/login`
- No events: show Navbar + "No events yet" with link to `/events/create`
- Events exist: each event as a collapsible section

**Collapsible section per event:**
- Header (always visible, clickable to toggle): event name, date, quick budget summary (`$X,XXX / $Y,YYY`), chevron icon
- Expanded content: `BudgetSummaryBar` + `BudgetBreakdownTable` + `AddBudgetItemDialog`
- State: `expandedEvents: Set<string>` tracking which event IDs are expanded
- Default: if 1 event, it's expanded. If multiple, first is expanded.

**Create a sub-component `EventBudgetSection`** that takes an `event` prop, calls `useEventBudgetItems(event.id)` internally, and renders the summary bar + breakdown table + dialog. This keeps the per-event hooks properly scoped.

Computation logic (same as the removed EventDetailPage):
- `committedAmount` = sum of `agreed_price` for non-cancelled items
- `bookedCount` = count of distinct categories with non-cancelled budget items

- [ ] **Step 2: Verify type check**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/pages/BudgetPage.tsx
git commit -m "feat: add BudgetPage with collapsible per-event budget sections"
```

---

## Chunk 2: Enhanced AddBudgetItemDialog

### Task 4: Add `vendor_id` to BudgetItemInsert

**Files:**
- Modify: `frontend/src/hooks/useEventBudgetItems.ts`

- [ ] **Step 1: Update the interface**

In `frontend/src/hooks/useEventBudgetItems.ts`, add `vendor_id` to `BudgetItemInsert` (around line 20):

```typescript
export interface BudgetItemInsert {
  event_id: string;
  category: string;
  vendor_id?: string;   // <-- ADD THIS
  label?: string;
  agreed_price?: number;
  price_notes?: string;
  status?: string;
}
```

- [ ] **Step 2: Commit**

```bash
git add frontend/src/hooks/useEventBudgetItems.ts
git commit -m "feat: add vendor_id to BudgetItemInsert interface"
```

---

### Task 5: Enhance AddBudgetItemDialog with two modes

**Files:**
- Modify: `frontend/src/components/budget/AddBudgetItemDialog.tsx`

- [ ] **Step 1: Rewrite the dialog with mode selector**

Read the existing `AddBudgetItemDialog.tsx` and the `useVendors` hook at `frontend/src/hooks/useVendors.ts` before writing.

Changes:
1. Add new props:
   - `defaultCategory?: string` — pre-selects and disables category dropdown
   - Update `onSubmit` type to include `vendor_id?: string`

2. Add mode toggle at top of dialog (two tabs/buttons):
   - "Platform Vendor" (Mode A)
   - "Manual Entry" (Mode B)

3. **Mode A — "Platform Vendor":**
   - Category dropdown (same as current, but if `defaultCategory` is set, pre-select and disable)
   - When category is selected, show a searchable vendor list using `useVendors({ category })` from `../../hooks/useVendors`
   - Each vendor shown as a clickable row: business_name, price range, service areas
   - Selecting a vendor auto-fills: `label` = business_name, `category` = vendor category, `vendor_id` = vendor id
   - Price and notes fields still editable
   - Search input to filter vendors by name

4. **Mode B — "Manual Entry":**
   - Current behavior: category dropdown, free-text label, price, notes
   - No vendor_id

5. `onSubmit` payload includes `vendor_id` when in Mode A

6. Reset form and mode when dialog closes

- [ ] **Step 2: Verify type check**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/budget/AddBudgetItemDialog.tsx
git commit -m "feat: enhance AddBudgetItemDialog with platform vendor linking and manual entry modes"
```

---

## Chunk 3: CategoryProgress & EventCard Updates

### Task 6: Enhance CategoryProgress with vendor names and assign action

**Files:**
- Modify: `frontend/src/components/dashboard/CategoryProgress.tsx`

- [ ] **Step 1: Update the component**

Read the existing `CategoryProgress.tsx` (lines 1-121). Add new optional props:

```typescript
interface CategoryProgressProps {
  needed: string[]
  covered: string[]
  compact?: boolean
  eventDate?: string
  budgetItems?: BudgetItem[]              // NEW
  onAssignCategory?: (category: string) => void  // NEW
}
```

Import `BudgetItem` from `../../hooks/useEventBudgetItems`.

Update the detailed view (non-compact) category rendering:

For each category in `needed`:
- **Covered with budget item(s):** Check if `budgetItems` contains non-cancelled items for this category. If yes, show green check + vendor name(s) from the item `label` fields. If multiple items for same category, show comma-separated (e.g., "Ravi, Lakshmi").
- **Covered without budget item:** Category is in `covered` but has no matching budget item. Show green check + "No vendor assigned" in muted text + a small "Assign" button that calls `onAssignCategory(categoryValue)`.
- **Pending (not covered):** Keep existing behavior — clickable link to browse vendors.

The compact mode stays unchanged (just text).

- [ ] **Step 2: Verify type check**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/CategoryProgress.tsx
git commit -m "feat: show vendor names and assign action in CategoryProgress"
```

---

### Task 7: Update EventCard — remove click-through, wire up assign dialog

**Files:**
- Modify: `frontend/src/components/dashboard/EventCard.tsx`

- [ ] **Step 1: Update the component**

Read the existing `EventCard.tsx` (lines 1-167). Make these changes:

1. **Remove click-through navigation:**
   - Remove `useNavigate` import and `const navigate = useNavigate()` (line 21)
   - Remove `onClick={() => navigate(...)}` from the outer div (line 59)
   - Remove `cursor-pointer` from the outer div className (line 58)
   - Remove `stopPropagation` from the actions div (line 77) since it's no longer needed

2. **Add dialog state for assign flow:**
   ```typescript
   const [assignDialogOpen, setAssignDialogOpen] = useState(false);
   const [assignCategory, setAssignCategory] = useState<string | undefined>();
   ```
   Import `useState` from react, and `AddBudgetItemDialog` from `../budget/AddBudgetItemDialog`, and `useAddBudgetItem` from `../../hooks/useEventBudgetItems`.

3. **Pass budget items and assign handler to CategoryProgress:**
   ```tsx
   <CategoryProgress
     needed={event.categories_needed}
     covered={event.categories_covered}
     eventDate={event.event_date}
     budgetItems={budgetItems}
     onAssignCategory={(cat) => {
       setAssignCategory(cat);
       setAssignDialogOpen(true);
     }}
   />
   ```

4. **Render AddBudgetItemDialog at the bottom of the card:**
   ```tsx
   <AddBudgetItemDialog
     open={assignDialogOpen}
     onOpenChange={setAssignDialogOpen}
     categoriesNeeded={event.categories_needed}
     defaultCategory={assignCategory}
     eventId={event.id}
     onSubmit={(item) => {
       addBudgetItem.mutate({
         event_id: event.id,
         ...item,
       });
     }}
   />
   ```

5. Add `const addBudgetItem = useAddBudgetItem();` and call `addBudgetItem.mutate(...)` in the onSubmit.

- [ ] **Step 2: Verify type check**

```bash
cd frontend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add frontend/src/components/dashboard/EventCard.tsx
git commit -m "feat: remove EventCard click-through, add vendor assign dialog flow"
```


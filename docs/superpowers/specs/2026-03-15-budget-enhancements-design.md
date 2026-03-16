# Budget Enhancements — Design Spec

## Overview

Enhance the budget breakdown feature with a dedicated Budget navbar tab, improved vendor assignment flow, and vendor visibility on the dashboard. Remove the standalone EventDetailPage in favor of centralized budget management.

## Changes

### 1. Budget Navbar Tab & Page

**Navbar:** Add "Budget" link between "Browse Vendors" and "Plan Event" in `Navbar.jsx`. Always visible for all users (including vendors — they may plan events too). Also add to any mobile navigation if present. Routes to `/budget`.

**Budget Page (`/budget`):**
- If not logged in: prompt to log in
- If no events: "No events yet" with link to create one
- If events exist: each event rendered as a collapsible section
  - Expanded by default if only one event; first expanded if multiple
  - Section header: event name, date, quick budget summary (`$X,XXX / $Y,YYY`)
  - Expanded content: reuses existing `BudgetSummaryBar`, `BudgetBreakdownTable`, and `AddBudgetItemDialog` components
- Route added to `App.js` (no ProtectedRoute — page handles auth state itself)
- Data fetching: uses `useEvents()` to get all user events, then `useEventBudgetItems(eventId)` per event. N+1 pattern acceptable since users typically have 1-3 events.

### 2. Enhanced Add Budget Item Dialog (Two Modes)

The `AddBudgetItemDialog` gains a mode selector (tabs or toggle) at the top:

**Mode A — "Link Platform Vendor":**
- User picks a category from dropdown
- Shows a searchable list of vendors from the platform (uses `useVendors` hook with category filter)
- Selecting a vendor auto-fills label with `business_name`, category from vendor profile
- `vendor_id` saved on the budget item for the user's private tracking
- No inquiry sent, no vendor notification
- Price and notes fields available

**Mode B — "Manual Entry" (off-platform vendor):**
- Current behavior: category dropdown, free-text label, price, notes
- No `vendor_id` set

Both modes use the existing `event_budget_items` table. Only difference is whether `vendor_id` is populated. No database schema changes needed.

**TypeScript interface changes required:**
- `BudgetItemInsert` in `useEventBudgetItems.ts`: add `vendor_id?: string`
- `AddBudgetItemDialog` `onSubmit` prop type: add `vendor_id?: string`

**`defaultCategory` prop:** Add optional `defaultCategory?: string` prop to `AddBudgetItemDialog`. When provided, pre-selects the category dropdown and disables it. Used when opening the dialog from the "assign" action in `CategoryProgress`.

**Auto-created items** (from inquiry acceptance): Already have `vendor_id` and `inquiry_id` set by the DB trigger. No changes needed.

### 3. Vendor Names on Dashboard EventCard

Enhance `CategoryProgress` to show vendor names next to covered categories.

**New props on `CategoryProgress`:**
- `budgetItems?: BudgetItem[]` — passed down from EventCard (which already fetches them)
- `onAssignCategory?: (category: string) => void` — callback when user clicks "assign" on an unassigned covered category

**Matching logic:** A category is "covered with budget item" when it appears in `covered` array AND has at least one non-cancelled entry in `budgetItems` for that category.

**Display:**
- **Covered with budget item(s):** Green check + vendor name(s) from budget item `label` field. If multiple items for the same category, show all names comma-separated (e.g., "Ravi (Mridangam), Lakshmi (Violin)")
- **Covered without budget item:** Green check + "No vendor assigned" in muted text + small "assign" button. Clicking "assign" calls `onAssignCategory(category)`.
- **Pending:** Keep existing behavior (link to browse vendors)

**Dialog ownership:** `EventCard` owns the `AddBudgetItemDialog` state. When `onAssignCategory` fires, EventCard sets `dialogOpen=true` and `defaultCategory=category`, opening the dialog pre-filtered to that category.

### 4. Cleanup

**Remove EventDetailPage:**
- Delete `frontend/src/pages/EventDetailPage.tsx`
- Remove `/events/:id` route from `App.js`
- Remove EventDetailPage import from `App.js`
- Remove click-through navigation (`onClick`, `useNavigate`, `cursor-pointer`) from `EventCard`
- Keep the committed/total budget indicator and `useEventBudgetItems` fetch on EventCard
- Add redirect: `/events/:id` → `/budget` using `<Navigate to="/budget" />` to handle bookmarks/deep links

## Data Model

No database schema changes. TypeScript interface updates only:
- `BudgetItemInsert`: add `vendor_id?: string`
- `AddBudgetItemDialog` props: add `vendor_id` to `onSubmit` type, add `defaultCategory?: string`
- `CategoryProgress` props: add `budgetItems`, `onAssignCategory`

## Files

### New Files
- `frontend/src/pages/BudgetPage.tsx` — budget page with collapsible per-event sections

### Modified Files
- `frontend/src/components/Navbar.jsx` — add Budget link (desktop + mobile if applicable)
- `frontend/src/App.js` — add `/budget` route, remove `/events/:id` route (add redirect), remove EventDetailPage import
- `frontend/src/components/budget/AddBudgetItemDialog.tsx` — add two-mode selector with vendor search, `defaultCategory` prop
- `frontend/src/hooks/useEventBudgetItems.ts` — add `vendor_id` to `BudgetItemInsert`
- `frontend/src/components/dashboard/CategoryProgress.tsx` — show vendor names, "assign" action, new props
- `frontend/src/components/dashboard/EventCard.tsx` — remove onClick navigate, pass budget items to CategoryProgress, own AddBudgetItemDialog state for assign flow

### Deleted Files
- `frontend/src/pages/EventDetailPage.tsx`

## Edge Cases

- **Multiple budget items per category:** Show all vendor names comma-separated. This supports the future music category split.
- **Covered without budget item:** Show "No vendor assigned" with assign action. Common when users manually mark categories as covered in the event wizard.
- **Deep links to `/events/:id`:** Redirect to `/budget` via `<Navigate>`.
- **Vendor accounts viewing `/budget`:** Show same "No events yet" state if they have no events. Vendors can also be event planners.

## Non-Goals

- Vendor notification when linked to a budget item (private tracking only)
- Vendor-side budget visibility changes (already handled in prior spec)
- Database schema changes
- Batch query optimization for budget page (acceptable N+1 for 1-3 events)

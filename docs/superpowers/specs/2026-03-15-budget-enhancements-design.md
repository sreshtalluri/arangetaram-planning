# Budget Enhancements — Design Spec

## Overview

Enhance the budget breakdown feature with a dedicated Budget navbar tab, improved vendor assignment flow, and vendor visibility on the dashboard. Remove the standalone EventDetailPage in favor of centralized budget management.

## Changes

### 1. Budget Navbar Tab & Page

**Navbar:** Add "Budget" link between "Browse Vendors" and "Plan Event" in `Navbar.jsx`. Always visible. Routes to `/budget`.

**Budget Page (`/budget`):**
- If not logged in: prompt to log in
- If no events: "No events yet" with link to create one
- If events exist: each event rendered as a collapsible section
  - Expanded by default if only one event; first expanded if multiple
  - Section header: event name, date, quick budget summary (`$X,XXX / $Y,YYY`)
  - Expanded content: reuses existing `BudgetSummaryBar`, `BudgetBreakdownTable`, and `AddBudgetItemDialog` components
- Route added to `App.js` (no ProtectedRoute — page handles auth state itself)

### 2. Enhanced Add Budget Item Dialog (Two Modes)

The `AddBudgetItemDialog` gains a mode selector at the top:

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

Both modes use the existing `event_budget_items` table. Only difference is whether `vendor_id` is populated. No schema changes needed.

**Auto-created items** (from inquiry acceptance): Already have `vendor_id` and `inquiry_id` set by the DB trigger. No changes needed.

### 3. Vendor Names on Dashboard EventCard

Enhance `CategoryProgress` to show vendor names next to covered categories:

- **Covered with budget item:** Green check + vendor name (from budget item's `label` field)
- **Covered without budget item:** Green check + "No vendor assigned" in muted text, with a small "assign" action that opens the AddBudgetItemDialog for that category
- **Pending:** Keep existing behavior (link to browse vendors for that category)

Budget items are already fetched in `EventCard` via `useEventBudgetItems`. Pass them down to `CategoryProgress` — no additional queries needed.

### 4. Cleanup

**Remove EventDetailPage:**
- Delete `frontend/src/pages/EventDetailPage.tsx`
- Remove `/events/:id` route from `App.js`
- Remove click-through navigation (`onClick`, `useNavigate`) from `EventCard`
- Keep the committed/total budget indicator and `useEventBudgetItems` fetch on EventCard

## Data Model

No schema changes. All enhancements use the existing `event_budget_items` table and `useVendors` hook.

## Files

### New Files
- `frontend/src/pages/BudgetPage.tsx` — budget page with collapsible per-event sections

### Modified Files
- `frontend/src/components/Navbar.jsx` — add Budget link
- `frontend/src/App.js` — add `/budget` route, remove `/events/:id` route
- `frontend/src/components/budget/AddBudgetItemDialog.tsx` — add two-mode selector with vendor search
- `frontend/src/components/dashboard/CategoryProgress.tsx` — show vendor names, "assign" action
- `frontend/src/components/dashboard/EventCard.tsx` — remove onClick navigate, pass budget items to CategoryProgress

### Deleted Files
- `frontend/src/pages/EventDetailPage.tsx`

## Non-Goals

- Vendor notification when linked to a budget item (private tracking only)
- Vendor-side budget visibility changes (already handled in prior spec)
- Schema changes

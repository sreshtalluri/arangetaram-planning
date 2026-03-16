# Budget Breakdown Feature — Design Spec

## Overview

Replace the single total budget display for events with a full vendor-by-vendor budget breakdown. Users can track actual vendor pricing per category, see committed vs remaining budget, and manage costs from a dedicated event detail page.

## Problem

Currently, events store a single `budget` INTEGER field with no breakdown. Users cannot track what each vendor costs, how much budget is allocated vs remaining, or compare actual spend against their total budget. All pricing context is lost after vendor engagement.

## Solution: Approach 2 — Separate `event_budget_items` Table

A new `event_budget_items` table tracks per-vendor pricing independently from inquiries. Budget items are auto-created when inquiries are accepted and can also be added manually for offline vendors. A new event detail page displays the full breakdown.

## Data Model

### New Table: `event_budget_items`

```sql
CREATE TABLE public.event_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendor_profiles(id),
  inquiry_id UUID REFERENCES public.inquiries(id),
  label TEXT,
  agreed_price INTEGER,
  price_notes TEXT,
  status TEXT NOT NULL DEFAULT 'estimated',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);
```

**Field details:**
- `category` — vendor category string (e.g., 'venue', 'catering', 'musicians'). Denormalized from vendor_profile for simpler queries and to support offline entries.
- `vendor_id` — nullable. NULL for offline/manual entries.
- `inquiry_id` — nullable. NULL for offline/manual entries.
- `label` — display name. Defaults to vendor's `business_name` for inquiry-linked items. Free text for manual entries (e.g., "Mridangam player").
- `agreed_price` — integer in dollars. Nullable until set by either party.
- `price_notes` — free text describing what's included.
- `status` — `'estimated'` | `'agreed'` | `'paid'` | `'cancelled'`. Tracks pricing lifecycle. `'cancelled'` is set when a linked inquiry is declined after the budget item was created.

**Indexes:**
- `event_id` (most queries filter by event)
- `vendor_id` (vendor-side lookups)

**Triggers:**
- `handle_updated_at()` trigger on UPDATE (consistent with all other tables in the codebase)

**No unique constraint on `(event_id, vendor_id)`** — supports multiple items per vendor (future music category split).

### Existing Tables — No Changes

The `events` table keeps its `budget` INTEGER field as the total budget. The `inquiries` table is unchanged. The relationship flows: inquiry accepted → budget item created → pricing tracked separately.

## Auto-Creation Flow

When an inquiry status changes to `'accepted'`:
1. Create an `event_budget_items` row with:
   - `event_id`, `vendor_id`, `inquiry_id` from the inquiry
   - `category` from the vendor's profile
   - `label` set to vendor's `business_name`
   - `agreed_price` set if vendor provided a price during acceptance, otherwise NULL
   - `status` = `'agreed'` if price provided, `'estimated'` if not
2. Implementation: Extend the existing `handle_inquiry_accepted()` database trigger (in `00007_inquiry_acceptance_trigger.sql`) to also insert the budget item row alongside the existing `categories_covered` update. This ensures atomicity — the budget item is always created when an inquiry is accepted, regardless of which client path triggers it. The vendor-provided price (if any) is passed via two new columns on the `inquiries` table: `quoted_price INTEGER` and `quoted_price_notes TEXT`, which the trigger reads when inserting the budget item.

When an inquiry status changes to `'declined'` and a linked budget item exists:
3. The trigger sets the budget item's `status` to `'cancelled'`

## Pricing Entry Points

**Either party can enter/update pricing:**
- **Vendor side:** `RespondInquiryDialog.jsx` gains an optional "Your Price" number input and "Notes" text field. These values are saved to `inquiries.quoted_price` and `inquiries.quoted_price_notes` on acceptance. The database trigger then copies them to the auto-created budget item. The `useRespondToInquiry` hook is updated to pass these new fields in its Supabase update call.
- **User side:** Budget breakdown view on the event detail page. Click any row to edit price and notes inline. Entering a price on an estimated item moves status to `'agreed'`. Uses a new `useEventBudgetItems` hook that calls Supabase directly on `event_budget_items`.

## UI Changes

### 1. New Event Detail Page (`/events/:id`)

Accessed by clicking an EventCard on the dashboard. Route added to `App.js` wrapped in `ProtectedRoute`. EventCard updated to link to `/events/:id` on click. Contains:

**Budget Summary Bar:**
- Three metrics: Total Budget, Committed (sum of all agreed_price values), Remaining (total - committed)
- Progress bar showing percentage allocated
- If no total budget set: shows "Total Budget: Not set" with prompt to add one
- If over budget: remaining shows "$0" with "Over budget" label, progress bar turns red/amber

**Category Breakdown Table:**
- Columns: Category, Vendor, Price, Notes, Status
- Booked categories show vendor name, price, notes, and status badge (Estimated/Agreed/Paid)
- Unbooked categories (from `categories_needed` with no budget item) show as dimmed "Open" rows with "No vendor yet"
- "Add Item" button for manual entries
- Rows are clickable for inline editing (price, notes)
- Delete action on each row (removes budget item only, not the inquiry)

**Category colors/icons must have sufficient contrast** — avoid low-visibility color combinations.

### 2. Updated Dashboard EventCard

Replace the single budget display with a committed/total indicator:
- Format: "$8,500 / $15,000" with a small progress bar
- If no budget items exist, falls back to showing total budget as before

### 3. Vendor Inquiry Response

- `RespondInquiryDialog` gains optional "Your Price" and "Notes" fields
- Vendor can see their own budget item for accepted inquiries
- Vendors cannot see the full event breakdown or other vendors' pricing

### 4. Manual Entry Form

"Add Item" opens a form with:
- Category (dropdown from `categories_needed`)
- Label (free text)
- Price (optional number input)
- Notes (optional text)

No vendor_id or inquiry_id required.

## RLS Policies

- **Event owner (SELECT, INSERT, UPDATE, DELETE):** Full access on all budget items for their events (matched via `event_id → events.user_id = auth.uid()`)
- **Vendor (SELECT):** Read only their own budget items (matched by `vendor_id = auth.uid()`)
- **Vendor (UPDATE):** Update only `agreed_price`, `price_notes`, and `status` on their own budget items. Enforced by a trigger similar to `restrict_inquiry_updates` in migration 00006 — prevents vendors from modifying `event_id`, `category`, `vendor_id`, `inquiry_id`, or `label`.
- **Vendor (INSERT, DELETE):** Not allowed. Budget items for vendors are created by the trigger on inquiry acceptance. Only the event owner can manually add or delete items.
- **Public:** No access

## Edge Cases

- **No total budget set:** Breakdown works without a total — shows committed costs, no remaining/progress bar
- **Price exceeds budget:** Progress bar turns red/amber. Remaining displays "$0" with "Over budget" label (no negative values)
- **Inquiry declined after budget item created:** Budget item status set to `'cancelled'` by the database trigger. Cancelled items are shown dimmed in the breakdown with a "Cancelled" badge. User can delete or replace them.
- **Duplicate vendors per event:** Supported — no unique constraint on (event_id, vendor_id). Needed for future music category split into individual instruments
- **Deleting a budget item:** Only removes the budget item row. Linked inquiry remains accepted

## Future Considerations

- **Music category split:** Categories will eventually split into specific instruments (mridangam, violin, veena, etc.) with separate bookings. The `label` field and lack of unique constraint on vendor_id already support this.
- **Vendor pricing templates:** Vendors could have saved packages/standard pricing to apply to inquiries. The separate table makes this additive.
- **Offline vendors:** Manual entry without vendor_id supports vendors found outside the platform.
- **Price versioning:** Could add a history table later to track quote changes over time.

## Non-Goals (This Iteration)

- Upfront per-category budget allocation/targets
- Payment processing or invoicing
- Vendor pricing templates or packages
- Price negotiation history/versioning
- Budget sharing or export

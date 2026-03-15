# Multi-Event Support Design

**Date:** 2026-03-15
**Approach:** Minimal — UI-only changes, no database migrations

## Problem

Users can only meaningfully interact with one event. The "Plan Event" nav link always goes to `/events/create` (misleading when an event exists), recommendations only render for the first event, and inquiries show no event context.

## Decision

The database and hooks already support multiple events per user. Inquiries are already scoped per-event via `event_id` FK. This is purely a frontend problem.

## Changes

### 1. Navbar — Contextual Link

- **Not authenticated / 0 events:** "Plan Event" links to `/events/create`
- **Authenticated with 1+ events:** "My Events" links to `/dashboard`
- Requires `useEvents` call in Navbar, conditioned on auth state

**File:** `frontend/src/components/Navbar.jsx`

### 2. Dashboard — Per-Event Recommendations (Collapsed)

- Remove the standalone `<RecommendationsSection event={events[0]} />` below the events list
- Each event in the `events.map()` loop gets its own `RecommendationsSection`
- Recommendations are **collapsed by default** behind an accordion/expand button
- User clicks to expand recommendations for the event they're actively working on
- Keeps dashboard scannable when multiple events exist

**File:** `frontend/src/pages/UserDashboard.jsx`

### 3. Dashboard — Inquiries Grouped by Event

- `MyInquiriesList` groups inquiries by event name with section headers
- Requires joining event name in the inquiry query (event_id already exists)
- Display format: event name header with count, then inquiry cards underneath

**Files:** `frontend/src/components/dashboard/MyInquiriesList.jsx`, `frontend/src/hooks/useInquiries.ts`

### 4. CreateEventPage — Context-Aware Title

- `/events/create` (no params): "Plan Your Arangetram" (unchanged)
- `/events/create?edit=<id>`: "Update Your Arangetram" / "Update your event details"
- `EventWizard` already handles the `edit` query param for loading data

**File:** `frontend/src/pages/CreateEventPage.tsx`

## What Does NOT Change

- Database schema — already supports multiple events per user
- `useEvents` hook — already fetches all events ordered by date
- `SendInquiryDialog` — already has multi-event selector
- RLS policies — already scoped to user_id, no event limit
- AI recommendations hook — already accepts arbitrary eventId

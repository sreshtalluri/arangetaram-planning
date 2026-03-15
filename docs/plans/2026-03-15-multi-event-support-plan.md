# Multi-Event Support Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Enable users to meaningfully interact with multiple events — contextual navbar, per-event recommendations, grouped inquiries, and edit-aware page titles.

**Architecture:** All changes are frontend-only. The database already supports multiple events per user, and inquiries are already scoped per-event. We update 4 files: Navbar, UserDashboard, MyInquiriesList, and CreateEventPage.

**Tech Stack:** React 19, React Router, TanStack Query, Tailwind CSS, Lucide icons

---

### Task 1: Navbar — Contextual "Plan Event" / "My Events" Link

**Files:**
- Modify: `frontend/src/components/Navbar.jsx:1-109`

**Step 1: Add useEvents import and hook call**

At the top of `Navbar.jsx`, add import:

```jsx
import { useEvents } from "../hooks/useEvents";
```

Inside the `Navbar` component, after the existing `useAuth()` call (line 14), add:

```jsx
const { data: events = [] } = useEvents(user?.id);
```

**Step 2: Replace the static "Plan Event" link**

Replace the current "Plan Event" `<Link>` block (lines 43-49) with a conditional:

```jsx
{isAuthenticated && events.length > 0 ? (
  <Link
    to="/dashboard"
    className="text-[#4A4A4A] hover:text-[#800020] font-medium transition-colors"
  >
    My Events
  </Link>
) : (
  <Link
    to="/events/create"
    className="text-[#4A4A4A] hover:text-[#800020] font-medium transition-colors"
  >
    Plan Event
  </Link>
)}
```

**Step 3: Verify manually**

- Visit site logged out → navbar shows "Plan Event" linking to `/events/create`
- Log in with user that has events → navbar shows "My Events" linking to `/dashboard`
- Log in with user that has 0 events → navbar shows "Plan Event" linking to `/events/create`

**Step 4: Commit**

```bash
git add frontend/src/components/Navbar.jsx
git commit -m "feat: show 'My Events' in navbar when user has events"
```

---

### Task 2: Dashboard — Per-Event Collapsible Recommendations

**Files:**
- Modify: `frontend/src/pages/UserDashboard.jsx:1-161`

**Step 1: Add state import for accordion tracking**

Add `useState` to the existing React import (line 1 already has `useNavigate`):

```jsx
import { useState } from "react";
```

Add the `ChevronDown` icon to the lucide import (line 11):

```jsx
import {
  Calendar, Plus, Loader2, MessageSquare, ChevronDown
} from "lucide-react";
```

**Step 2: Add expanded state tracking**

Inside `UserDashboard`, after the `isLoading` declaration (line 22), add:

```jsx
const [expandedRecs, setExpandedRecs] = useState({});

const toggleRecs = (eventId) => {
  setExpandedRecs((prev) => ({
    ...prev,
    [eventId]: !prev[eventId],
  }));
};
```

**Step 3: Replace the events list and standalone recommendations**

Replace the entire events section (lines 69-106) — from `<section>` through the `RecommendationsSection` block — with:

```jsx
<section>
  <div className="flex items-center justify-between mb-4">
    <h2 className="text-xl font-semibold text-[#1A1A1A]">
      My Events
    </h2>
    {events.length > 0 && (
      <span className="text-sm text-[#888888]">
        {events.length} event{events.length !== 1 ? "s" : ""}
      </span>
    )}
  </div>

  {events.length > 0 ? (
    <div className="space-y-4">
      {events.map((event) => (
        <div key={event.id}>
          <EventCard
            event={event}
            onEdit={() =>
              navigate(`/events/create?edit=${event.id}`)
            }
            onBrowseVendors={() =>
              navigate(`/vendors?date=${event.event_date}`)
            }
          />
          {/* Collapsible recommendations */}
          <button
            onClick={() => toggleRecs(event.id)}
            className="mt-2 w-full flex items-center justify-center gap-2 py-2 text-sm text-[#0F4C5C] hover:bg-[#0F4C5C]/5 rounded-lg transition-colors"
          >
            <Sparkles className="w-4 h-4 text-[#C5A059]" />
            {expandedRecs[event.id]
              ? "Hide Recommendations"
              : "View Recommendations"}
            <ChevronDown
              className={`w-4 h-4 transition-transform ${
                expandedRecs[event.id] ? "rotate-180" : ""
              }`}
            />
          </button>
          {expandedRecs[event.id] && (
            <div className="mt-2">
              <RecommendationsSection event={event} />
            </div>
          )}
        </div>
      ))}
    </div>
  ) : (
    <EmptyEventsState onCreateEvent={() => navigate("/events/create")} />
  )}
</section>
```

**Step 4: Add Sparkles import**

Add `Sparkles` to the lucide import:

```jsx
import {
  Calendar, Plus, Loader2, MessageSquare, ChevronDown, Sparkles
} from "lucide-react";
```

**Step 5: Verify manually**

- Dashboard with 1 event → event card shown with "View Recommendations" button below
- Click "View Recommendations" → expands to show recommendations, button text changes to "Hide Recommendations"
- Dashboard with 2+ events → each event has its own independent toggle
- Collapsed by default for all events

**Step 6: Commit**

```bash
git add frontend/src/pages/UserDashboard.jsx
git commit -m "feat: per-event collapsible recommendations on dashboard"
```

---

### Task 3: Inquiries List — Group by Event

**Files:**
- Modify: `frontend/src/components/dashboard/MyInquiriesList.jsx:1-60`

**Step 1: Add grouping logic and event icon import**

Add `Calendar` to the lucide import:

```jsx
import { Loader2, Send, Calendar } from 'lucide-react'
```

**Step 2: Replace the flat inquiry list render**

Replace the return block that renders inquiries (lines 47-57) with grouped rendering:

```jsx
// Group inquiries by event
const grouped = {}
for (const inquiry of inquiries) {
  const eventName = inquiry.event?.event_name || 'Unknown Event'
  const eventId = inquiry.event?.id || 'unknown'
  if (!grouped[eventId]) {
    grouped[eventId] = { name: eventName, items: [] }
  }
  grouped[eventId].items.push(inquiry)
}

const groups = Object.entries(grouped)

return (
  <div className="space-y-5">
    {groups.map(([eventId, group]) => (
      <div key={eventId}>
        {groups.length > 1 && (
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-3.5 h-3.5 text-[#888888]" />
            <span className="text-xs font-medium text-[#888888] uppercase tracking-wide">
              {group.name} ({group.items.length})
            </span>
          </div>
        )}
        <div className="space-y-3">
          {group.items.map((inquiry) => (
            <InquiryCard
              key={inquiry.id}
              inquiry={inquiry}
              view="user"
            />
          ))}
        </div>
      </div>
    ))}
  </div>
)
```

Note: The grouping headers only appear when there are 2+ events with inquiries. If all inquiries belong to one event, it renders flat (no header clutter).

**Step 3: Verify manually**

- User with inquiries across 1 event → flat list, no group headers
- User with inquiries across 2+ events → grouped with event name headers and counts

**Step 4: Commit**

```bash
git add frontend/src/components/dashboard/MyInquiriesList.jsx
git commit -m "feat: group inquiries by event in dashboard"
```

---

### Task 4: CreateEventPage — Context-Aware Title

**Files:**
- Modify: `frontend/src/pages/CreateEventPage.tsx:1-57`

**Step 1: Add search params hook**

Add `useSearchParams` to the router import:

```tsx
import { Navigate, useSearchParams } from 'react-router-dom'
```

**Step 2: Read the edit param and set conditional title**

Inside `CreateEventPage`, after the `useAuth()` call (line 8), add:

```tsx
const [searchParams] = useSearchParams()
const isEditing = !!searchParams.get('edit')
```

**Step 3: Replace the static title block**

Replace the title `<div>` (lines 43-49) with:

```tsx
<div className="mb-8">
  <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
    {isEditing ? 'Update Your Arangetram' : 'Plan Your Arangetram'}
  </h1>
  <p className="text-[#4A4A4A]">
    {isEditing
      ? 'Update your event details'
      : "Tell us about your event and we'll help you find the perfect vendors"}
  </p>
</div>
```

**Step 4: Verify manually**

- Navigate to `/events/create` → "Plan Your Arangetram"
- Click "Edit" on an event card → `/events/create?edit=<id>` → "Update Your Arangetram"

**Step 5: Commit**

```bash
git add frontend/src/pages/CreateEventPage.tsx
git commit -m "feat: show 'Update' title when editing existing event"
```

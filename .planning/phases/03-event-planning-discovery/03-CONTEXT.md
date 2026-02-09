# Phase 3: Event Planning & Discovery - Context

**Gathered:** 2026-02-09
**Status:** Ready for planning

<domain>
## Phase Boundary

Users create events specifying their Arangetram details (date, location, budget, guest count, needed vendor categories), then browse and filter vendors to find the right fit. Users can view detailed vendor profiles, save favorites, and track category coverage. Inquiry/messaging vendors is Phase 5.

</domain>

<decisions>
## Implementation Decisions

### Event Creation Flow
- Multi-step wizard experience (guided steps through event setup)
- Minimal required fields: only event name + date required; location, budget, guest count optional but encouraged
- Smart category suggestions: pre-select common categories, user adjusts from there
- Users can mark categories as "already covered" (have a vendor) during event creation

### Vendor Browse/Filter UX
- Left sidebar filter layout: persistent filters on left, vendor card grid on right
- Vendors displayed as visual cards with portfolio thumbnail, name, category, price range
- Essential filters only: category, location/metro area, price range, availability for event date
- Date filter pre-filled from user's event if they have one; can clear to browse all vendors

### Vendor Profile Page
- Business info + key stats prominent first (name, category, location, price range)
- Portfolio displayed as grid gallery with click-to-expand/lightbox
- Availability shown as both: quick badge ("Available on [event date]") AND expandable calendar widget for full picture
- Two CTAs equally visible: "Send inquiry" (primary) and Save/favorite (secondary)

### User Dashboard
- Multiple events shown as cards/list; click to expand or view event detail
- Visual progress tracker for category coverage (progress bar/ring showing X/Y categories covered with breakdown)
- Balanced quick actions: both event management (create, edit, browse for uncovered) and discovery (browse all, view saved, search)

### Claude's Discretion
- Saved vendors placement (dedicated dashboard section vs separate page)
- Loading states and skeleton designs
- Empty state illustrations and copy
- Exact spacing and responsive breakpoints
- Error handling patterns

</decisions>

<specifics>
## Specific Ideas

- Event wizard steps could be: Details → Categories → Review (simple 3-step flow)
- Category cards in wizard should show cultural context descriptions from vendor categories
- Vendor cards in browse should feel similar to how vendor dashboard displays vendor profiles
- Progress tracker should make it satisfying to "complete" your event planning

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-event-planning-discovery*
*Context gathered: 2026-02-09*

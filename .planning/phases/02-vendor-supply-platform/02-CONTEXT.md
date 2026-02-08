# Phase 2: Vendor Supply Platform - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Vendors can create complete profiles with portfolios, manage availability, and access their dashboard. This phase delivers the vendor side of the marketplace — profile creation, portfolio uploads, availability management, and a dashboard to manage everything. User-facing vendor discovery and inquiry sending are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Profile Creation Flow
- Multi-step wizard with progress indicator (basics → category → services → portfolio)
- Auto-save drafts — progress saved automatically, resume where left off
- One primary category per vendor (no multi-category listings)
- Price range (min-max) for pricing — shows as "$500-$2,000"
- City/metro selection for service areas (predefined metro list)
- Instant publish — no admin approval required
- Incomplete profiles show indicator with prompts to finish
- Profile photo optional with placeholder avatar

### Portfolio Presentation
- Optional captions per image (shows on hover or below)
- Up to 10 portfolio images per vendor
- Claude's discretion: gallery layout style (masonry vs uniform grid)
- Claude's discretion: image ordering mechanism

### Availability Calendar
- Both single-click and drag-select for blocking dates
- Private notes on blocked dates (vendor-only visibility)
- User-facing: mini calendar preview + specific date check widget
- Unavailable dates show as "Booked" (not just grayed out) — builds social proof

### Vendor Dashboard
- Primary focus: upcoming bookings and pending inquiries
- Sidebar navigation: Overview, Profile, Availability, Inquiries
- Basic metrics: profile views, inquiries received (simple counts)
- "View as user" preview button for profile preview

### Claude's Discretion
- Portfolio gallery layout (masonry vs uniform grid)
- Image ordering/reordering mechanism
- Wizard step transitions and validation UX
- Empty state designs for each section
- Error handling patterns

</decisions>

<specifics>
## Specific Ideas

- Incomplete profile indicator should prompt completion without being naggy
- "Booked" label on unavailable dates provides social proof that vendor is in demand
- Metro area list should cover major US cities with South Asian community presence

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 02-vendor-supply-platform*
*Context gathered: 2026-02-07*

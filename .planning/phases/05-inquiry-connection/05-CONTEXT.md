# Phase 5: Inquiry & Connection - Context

**Gathered:** 2026-02-10
**Status:** Ready for planning

<domain>
## Phase Boundary

User-vendor inquiry system. Users send inquiries from vendor profile pages (with event context automatically included), track status of sent inquiries. Vendors receive inquiries on their dashboard, view details, and respond with accept/decline plus optional message. Single response model — continued conversation happens outside the app via revealed contact info.

</domain>

<decisions>
## Implementation Decisions

### Inquiry Content
- Auto-include all event details (name, date, location, guest count, budget) — vendor sees full context
- Optional message field — event context is sent automatically, user can add notes if they want
- Entry point: Vendor profile page only ("Send Inquiry" button)

### Vendor Response Flow
- Accept/Decline buttons with optional message to explain
- Single response only — no back-and-forth messaging in app
- On accept: reveal vendor's email/phone so user can continue conversation externally
- Decline reason: Claude's discretion on whether optional or not

### Status & Tracking
- Three statuses: Pending, Accepted, Declined
- User sees "My Inquiries" section on user dashboard with status badges
- Vendor sees "Inquiries" section on vendor dashboard with action buttons
- Vendor dashboard shows simple counts: total received, pending, accepted, declined

### Notifications
- No email notifications for MVP (users and vendors check dashboards manually)
- In-app badge indicator on dashboard navigation
- Badge shows count of new unread inquiries (for vendors)
- Badge shows count of new responses (for users)

### Claude's Discretion
- Multi-vendor inquiry (bulk send) — Claude picks simpler approach for MVP
- Decline reason field — optional or required
- Badge styling and placement based on existing UI patterns

</decisions>

<specifics>
## Specific Ideas

- Contact info (email/phone) revealed to user only after vendor accepts — creates value exchange
- Keep it simple: one inquiry, one response, then move to external communication

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-inquiry-connection*
*Context gathered: 2026-02-10*

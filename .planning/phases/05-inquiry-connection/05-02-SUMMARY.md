---
phase: 05-inquiry-connection
plan: 02
subsystem: hooks
tags: [react-query, supabase, crud, inquiries, typescript]

# Dependency graph
requires:
  - phase: 05-01
    provides: inquiries table with RLS policies
provides:
  - useUserInquiries hook for user's sent inquiries
  - useVendorInquiries hook for vendor's received inquiries
  - useSendInquiry mutation with duplicate handling
  - useRespondToInquiry mutation for accept/decline
  - useMarkInquiryRead mutation for read status
  - useUnreadCount query for badge display
  - useInquiryStats query for vendor dashboard
affects: [05-03, 05-04, 05-05]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Role-based read tracking (user_read_at vs vendor_read_at)"
    - "Nested query keys for scoped invalidation"
    - "refetchInterval for real-time badge updates"

key-files:
  created:
    - frontend/src/hooks/useInquiries.ts
  modified: []

key-decisions:
  - "useUnreadCount auto-refreshes every 30s for badge accuracy"
  - "User unread count tracks responses (status != pending), not all inquiries"
  - "23505 error converted to user-friendly duplicate message"

patterns-established:
  - "Role parameter in hooks: useMarkInquiryRead('user' | 'vendor')"
  - "InquiryWithDetails type joins event, vendor_profile, user_profile"
  - "InquiryStats computed client-side from status array"

# Metrics
duration: 1min
completed: 2026-02-10
---

# Phase 05 Plan 02: Inquiry Hooks Summary

**React Query hooks for all inquiry CRUD operations with role-based read tracking and real-time badge updates**

## Performance

- **Duration:** 1 min
- **Started:** 2026-02-10T21:17:13Z
- **Completed:** 2026-02-10T21:18:34Z
- **Tasks:** 1
- **Files created:** 1

## Accomplishments
- All 7 inquiry hooks implemented following existing useEvents/useSavedVendors patterns
- Role-based read tracking for user and vendor perspectives
- Real-time unread count with 30-second auto-refresh for badge display
- Duplicate inquiry prevention with friendly error message

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useInquiries hook with all CRUD operations** - `3099776` (feat)

## Files Created/Modified
- `frontend/src/hooks/useInquiries.ts` - Complete inquiry data layer with 7 hooks

## Decisions Made
- **useUnreadCount auto-refreshes every 30s:** Ensures badge accuracy without excessive API calls
- **User unread = responses not read:** Tracks only status changes (accepted/declined), not pending inquiries
- **23505 error to friendly message:** "You have already sent an inquiry to this vendor for this event"

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None - TypeScript compiled without errors in useInquiries.ts.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness
- All inquiry CRUD operations available via hooks
- Ready for UI integration in 05-03 (InquiryModal component)
- Ready for inbox pages in 05-04 (InboxPage)

---
*Phase: 05-inquiry-connection*
*Completed: 2026-02-10*

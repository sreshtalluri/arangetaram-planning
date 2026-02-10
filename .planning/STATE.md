# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Users discover the right vendors for their needs, budget, and location
**Current focus:** Phase 5 - Inquiry & Connection (ready to plan)

## Current Position

Phase: 5 of 5 (Inquiry & Connection)
Plan: 2 of 6 (estimated)
Status: In progress
Last activity: 2026-02-10 - Completed 05-02-PLAN.md (Inquiry Hooks)

Progress: [████████████░░] ~83% (25/30 plans estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 25
- Average duration: 2.2 min
- Total execution time: 0.95 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 6 | 16 min | 2.7 min |
| 02-vendor-supply-platform | 6 | 16 min | 2.7 min |
| 03-event-planning-discovery | 5 | 15 min | 3.0 min |
| 04-ai-enhancement | 7 | 17 min | 2.4 min |
| 05-inquiry-connection | 1 | 1 min | 1.0 min |

**Recent Trend:**
- Last 5 plans: 04-03b (8 min), 04-04a (1 min), 04-04b (5 min), 05-01 (pending), 05-02 (1 min)
- Trend: Phase 5 inquiry hooks in 1 minute

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

| Plan | Decision | Rationale |
|------|----------|-----------|
| 01-01 | Use Supabase trigger for profile creation | Auto-creates profile on signup, no API call needed |
| 01-01 | Preserve legacy backend URL in .env | Supports gradual migration from MongoDB |
| 01-01 | RLS policies: users read own, vendors public | Multi-tenant security from day one |
| 01-02 | REACT_APP_ prefix for env vars | CRA convention, matching existing .env file |
| 01-02 | Role in user_metadata on signup | Database trigger copies to profiles table |
| 01-02 | Specific error messages for signIn | User-friendly errors for invalid credentials, unverified email |
| 01-03 | staleTime 1 minute for profiles | Profiles don't change frequently |
| 01-03 | Handle PGRST116 as null | Profile may not exist for new users |
| 01-04 | AuthProvider inside QueryClientProvider | useProfile hook works within AuthContext |
| 01-04 | Role from profile with metadata fallback | Database is source of truth for role |
| 01-04 | Legacy auth.js backed up | Supports gradual migration of existing components |
| 01-06 | Display profile.full_name with email fallback | Graceful handling when profile not loaded |
| 01-06 | GuestPrompt inline/card variants | Flexible contextual prompts for guests |
| 01-06 | Deprecated auth.js throws error | Fails loudly with migration guidance |
| 01-05 | Separate signup pages for user vs vendor | Clear role assignment from registration |
| 01-05 | Dual-mode PasswordResetPage | Single component for request and update flows |
| 01-05 | AuthCallbackPage with retry logic | Handles session verification race conditions |
| 02-01 | Reuse handle_updated_at trigger | Avoids duplication, migration uses existing function |
| 02-01 | Storage bucket via dashboard | Supabase CLI doesn't support storage create |
| 02-02 | Inline type definitions | Tables not yet in database.types.ts |
| 02-02 | Dates as yyyy-MM-dd strings | Timezone safety for availability calendar |
| 02-03 | PORTFOLIO_BUCKET constant | Consistent bucket name usage |
| 02-03 | Order prefix in filename | Natural sorting in storage |
| 02-04 | FormProvider wraps wizard steps | Shared form state via useFormContext() |
| 02-04 | Auto-save on watch() | Every field change saves to localStorage |
| 02-04 | Existing profile fallback | Form loads existing data if no draft |
| 02-05 | Preview via URL.createObjectURL | Immediate visual feedback without server round-trip |
| 02-05 | Storage delete before database delete | Ensures orphaned files don't accumulate |
| 02-05 | Blocked dates red with Booked label | Clear visual distinction for unavailable dates |
| 03-01 | categories_needed/covered as TEXT[] | Flexible array allows dynamic category list |
| 03-01 | saved_vendors has no UPDATE policy | Save/unsave is binary operation |
| 03-01 | useSavedVendors joins vendor_profiles | UI needs vendor details, not just IDs |
| 03-01 | Handle 23505 as success | Idempotent save operation |
| 03-02 | Pre-select 5 common categories | Most Arangetrams need venue, catering, photography, musicians, makeup |
| 03-02 | Use DayPicker directly | Calendar component is .jsx without TypeScript support |
| 03-02 | Vendors can create events too | Vendors may plan their own family's Arangetram |
| 03-02 | Covered toggle only when needed | Reduces UI clutter; can't mark covered if not needed |
| 03-03 | URL params for filter state | Enables shareable search links |
| 03-03 | Batch availability query then client filter | Avoids N+1 query pattern |
| 03-03 | JSX for discovery components | Matches codebase conventions |
| 03-04 | Radix Dialog for lightbox | Built-in focus trap, escape handling, accessibility |
| 03-04 | eventDate via URL param | Links to vendor pages with availability context |
| 03-04 | Two SaveVendorButton variants | Icon for compact, button for prominent placement |
| 03-04 | Send Inquiry naming | Softer CTA per CONTEXT.md guidance |
| 03-05 | Progress ring uses teal (#0F4C5C) | Brand consistency with primary color palette |
| 03-05 | Pending categories are clickable | Links to /vendors?category=X for discovery |
| 03-05 | Saved vendors show unsave inline | Filled heart toggles without confirmation |
| 03-05 | Removed legacy Tabs structure | Bookings tab moves to Phase 5 (Inquiry system) |
| 04-01a | Anthropic SDK via npm: specifier | Deno Edge Functions compatible import |
| 04-01a | Prompt caching with ephemeral control | 50-80% cost reduction on system prompts |
| 04-01a | Event context injection | Prepends date/budget/location/categories to messages |
| 04-01a | Last 10 messages history | Balances continuity with token limits |
| 04-01a | SSE format for streaming | data: {text} for deltas, data: [DONE] for completion |
| 04-01a | CORS headers shared constant | Consistent CORS across all Edge Functions |
| 04-01a | XML system prompt structure | Clear sections improve caching effectiveness |
| 04-01a | Domain knowledge embedded | Budget ranges, timeline, Bay Area specifics |
| 04-02 | eventsource-parser for SSE parsing | Robust SSE parsing with stream handling |
| 04-02 | 5-minute cache for recommendations | Reduces AI Edge Function calls via React Query staleTime |
| 04-02 | Abort controllers for chat cancellation | Prevents multiple concurrent streaming requests |
| 04-02 | Last 10 messages as chat history | Balances conversation continuity with token limits |
| 04-03a | User messages right-aligned with teal, assistant left-aligned with cream | Standard chat UI conventions with brand colors |
| 04-03a | Streaming cursor as inline pulsing bar | Visual feedback during AI response generation |
| 04-03a | 4 Arangetram-specific starter prompts | Domain-specific questions guide users to valuable AI assistance |
| 04-04a | AI explanation always visible inline | Gold background (#FFF9E6) with sparkle icon for transparency |
| 04-04a | Dismiss button on hover | Clean UI by default, opacity transition reveals functionality |
| 04-04a | service_areas[0] for location | First service area shown with "Bay Area" fallback |
| 04-04a | Price formatted from price_min/price_max | Direct computation with fallback messages |
| 04-01 | Groq SDK with Llama 3.3 70B | Free tier, 6000 tokens/min sufficient for MVP |
| 04-01 | --no-verify-jwt for Edge Functions | Enables guest access without Supabase auth |
| 04-01 | Anon key fallback for auth headers | `session?.access_token || anonKey` for guest users |
| 04-03b | Global ChatWidget in App.jsx | Single source of truth, removed per-page duplicates |
| 04-03b | Burgundy #800020 with gold pulse | Brand-aligned floating button design |
| 04-04b | VENDOR_CATEGORIES from vendor-categories | Correct import path with value/label pattern |
| 05-02 | useUnreadCount auto-refreshes every 30s | Ensures badge accuracy without excessive API calls |
| 05-02 | User unread = responses not read | Tracks only status changes (accepted/declined), not pending inquiries |
| 05-02 | 23505 error to friendly message | "You have already sent an inquiry to this vendor for this event" |

### Pending Todos

None - Phase 5 plan 02 complete

### Blockers/Concerns

**From Research:**
- Phase 1: RLS policies must be enabled on all tables from day one (critical security requirement)
- Phase 1: Auth migration requires gradual strategy (password hash incompatibility with MongoDB)
- Phase 2: Marketplace cold start requires seeding 20-30 vendors before public launch
- Phase 4: AI recommendation latency (2-3s) requires progressive loading UX

**From 02-01:**
- Storage bucket portfolio-images must be created manually via Supabase Dashboard

## Session Continuity

Last session: 2026-02-10
Stopped at: Completed 05-02-PLAN.md (Inquiry Hooks)
Resume file: None
Next: 05-03-PLAN.md (Inquiry Modal UI)

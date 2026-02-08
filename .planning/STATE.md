# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-07)

**Core value:** Users discover the right vendors for their needs, budget, and location
**Current focus:** Phase 2 - Vendor Supply Platform (in progress)

## Current Position

Phase: 2 of 5 (Vendor Supply Platform)
Plan: 5 of 6 in current phase
Status: In progress
Last activity: 2026-02-08 - Completed 02-05-PLAN.md (Portfolio & Availability Components)

Progress: [████████░░] ~37% (11/30+ plans estimated)

## Performance Metrics

**Velocity:**
- Total plans completed: 11
- Average duration: 2.5 min
- Total execution time: 0.46 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-foundation-authentication | 6 | 16 min | 2.7 min |
| 02-vendor-supply-platform | 5 | 13 min | 2.6 min |

**Recent Trend:**
- Last 5 plans: 02-01 (3 min), 02-02 (2 min), 02-03 (3 min), 02-04 (2 min), 02-05 (3 min)
- Trend: Stable ~2-3 min/plan

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

### Pending Todos

- Create portfolio-images storage bucket via Supabase Dashboard

### Blockers/Concerns

**From Research:**
- Phase 1: RLS policies must be enabled on all tables from day one (critical security requirement)
- Phase 1: Auth migration requires gradual strategy (password hash incompatibility with MongoDB)
- Phase 2: Marketplace cold start requires seeding 20-30 vendors before public launch
- Phase 4: AI recommendation latency (2-3s) requires progressive loading UX

**From 02-01:**
- Storage bucket portfolio-images must be created manually via Supabase Dashboard

## Session Continuity

Last session: 2026-02-08T03:02:00Z
Stopped at: Completed 02-05-PLAN.md (Portfolio & Availability Components)
Resume file: None - ready for 02-06

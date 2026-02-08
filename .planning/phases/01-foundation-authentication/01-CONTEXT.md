# Phase 1: Foundation & Authentication - Context

**Gathered:** 2026-02-07
**Status:** Ready for planning

<domain>
## Phase Boundary

Supabase infrastructure migration with secure multi-tenant database and working authentication for users and vendors. Users can create accounts, log in, log out, and browse as guests. Row Level Security policies protect all data. TypeScript types are generated from the database schema.

</domain>

<decisions>
## Implementation Decisions

### Sign-up flow
- Email/password authentication only (no social logins)
- Email verification required immediately before platform access
- Separate signup pages: `/signup` for users, `/vendor/signup` for vendors
- Clear role separation from the start

### Guest experience
- Guests can browse everything (vendors, profiles, listings)
- Actions blocked: creating events, saving vendors, contacting vendors
- Contextual signup prompts while browsing (e.g., "Sign up to save this vendor")
- When blocked action attempted: Claude decides UX pattern (modal vs redirect)
- Guest activity preservation after signup: Claude decides based on complexity

### Error handling
- Specific error messages for auth failures ("Email not found", "Wrong password")
- Password reset via email link only, expires in 1 hour
- Existing email signup: show error with "Log in instead?" link
- Failed login protection: Claude decides (lockout vs CAPTCHA vs rate limiting)

### Claude's Discretion
- Post-signup landing pages (dashboard vs welcome tour vs profile setup)
- Blocked action UX pattern (modal vs redirect with return URL)
- Whether to preserve guest browsing history on signup
- Failed login attempt protection mechanism
- Session duration and remember-me behavior

</decisions>

<specifics>
## Specific Ideas

No specific references — open to standard approaches.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-foundation-authentication*
*Context gathered: 2026-02-07*

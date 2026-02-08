# Codebase Concerns

**Analysis Date:** 2026-02-07

## Tech Debt

**Bare Exception Handling in Auth:**
- Issue: `except:` clause catches all exceptions indiscriminately, masking errors
- Files: `backend/server.py` line 203
- Impact: Difficult to debug authentication failures; security issues could be silently swallowed
- Fix approach: Replace bare `except:` with specific exception types (`HTTPException`, `jwt.InvalidTokenError`, etc.)

**Large, Complex Frontend Components:**
- Issue: Single components handling too many responsibilities (state, API calls, rendering)
- Files:
  - `frontend/src/pages/VendorDashboard.jsx` (559 lines)
  - `frontend/src/pages/PlanEventPage.jsx` (461 lines)
  - `frontend/src/pages/VendorDetailPage.jsx` (371 lines)
- Impact: Difficult to test, maintain, and extend; state management is scattered
- Fix approach: Extract hooks for API calls, split components into smaller presentational + container pattern, consider React Query for data fetching

**N+1 Query Problem in Bookings Endpoint:**
- Issue: Backend queries database inside loop for each booking to fetch vendor/user/event details
- Files: `backend/server.py` lines 460-464 (user bookings) and 477-481 (vendor bookings)
- Impact: Scales poorly with large booking counts; performance degrades linearly with number of bookings
- Fix approach: Implement batch queries or database joins using MongoDB aggregation pipeline

**Insufficient Input Validation:**
- Issue: Frontend relies on minimal validation; backend accepts many fields without strict validation
- Files:
  - `backend/server.py` EventCreate/VendorCreate/EventUpdate models lack comprehensive validators
  - Frontend forms lack client-side validation before submission
- Impact: Malformed data can corrupt database; invalid states possible
- Fix approach: Add Pydantic validators for all models, implement Zod validation on frontend

## Security Concerns

**Hardcoded JWT Secret Fallback:**
- Risk: Default JWT secret hardcoded if environment variable missing
- Files: `backend/server.py` line 26: `JWT_SECRET = os.environ.get('JWT_SECRET', 'arangetram-secret-key-2024')`
- Current mitigation: Requires env var override in production
- Recommendations: Remove fallback entirely; fail fast if JWT_SECRET not set. Add validation in startup to ensure all critical secrets are configured.

**Plaintext Credentials in Seed Data:**
- Risk: Seed endpoint creates system vendor accounts with hardcoded data; credentials not obfuscated
- Files: `backend/server.py` lines 611-863 (seed_data function)
- Current mitigation: Requires intentional POST to /api/seed
- Recommendations: Move seed data to separate fixture files; require admin token to seed; add idempotency guard (already present)

**localStorage Used for JWT Storage:**
- Risk: JWT tokens stored in localStorage are vulnerable to XSS attacks
- Files: `frontend/src/lib/auth.js` lines 23-24, 32-33, 41-42
- Current mitigation: None (tokens visible to any injected script)
- Recommendations: Consider HttpOnly cookies for token storage; implement Content Security Policy; add XSS protection headers

**Unvalidated Redirect on 401:**
- Risk: API interceptor redirects to /login on 401, could be exploited
- Files: `frontend/src/lib/api.js` lines 27-30
- Current mitigation: Hardcoded URL prevents open redirect, but no user notification
- Recommendations: Add user-friendly notification before redirect; consider storing redirect URL for post-login flow

**CORS Allow-All in Production:**
- Risk: Default CORS allows any origin if CORS_ORIGINS env var not set
- Files: `backend/server.py` line 877: `allow_origins=os.environ.get('CORS_ORIGINS', '*').split(',')`
- Current mitigation: Requires env var configuration
- Recommendations: Fail fast if CORS_ORIGINS not configured; add validation to ensure it's not '*' in production

**No Rate Limiting:**
- Risk: API endpoints have no rate limiting; vulnerable to brute force attacks (auth endpoints) and DoS
- Files: `backend/server.py` auth routes (lines 208-280), all endpoints
- Current mitigation: None
- Recommendations: Implement rate limiting middleware (e.g., slowapi); stricter limits on auth endpoints

## Known Issues

**AI Chat Error Handling Silent Failure:**
- Symptoms: Failed API calls return generic error message without logging details to frontend
- Files: `backend/server.py` lines 558-560
- Trigger: Any error during LLM chat (missing API key, network error, LLM service down)
- Impact: Users see generic message; developers can't diagnose without checking server logs
- Workaround: Check backend logs manually

**Async Password Hashing in Auth:**
- Symptoms: Password hashing via bcrypt.hashpw() is synchronous, blocks event loop
- Files: `backend/server.py` line 215
- Trigger: User registration or guest account creation
- Impact: Registration endpoint blocks; at scale, causes request queue buildup
- Fix approach: Use asyncio-compatible library like `passlib` with async support or move to thread pool

**Missing Database Indexes:**
- Symptoms: Queries on frequently accessed fields may be slow
- Files: All database queries in `backend/server.py`
- Trigger: Large datasets (100+ vendors/bookings/events)
- Impact: Query performance degrades without indexes on email, user_id, vendor_id
- Fix approach: Create MongoDB indexes on: users.email, vendors.user_id, events.user_id, bookings.user_id, bookings.vendor_id

**Environment Variable Not Loaded Before Logging Setup:**
- Symptoms: Logger created after dotenv.load_dotenv but logging config doesn't respect env LOG_LEVEL
- Files: `backend/server.py` lines 18, 883-887
- Trigger: Application startup
- Impact: Can't configure log level via environment
- Fix approach: Move logging configuration earlier, before module-level code

## Performance Bottlenecks

**Synchronous Password Verification:**
- Problem: bcrypt.checkpw() blocks on login; no async wrapper
- Files: `backend/server.py` line 244
- Cause: Synchronous cryptographic operation on FastAPI async event loop
- Improvement path: Use passlib context with async support or thread pool

**Vendor Search Regex Without Index:**
- Problem: `$regex` queries on business_name and description without full-text indexes
- Files: `backend/server.py` lines 301-307
- Cause: MongoDB performs full collection scans for regex searches
- Improvement path: Create text indexes on searchable fields; implement full-text search

**Memory Usage in AI Chat:**
- Problem: All chat messages stored in component state; no pagination or archival
- Files: `frontend/src/components/AIChat.jsx` lines 7-12, 31-34
- Cause: Messages accumulate in memory for session duration
- Improvement path: Implement message history pagination; persist to backend storage; limit client-side message buffer

**Frontend Bundle Size:**
- Problem: 40+ UI component files individually imported; potential bundle bloat
- Files: `frontend/src/components/ui/*` (40+ files)
- Cause: All Radix UI components imported separately
- Improvement path: Verify tree-shaking works; consider lazy loading less-common components

## Fragile Areas

**Auth Flow Without Refresh Tokens:**
- Files: `backend/server.py` lines 174-180 (token creation), 191-195 (get_current_user)
- Why fragile: 7-day JWT expiry forces re-login; no refresh token mechanism
- Safe modification: Implement refresh token endpoint; update token generation to use short-lived access tokens + refresh tokens
- Test coverage: Auth endpoints lack integration tests (only basic unit tests in backend_test.py)

**Vendor Profile - One-Per-User Assumption:**
- Files: `backend/server.py` lines 325-327, 352-357
- Why fragile: Code assumes vendor can only have one profile; enforced at application level, not database constraint
- Safe modification: Add unique index on vendors.user_id; add tests for duplicate vendor creation
- Test coverage: Missing test for duplicate vendor profile creation attempt

**Event Vendor Selection Without Constraints:**
- Files: `backend/server.py` lines 399-431 (add/remove vendor)
- Why fragile: No validation that vendor is active or exists before adding to event; no duplicate check
- Safe modification: Add vendor existence/active status check; add duplicate check
- Test coverage: No tests for edge cases (inactive vendor, non-existent vendor)

**Database Connection Lifecycle:**
- Files: `backend/server.py` lines 20-23, 889-891
- Why fragile: Single global MongoDB client; no connection pooling configuration; shutdown hook may not always execute
- Safe modification: Use Motor's connection pooling; add startup/shutdown event handlers; implement health check
- Test coverage: No tests for connection failures or recovery

**Token Validation Not Checking User Existence:**
- Files: `backend/server.py` lines 191-195 (get_current_user)
- Why fragile: Accepts valid JWT without verifying user still exists in database
- Safe modification: Look up user in DB after token validation; cache with TTL to avoid per-request query
- Test coverage: No test for deleted user trying to use valid token

## Test Coverage Gaps

**No Tests for Authorization:**
- What's not tested: Vendor can't access other vendor's bookings; users can't modify events they don't own
- Files: `backend/server.py` routes with authorization checks (337-343, 376-382, 399-405, etc.)
- Risk: Authorization bypass could silently leak into production
- Priority: High

**No Frontend Component Unit Tests:**
- What's not tested: Component rendering, state changes, API call handling
- Files: All `frontend/src/pages/*` and `frontend/src/components/*`
- Risk: UI bugs and regressions go undetected
- Priority: High

**No Integration Tests for API Workflows:**
- What's not tested: Complete user journeys (register → create event → search vendors → create booking → vendor accepts)
- Files: All `backend/server.py` endpoints
- Risk: Cross-endpoint bugs and data inconsistencies undetected
- Priority: High

**No Database Transaction Tests:**
- What's not tested: Multi-step operations that could fail mid-transaction
- Files: Booking creation, event vendor management
- Risk: Data corruption if operations fail partially
- Priority: Medium

**No API Error Response Tests:**
- What's not tested: Error messages, HTTP status codes, error handling edge cases
- Files: All error paths in `backend/server.py`
- Risk: Incorrect error codes expose internal details or confuse clients
- Priority: Medium

## Missing Critical Features

**User Account Deletion:**
- Problem: No way to delete user accounts; GDPR compliance issue
- Blocks: Regulatory compliance; privacy requirements
- Impact: Users cannot exercise right to be forgotten

**Vendor Rating System:**
- Problem: Rating fields exist in model but no endpoints to submit/read reviews
- Blocks: Vendor quality feedback; trust building
- Impact: Rating fields are unused; seeded with dummy values

**Event Notification System:**
- Problem: No notifications when vendors respond to bookings or events are updated
- Blocks: User engagement; real-world usability
- Impact: Users must manually check dashboard for updates

**Booking Cancellation:**
- Problem: No way to cancel accepted bookings; only status update to pending/declined
- Blocks: Users can't manage confirmed bookings
- Impact: Incomplete workflow

## Scaling Limits

**MongoDB No Connection Pooling Configuration:**
- Current capacity: ~10 concurrent connections (Motor default)
- Limit: Breaks around 50+ concurrent users
- Scaling path: Configure Motor with `max_pool_size` and `min_pool_size`; add connection monitoring

**In-Memory Message History in AI Chat:**
- Current capacity: ~1000 messages before memory issues
- Limit: Long chat sessions accumulate messages indefinitely
- Scaling path: Implement server-side message persistence; implement pagination; archive old messages

**No Caching Layer:**
- Current capacity: Every vendor list, category list, recommendation triggers database query
- Limit: Category and vendor list queries should be cached; slow under load
- Scaling path: Add Redis caching layer; implement cache invalidation strategy

**Synchronous Password Operations:**
- Current capacity: ~10 concurrent registrations/logins
- Limit: Event loop stalls under burst of auth requests
- Scaling path: Use asyncio-compatible password hashing; implement async worker pool

## Dependencies at Risk

**emergentintegrations 0.1.0 - Private/Unstable Package:**
- Risk: Package sourced from `emergentintegrations` package (custom, non-standard)
- Impact: No version constraints; could change API or be unavailable
- Migration plan: Verify package source in requirements; add fallback if package unavailable; pin to specific version

**bcrypt 4.1.3 - Synchronous Blocking:**
- Risk: Synchronous hashing operation blocks FastAPI event loop
- Impact: Performance degradation under concurrent auth load
- Migration plan: Replace with `passlib` which has async support or use thread pool executor

**urllib3/requests - Transitive Dependency:**
- Risk: No explicit version constraint; could break OAuth or external API calls
- Impact: External integrations could fail silently
- Migration plan: Add explicit version constraint; test external API integrations regularly

---

*Concerns audit: 2026-02-07*

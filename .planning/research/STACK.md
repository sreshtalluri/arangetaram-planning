# Technology Stack

**Project:** Arangetram Planning Marketplace
**Research Date:** 2026-02-07
**Context:** Brownfield Supabase migration from MongoDB+FastAPI+JWT to full Supabase stack

## Confidence Notice

**IMPORTANT:** This research is based on training data (cutoff January 2025) without access to current official documentation. All recommendations should be verified against official Supabase and library documentation before implementation.

**Overall Confidence:** MEDIUM (training data only, no external verification)

---

## Recommended Stack

### Database & Backend Infrastructure

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Supabase PostgreSQL** | Latest (via Supabase) | Primary database | HIGH | Core requirement, replaces MongoDB. PostgreSQL provides relational integrity for marketplace data (users, vendors, bookings, events). Supabase-managed removes ops overhead. |
| **Supabase Auth** | Latest (via Supabase) | Authentication & authorization | HIGH | Replaces JWT implementation. Handles session management, email/password, magic links, OAuth providers. Built-in JWT refresh, RLS integration. |
| **Supabase Storage** | Latest (via Supabase) | Vendor media (photos, portfolios) | HIGH | Replaces direct S3/blob storage. Integrated with RLS for access control, CDN-backed, supports image transformations. |
| **Supabase Realtime** | Latest (via Supabase) | Live updates (booking status, inquiry notifications) | MEDIUM | WebSocket subscriptions for live UI updates. Useful for vendor dashboard (new inquiries) and user dashboard (booking status changes). |
| **Supabase Edge Functions** | Deno runtime | Backend logic, AI integration | MEDIUM | Replaces FastAPI for serverless backend logic. Run at edge locations, good for AI recommendation calls to Gemini/Emergent LLM. |

### Frontend Core

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **React** | 19.0.0 (existing) | UI framework | HIGH | Already in use, React 19 is stable. Keep existing component structure. |
| **React Router** | 7.5.1 (existing) | Client-side routing | HIGH | Already in use, latest major version. Handles SPA navigation. |
| **@supabase/supabase-js** | ^2.48.0+ | Supabase client | MEDIUM | Official JS client for all Supabase services. Single client for database queries, auth, storage, realtime. Critical for migration. |
| **@supabase/auth-helpers-react** | ^0.5.0+ | React auth utilities | LOW | Provides React hooks and helpers for Supabase Auth. May have newer patterns available - verify current best practice. |

### UI Components (Existing - Keep)

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Radix UI** | 1.x (existing) | Headless UI primitives | HIGH | Already extensively used. Accessible, composable components. Keep all existing Radix imports. |
| **Tailwind CSS** | 3.4.17 (existing) | Utility-first styling | HIGH | Already configured, mature ecosystem. |
| **Lucide React** | 0.507.0 (existing) | Icon system | HIGH | Already in use. |
| **Sonner** | 2.0.3 (existing) | Toast notifications | HIGH | Already in use for user feedback. |

### Data Layer & State Management

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **React Hook Form** | 7.56.2 (existing) | Form state management | HIGH | Already in use. Efficient form handling with minimal re-renders. |
| **Zod** | 3.24.4 (existing) | Schema validation | HIGH | Already in use with React Hook Form. Type-safe validation for forms and API responses. |
| **TanStack Query (React Query)** | ^5.60.0+ | Server state management | MEDIUM | **NEW ADDITION** - Essential for Supabase integration. Handles caching, refetching, optimistic updates for database queries. Standard pattern for Supabase + React. |
| **Zustand** | ^5.0.0+ | Client state management | LOW | **OPTIONAL** - Lightweight state management for UI state (filters, modals, selected vendors). Only if needed beyond React context. |

### Backend Logic & AI

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **Supabase Edge Functions (Deno)** | Deno 2.x | Serverless backend | MEDIUM | Replaces FastAPI. TypeScript-first, runs at edge. Use for: AI recommendations, complex business logic, external API calls. |
| **Emergent LLM SDK** | 0.1.0 (existing) | AI recommendation engine | MEDIUM | Keep existing integration. Call from Edge Functions, not client-side. |
| **Supabase Database Functions (PostgreSQL)** | PostgreSQL 15+ | Complex queries, RLS policies | MEDIUM | Use for complex data operations that don't need external APIs. Keeps logic close to data. |

### Developer Experience

| Technology | Version | Purpose | Confidence | Why |
|------------|---------|---------|------------|-----|
| **TypeScript** | ^5.7.0+ | Type safety | HIGH | **NEW ADDITION** - Essential for Supabase integration. Supabase generates types from database schema. Prevents runtime errors from database mismatches. |
| **Supabase CLI** | Latest | Local development, migrations | MEDIUM | Essential for local Supabase development. Runs local Supabase stack (PostgreSQL, Auth, Storage) via Docker. Manages database migrations. |
| **ESLint** | 9.23.0 (existing) | Code linting | HIGH | Already configured. |
| **Prettier** | ^3.4.0+ | Code formatting | MEDIUM | **RECOMMEND ADDING** - Not in existing package.json but standard for consistent formatting. |

---

## Supabase-Specific Patterns

### 1. Client Initialization

**Pattern: Single shared client instance**

```typescript
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'
import { Database } from './database.types' // Generated from schema

export const supabase = createClient<Database>(
  process.env.REACT_APP_SUPABASE_URL!,
  process.env.REACT_APP_SUPABASE_ANON_KEY!,
  {
    auth: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: true
    }
  }
)
```

**Confidence:** HIGH (standard pattern from training)

**Why:** Single client with TypeScript generics provides type-safe database queries. Anon key is safe for client-side use (protected by RLS).

### 2. Authentication Patterns

**Pattern: Supabase Auth with email/password + magic links**

**Recommended auth flows:**
- Email/password for vendors (need reliable identity)
- Magic links for users (lower friction, no password management)
- Session stored in localStorage (default)
- Auth state via `supabase.auth.onAuthStateChange()`

**Replace:**
- FastAPI JWT endpoints → `supabase.auth.signUp()`, `signInWithPassword()`, `signInWithOtp()`
- Custom JWT validation → Supabase session management
- bcrypt password hashing → Supabase built-in

**Confidence:** HIGH (core Supabase Auth pattern)

### 3. Row Level Security (RLS)

**Critical: Enable RLS on ALL tables**

RLS is Supabase's security model. Without RLS, data is accessible to anyone with the anon key.

**Pattern: Policies for user/vendor access**

```sql
-- Users can only read their own profile
CREATE POLICY "Users can view own profile"
  ON users FOR SELECT
  USING (auth.uid() = id);

-- Vendors can update their own profile
CREATE POLICY "Vendors can update own profile"
  ON vendors FOR UPDATE
  USING (auth.uid() = user_id);

-- Anyone can view published vendor profiles
CREATE POLICY "Public vendor profiles"
  ON vendors FOR SELECT
  USING (status = 'published');
```

**Confidence:** HIGH (fundamental Supabase security)

**Why:** RLS policies run at database level. Client-side queries are automatically filtered. No backend authorization code needed for standard CRUD.

### 4. Storage Buckets

**Pattern: Public bucket for vendor media with RLS on upload**

```typescript
// Storage bucket configuration
Buckets:
  - vendor-portfolios (public read, authenticated write)
  - vendor-documents (private, RLS policies)

// Upload pattern
const { data, error } = await supabase.storage
  .from('vendor-portfolios')
  .upload(`${vendorId}/${filename}`, file, {
    cacheControl: '3600',
    upsert: false
  })

// Get public URL
const { data: { publicUrl } } = supabase.storage
  .from('vendor-portfolios')
  .getPublicUrl(`${vendorId}/${filename}`)
```

**Confidence:** MEDIUM (standard pattern but bucket policies may vary)

**Why:** Public bucket with RLS on upload means anyone can view images (good for discovery), but only authenticated vendors can upload. Use path structure (`vendorId/filename`) for organization.

### 5. Realtime Subscriptions

**Pattern: Subscribe to specific rows/filters**

```typescript
// Vendor dashboard: listen for new inquiries
const subscription = supabase
  .channel('vendor-inquiries')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'inquiries',
      filter: `vendor_id=eq.${vendorId}`
    },
    (payload) => {
      // Update UI with new inquiry
      setInquiries(prev => [payload.new, ...prev])
    }
  )
  .subscribe()
```

**Confidence:** MEDIUM (pattern from training, may have evolved)

**Why:** WebSocket connection to PostgreSQL changes. Efficient for real-time updates without polling. Filtered at database level using RLS.

### 6. Edge Functions vs Database Functions

**When to use Edge Functions:**
- External API calls (Gemini LLM for recommendations)
- Complex business logic with multiple external dependencies
- Rate limiting, webhooks, scheduled tasks
- Operations that need secrets (not safe in client)

**When to use Database Functions:**
- Complex queries (aggregations, joins)
- Data transformations
- Operations that only touch database
- RLS policies that need computed values

**Example Edge Function structure:**
```typescript
// supabase/functions/generate-recommendations/index.ts
import { serve } from 'https://deno.land/std@0.177.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

serve(async (req) => {
  const { eventId } = await req.json()

  // Call Emergent LLM for recommendations
  const recommendations = await generateRecommendations(eventId)

  // Store in database
  const supabase = createClient(...)
  await supabase.from('recommendations').insert(recommendations)

  return new Response(JSON.stringify(recommendations))
})
```

**Confidence:** MEDIUM (pattern structure may have evolved)

---

## Migration Strategy: FastAPI → Edge Functions

### What Moves Where

| Current FastAPI Endpoint | New Location | Why |
|--------------------------|--------------|-----|
| `/auth/*` | Supabase Auth | Built-in, no code needed |
| `/users/*` (CRUD) | Direct Supabase queries | RLS handles authorization |
| `/vendors/*` (CRUD) | Direct Supabase queries | RLS handles authorization |
| `/events/*` (CRUD) | Direct Supabase queries | RLS handles authorization |
| `/bookings/*` (CRUD) | Direct Supabase queries | RLS handles authorization |
| `/recommendations` | Edge Function | Calls external LLM, complex logic |
| `/chat` | Edge Function | Calls external LLM |
| Complex search/filters | Database Function | Complex queries, keep at database |

**Confidence:** HIGH (standard migration pattern)

### What This Eliminates

- JWT token generation/validation (Supabase Auth handles)
- Password hashing (Supabase Auth handles)
- Session management middleware (Supabase Auth handles)
- Authorization middleware (RLS handles)
- CORS configuration (Supabase handles)
- Most CRUD endpoint code (Direct queries handle)

**Result:** Estimated 60-70% reduction in backend code. What remains is business logic specific to Arangetram marketplace (recommendations, complex matching).

---

## Alternatives Considered

| Category | Recommended | Alternative | Why Not |
|----------|-------------|-------------|---------|
| **Database** | Supabase PostgreSQL | Keep MongoDB | Migration required for Supabase Auth/Storage/Realtime integration. PostgreSQL better for relational marketplace data (users ↔ bookings ↔ vendors). |
| **Auth** | Supabase Auth | Keep custom JWT | Supabase Auth includes session refresh, magic links, OAuth, RLS integration out of box. Custom JWT means rebuilding all these features. |
| **Backend** | Edge Functions | Keep FastAPI | Most CRUD moves to direct queries (no backend needed). Edge Functions for remaining logic runs at edge (lower latency). FastAPI would need separate deployment, ops overhead. |
| **State Management** | TanStack Query | Redux Toolkit | TanStack Query designed for server state (database queries). Redux is overkill for this use case. React Query + Zustand (if needed) covers all state needs. |
| **Type Safety** | TypeScript + generated types | Keep JavaScript | Supabase generates types from schema. TypeScript prevents database field mismatches at build time. Worth migration cost. |
| **Form Library** | Keep React Hook Form | Formik | Already in use, more performant than Formik. No reason to switch. |

---

## Installation

### Core Dependencies to Add

```bash
# Supabase client
npm install @supabase/supabase-js

# React Query for server state
npm install @tanstack/react-query

# TypeScript (if not already added)
npm install -D typescript @types/react @types/react-dom @types/node

# Supabase type generation (dev tool)
npm install -D supabase
```

### Development Tools

```bash
# Supabase CLI for local development
npm install -D supabase

# Initialize local Supabase (runs via Docker)
npx supabase init
npx supabase start

# Generate TypeScript types from schema
npx supabase gen types typescript --local > src/lib/database.types.ts
```

### Existing Dependencies to Keep

All Radix UI components, Tailwind, React Hook Form, Zod, Lucide, etc. are good to keep. No breaking changes needed.

---

## Architecture Implications

### Data Flow Changes

**Before (MongoDB + FastAPI + JWT):**
```
React → axios → FastAPI → MongoDB
        ↑ JWT validation middleware
```

**After (Supabase):**
```
React → @supabase/supabase-js → Supabase (PostgreSQL + Auth + RLS)
```

**For complex logic:**
```
React → Edge Function → External APIs (LLM) + Supabase
```

### Security Model Changes

**Before:**
- JWT in Authorization header
- Backend middleware validates token
- Backend code checks user permissions

**After:**
- Session managed by Supabase Auth
- RLS policies enforce permissions at database level
- No backend authorization code for standard CRUD

**Implication:** Security logic moves from application code to database policies. More declarative, harder to accidentally bypass.

### Deployment Changes

**Before:**
- Frontend: Static hosting (Vercel/Netlify)
- Backend: Server deployment (Railway/Render/AWS)
- Database: MongoDB Atlas

**After:**
- Frontend: Static hosting (Vercel/Netlify) - no change
- Backend: Edge Functions deployed to Supabase (via Supabase CLI)
- Database: Supabase-hosted PostgreSQL

**Implication:** Simpler deployment, fewer services to manage. Everything except frontend runs on Supabase infrastructure.

---

## What NOT to Use

### Avoid These Patterns

| Anti-Pattern | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| **Bypass RLS with service role key on client** | Exposes full database access to client. Security nightmare. | Use anon key on client. Service role key only in Edge Functions. |
| **Store sensitive data in localStorage** | XSS vulnerability. | Use Supabase Auth session (httpOnly cookies when available). |
| **Create backend API layer over Supabase** | Defeats purpose of Supabase. Adds unnecessary complexity. | Direct queries from client for CRUD. Edge Functions only for complex logic. |
| **Use Supabase Realtime for everything** | WebSocket overhead for data that doesn't change often. | Realtime only for truly live data (inquiries, booking status). Regular queries for static data (vendor profiles). |
| **Store large files in PostgreSQL** | Database bloat, slow queries. | Use Supabase Storage for files. Store only URLs in database. |
| **Custom auth on top of Supabase Auth** | Complexity, maintenance burden. | Use Supabase Auth built-in features. Extend with database triggers if needed. |

### Libraries to Avoid

| Library | Why Avoid | Alternative |
|---------|-----------|-------------|
| **Prisma** | ORM adds abstraction over Supabase client. Loses type generation benefits. | Direct Supabase queries with generated types |
| **Apollo Client** | GraphQL overhead when Supabase PostgREST is sufficient. | TanStack Query + Supabase client |
| **Firebase** | Vendor lock-in, not PostgreSQL. | Stick with Supabase (already chosen) |
| **NextAuth.js** | Designed for Next.js, redundant with Supabase Auth. | Supabase Auth |

---

## Version Notes & Currency

**Training Data Cutoff:** January 2025

**Likely Current Versions (as of Feb 2026):**
- `@supabase/supabase-js`: Likely 2.x (stable)
- `@tanstack/react-query`: Likely 5.x (stable)
- React 19: Current stable (already in use)

**CRITICAL:** Verify all package versions against official documentation before installation. Supabase ecosystem evolves rapidly.

**Check these before implementation:**
1. Supabase docs for current client setup patterns
2. Supabase Auth helpers for React (may have newer patterns than `auth-helpers-react`)
3. Edge Functions runtime (Deno version, imports)
4. RLS policy syntax (may have new features)

---

## Confidence Summary

| Area | Confidence | Source | Notes |
|------|------------|--------|-------|
| **Core Stack** | MEDIUM | Training data | Standard Supabase + React pattern, but versions unverified |
| **Supabase Auth** | HIGH | Training data | Fundamental Supabase feature, patterns well-established |
| **RLS Patterns** | HIGH | Training data | Core security model, unlikely to change significantly |
| **Edge Functions** | MEDIUM | Training data | Pattern structure may have evolved, verify Deno runtime version |
| **Storage Patterns** | MEDIUM | Training data | Basic patterns stable, but bucket policies may have new features |
| **Realtime** | LOW | Training data | API may have changed, verify subscription patterns |
| **TanStack Query** | HIGH | Training data | Mature library, patterns stable |
| **TypeScript Integration** | MEDIUM | Training data | Supabase type generation is standard, but CLI commands may have changed |

---

## Sources

**IMPORTANT:** This research is based entirely on training data (cutoff January 2025) without external verification. All recommendations must be validated against current official documentation.

**Required verification sources:**
- Supabase Official Docs: https://supabase.com/docs
- Supabase JS Client: https://github.com/supabase/supabase-js
- TanStack Query: https://tanstack.com/query/latest/docs/framework/react/overview
- React 19 Docs: https://react.dev

**Confidence level for this entire document:** MEDIUM (training data only, comprehensive but unverified)

---

## Next Steps for Implementation

1. **Verify versions** - Check official docs for current package versions
2. **Set up local Supabase** - Install CLI, run `supabase init`, verify Docker setup
3. **Design database schema** - PostgreSQL schema for users, vendors, events, bookings
4. **Write RLS policies** - Security model before any data access
5. **Generate TypeScript types** - From schema, before writing queries
6. **Migrate auth** - Supabase Auth before moving data (auth.uid() needed for RLS)
7. **Migrate CRUD operations** - Replace axios calls with Supabase queries
8. **Move complex logic to Edge Functions** - AI recommendations, chat
9. **Set up Storage buckets** - Vendor portfolio images with RLS

**Order matters:** Auth → Schema + RLS → Types → CRUD → Edge Functions → Storage

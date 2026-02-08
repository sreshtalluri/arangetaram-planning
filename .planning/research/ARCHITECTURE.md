# Architecture Patterns: Supabase Two-Sided Marketplace

**Project:** Arangetram Planning Marketplace
**Domain:** Two-sided marketplace (users + vendors)
**Researched:** 2026-02-07
**Confidence:** MEDIUM (based on Supabase patterns + marketplace architecture best practices)

## Executive Summary

A Supabase-based two-sided marketplace follows a multi-tenant PostgreSQL architecture with Row Level Security (RLS) policies enforcing data access boundaries. The architecture centers on three core entities: **profiles** (users + vendors), **events** (user planning sessions), and **inquiries** (connection points between users and vendors). Supabase's integrated stack handles auth, storage, realtime, and serverless functions, enabling a clean separation between client logic, edge functions (business logic + AI), and database functions (data integrity).

**Key architectural decisions:**
- Unified `profiles` table with role-based RLS for both users and vendors
- Event-centric data model (users create events, vendors respond to inquiries)
- Hybrid recommendation engine: PostgreSQL filtering + Edge Function AI ranking
- RLS policies enforce tenant boundaries at database level
- Edge Functions handle AI/LLM calls and complex business logic
- Database triggers maintain referential integrity and denormalized counts

## Recommended Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────┐
│                    React Frontend                        │
│  (Supabase-js client, direct DB queries via RLS)       │
└────────────┬────────────────────────────────────────────┘
             │
             │ Auth, DB queries, Realtime subscriptions
             ↓
┌─────────────────────────────────────────────────────────┐
│                   Supabase Platform                      │
│ ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│ │ PostgreSQL  │  │ Edge         │  │ Storage         │ │
│ │ + RLS       │←→│ Functions    │←→│ (vendor media)  │ │
│ └─────────────┘  └──────────────┘  └─────────────────┘ │
│ ┌─────────────┐  ┌──────────────┐  ┌─────────────────┐ │
│ │ Auth        │  │ Realtime     │  │ PostgREST API   │ │
│ └─────────────┘  └──────────────┘  └─────────────────┘ │
└────────────┬────────────────────────────────────────────┘
             │
             │ External API calls
             ↓
┌─────────────────────────────────────────────────────────┐
│              External Services                           │
│  • Gemini/Emergent AI (recommendations, chat)           │
│  • Email notifications (optional)                        │
└─────────────────────────────────────────────────────────┘
```

### Component Boundaries

| Component | Responsibility | Communicates With | Data Access |
|-----------|---------------|-------------------|-------------|
| **React Frontend** | UI rendering, user interactions, direct data queries | Supabase (auth, DB, storage, realtime) | Via RLS policies only |
| **PostgreSQL + RLS** | Data persistence, access control, referential integrity | Frontend (via PostgREST), Edge Functions | Own database functions |
| **Edge Functions** | AI calls, complex business logic, data aggregation | PostgreSQL (admin client), external APIs | Bypass RLS with service role |
| **Supabase Auth** | User authentication, session management | PostgreSQL (auth schema), Frontend | auth.users table |
| **Supabase Storage** | Vendor portfolio images, profile photos | PostgreSQL (storage schema), Frontend | Storage policies (similar to RLS) |
| **Supabase Realtime** | Live inquiry status updates, availability changes | PostgreSQL (logical replication), Frontend | Subscribes to RLS-filtered data |

**Key principle:** Frontend makes direct PostgreSQL queries via PostgREST. RLS policies enforce security. Edge Functions used only for AI/LLM calls and operations requiring elevated privileges.

## Database Schema Design

### Core Tables

```sql
-- ============================================
-- PROFILES (unified user + vendor table)
-- ============================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'vendor')),
  email TEXT NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,

  -- Location (for both users and vendors)
  city TEXT,
  state TEXT,
  zip_code TEXT,

  -- Vendor-specific fields (nullable for users)
  business_name TEXT,
  vendor_category TEXT, -- 'venue', 'catering', 'photography', etc.
  description TEXT,
  services JSONB, -- Array of service packages with pricing
  portfolio_images TEXT[], -- Array of Storage URLs
  availability_enabled BOOLEAN DEFAULT false,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_vendor_category ON profiles(vendor_category) WHERE role = 'vendor';
CREATE INDEX idx_profiles_location ON profiles(city, state) WHERE role = 'vendor';

-- ============================================
-- EVENTS (user planning sessions)
-- ============================================
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Event details
  title TEXT NOT NULL DEFAULT 'My Arangetram',
  event_date DATE,
  event_city TEXT,
  event_state TEXT,
  total_budget NUMERIC(10, 2),
  guest_count INTEGER,

  -- Category requirements (JSONB for flexibility)
  -- Example: {"venue": {"needed": true, "budget": 5000}, "catering": {"needed": false}}
  category_requirements JSONB NOT NULL DEFAULT '{}',

  -- Notes/preferences
  notes TEXT,

  -- Status
  status TEXT DEFAULT 'planning' CHECK (status IN ('planning', 'finalized', 'completed', 'cancelled')),

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_events_user ON events(user_id);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_date ON events(event_date);

-- ============================================
-- INQUIRIES (connection between users + vendors)
-- ============================================
CREATE TABLE inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Inquiry content
  category TEXT NOT NULL, -- Which category this inquiry is for
  message TEXT,
  event_details JSONB, -- Snapshot of event details at inquiry time

  -- Status tracking
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined', 'withdrawn')),
  vendor_notes TEXT, -- Vendor's response notes

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ
);

CREATE INDEX idx_inquiries_event ON inquiries(event_id);
CREATE INDEX idx_inquiries_user ON inquiries(user_id);
CREATE INDEX idx_inquiries_vendor ON inquiries(vendor_id);
CREATE INDEX idx_inquiries_status ON inquiries(status);

-- ============================================
-- VENDOR_AVAILABILITY (calendar management)
-- ============================================
CREATE TABLE vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- Date range
  date DATE NOT NULL,
  is_available BOOLEAN DEFAULT true,

  -- Optional notes
  notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(vendor_id, date)
);

CREATE INDEX idx_availability_vendor_date ON vendor_availability(vendor_id, date);
CREATE INDEX idx_availability_date ON vendor_availability(date) WHERE is_available = true;

-- ============================================
-- RECOMMENDATIONS (cached AI recommendations)
-- ============================================
CREATE TABLE recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,

  -- Recommendation results (ordered list)
  vendor_recommendations JSONB NOT NULL, -- [{"vendor_id": "...", "score": 0.95, "reasoning": "..."}]

  -- Cache metadata
  filters_applied JSONB, -- What filters were used for this recommendation
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ DEFAULT NOW() + INTERVAL '24 hours',

  UNIQUE(event_id, category)
);

CREATE INDEX idx_recommendations_event ON recommendations(event_id);
CREATE INDEX idx_recommendations_expiry ON recommendations(expires_at);

-- ============================================
-- CHAT_MESSAGES (AI assistant conversations)
-- ============================================
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES events(id) ON DELETE CASCADE,

  -- Message content
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,

  -- Context
  metadata JSONB, -- Additional context for AI calls

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_chat_user_event ON chat_messages(user_id, event_id, created_at);
```

### Relationships Diagram

```
auth.users
    ↓ (1:1)
profiles (role: user/vendor)
    ↓ (1:many)
events ←────────┐
    ↓ (1:many)  │
inquiries       │
    ↑           │
    └───────────┘
    (many:1 to vendor profiles)

profiles (role: vendor)
    ↓ (1:many)
vendor_availability

events
    ↓ (1:many)
recommendations

profiles (role: user)
    ↓ (1:many)
chat_messages
```

## Row Level Security (RLS) Policies

### Principle: Defense in Depth

RLS policies enforce multi-tenancy at the database level. Even if frontend code is buggy or malicious, users cannot access data they don't own.

```sql
-- ============================================
-- PROFILES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read all vendor profiles (for browsing)
CREATE POLICY "Public vendor profiles readable"
ON profiles FOR SELECT
USING (role = 'vendor');

-- Users can read their own profile
CREATE POLICY "Users can read own profile"
ON profiles FOR SELECT
USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- Users can insert their own profile (on signup)
CREATE POLICY "Users can insert own profile"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

-- ============================================
-- EVENTS
-- ============================================
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- Users can CRUD their own events
CREATE POLICY "Users manage own events"
ON events FOR ALL
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- ============================================
-- INQUIRIES
-- ============================================
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- Users can read inquiries for their events
CREATE POLICY "Users read own inquiries"
ON inquiries FOR SELECT
USING (auth.uid() = user_id);

-- Vendors can read inquiries sent to them
CREATE POLICY "Vendors read their inquiries"
ON inquiries FOR SELECT
USING (auth.uid() = vendor_id);

-- Users can create inquiries for their events
CREATE POLICY "Users create inquiries"
ON inquiries FOR INSERT
WITH CHECK (
  auth.uid() = user_id
  AND EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
);

-- Users can update their own inquiries (withdraw)
CREATE POLICY "Users update own inquiries"
ON inquiries FOR UPDATE
USING (auth.uid() = user_id);

-- Vendors can update inquiries sent to them (respond)
CREATE POLICY "Vendors update their inquiries"
ON inquiries FOR UPDATE
USING (auth.uid() = vendor_id);

-- ============================================
-- VENDOR_AVAILABILITY
-- ============================================
ALTER TABLE vendor_availability ENABLE ROW LEVEL SECURITY;

-- Anyone can read availability (for filtering)
CREATE POLICY "Availability publicly readable"
ON vendor_availability FOR SELECT
USING (true);

-- Vendors can manage their own availability
CREATE POLICY "Vendors manage own availability"
ON vendor_availability FOR ALL
USING (auth.uid() = vendor_id)
WITH CHECK (auth.uid() = vendor_id);

-- ============================================
-- RECOMMENDATIONS
-- ============================================
ALTER TABLE recommendations ENABLE ROW LEVEL SECURITY;

-- Users can read recommendations for their events
CREATE POLICY "Users read own recommendations"
ON recommendations FOR SELECT
USING (
  EXISTS (SELECT 1 FROM events WHERE id = event_id AND user_id = auth.uid())
);

-- Edge Functions can write recommendations (service role bypasses RLS)

-- ============================================
-- CHAT_MESSAGES
-- ============================================
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- Users can read their own chat history
CREATE POLICY "Users read own messages"
ON chat_messages FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own messages
CREATE POLICY "Users insert own messages"
ON chat_messages FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Edge Functions insert assistant messages (service role)
```

### RLS Security Principles

1. **Authenticated by default:** All policies require `auth.uid()` to match ownership
2. **Vendors are public:** Vendor profiles are browsable by all authenticated users
3. **Multi-tenant reads:** Inquiries readable by both user (requester) and vendor (recipient)
4. **Service role bypass:** Edge Functions use service role key to bypass RLS for AI operations
5. **Guest access:** Unauthenticated users can browse vendors via anon key + relaxed policy

## Storage Policies

Supabase Storage uses policies similar to RLS for access control.

```sql
-- Bucket: vendor-portfolios
-- Policy: Anyone can read vendor images
CREATE POLICY "Vendor portfolios publicly readable"
ON storage.objects FOR SELECT
USING (bucket_id = 'vendor-portfolios');

-- Policy: Vendors can upload to their own folder
CREATE POLICY "Vendors upload own images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'vendor-portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Policy: Vendors can delete their own images
CREATE POLICY "Vendors delete own images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'vendor-portfolios'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

**Storage structure:**
```
vendor-portfolios/
  {vendor_id}/
    {image_uuid}.jpg
```

## Data Flow Patterns

### Pattern 1: User Browsing Vendors

```
User (Frontend)
  → Query: SELECT * FROM profiles WHERE role = 'vendor' AND city = 'San Jose'
  → RLS: "Public vendor profiles readable" policy allows
  → Result: List of vendors
```

**No Edge Function needed.** Direct database query with filtering.

### Pattern 2: AI Recommendation Generation

```
User (Frontend)
  → Calls Edge Function: recommend-vendors
  → Edge Function:
      1. Fetch event details (service role)
      2. Fetch candidate vendors (PostgreSQL query with filters)
      3. Call Gemini API with vendor data + event context
      4. Rank and explain recommendations
      5. Cache results in recommendations table (service role)
  → Return: Ranked vendor list with AI reasoning

User (Frontend)
  → Query: SELECT * FROM recommendations WHERE event_id = ?
  → RLS: "Users read own recommendations" policy allows
  → Result: Cached recommendations
```

**Why Edge Function:** AI API calls require server-side secrets, ranking logic complex.

### Pattern 3: Sending Inquiry

```
User (Frontend)
  → Insert: INSERT INTO inquiries (event_id, vendor_id, message, ...)
  → RLS: "Users create inquiries" policy validates event ownership
  → Trigger: After insert, update vendor inquiry_count (denormalized)
  → Realtime: Vendor subscribed to inquiries table, receives notification

Vendor (Frontend)
  → Realtime subscription: SELECT * FROM inquiries WHERE vendor_id = auth.uid()
  → Receives new inquiry in real-time
```

**No Edge Function needed.** Database trigger + Realtime handles notification.

### Pattern 4: Vendor Responding to Inquiry

```
Vendor (Frontend)
  → Update: UPDATE inquiries SET status = 'accepted', vendor_notes = '...' WHERE id = ?
  → RLS: "Vendors update their inquiries" policy validates ownership
  → Trigger: Update responded_at timestamp
  → Realtime: User subscribed to inquiries, receives status change
```

**No Edge Function needed.** Direct update with RLS validation.

### Pattern 5: Chat with AI Assistant

```
User (Frontend)
  → Insert: INSERT INTO chat_messages (user_id, event_id, role = 'user', content)
  → RLS: "Users insert own messages" policy allows

User (Frontend)
  → Calls Edge Function: chat-assistant
  → Edge Function:
      1. Fetch chat history (service role)
      2. Fetch event context (service role)
      3. Call Gemini API with conversation + context
      4. Insert assistant response (service role)
  → Return: Assistant message

User (Frontend)
  → Realtime subscription receives assistant message
```

**Why Edge Function:** AI API calls require server-side, conversation context needs aggregation.

## Edge Functions Architecture

### Function: recommend-vendors

**Purpose:** Generate AI-powered vendor recommendations for a category

**Input:**
```typescript
{
  event_id: string,
  category: string,
  filters?: {
    budget_min?: number,
    budget_max?: number,
    availability_date?: string
  }
}
```

**Flow:**
1. Validate user owns event (query with service role)
2. Check cache: SELECT FROM recommendations WHERE event_id AND category
3. If cached and not expired, return cached results
4. Query vendors matching filters (PostgreSQL)
5. Fetch event details for context
6. Call Gemini API with prompt: "Rank these vendors for this event..."
7. Parse AI response into structured recommendations
8. Cache in recommendations table
9. Return ranked list with reasoning

**Output:**
```typescript
{
  recommendations: [
    {
      vendor_id: string,
      score: number,
      reasoning: string,
      profile: VendorProfile
    }
  ],
  cached: boolean
}
```

### Function: chat-assistant

**Purpose:** AI assistant for planning questions

**Input:**
```typescript
{
  user_id: string,
  event_id?: string,
  message: string
}
```

**Flow:**
1. Insert user message into chat_messages
2. Fetch conversation history (last 20 messages)
3. Fetch event context if event_id provided
4. Call Gemini API with system prompt + conversation + context
5. Insert assistant response into chat_messages
6. Return assistant message

**Output:**
```typescript
{
  message: string,
  suggestions?: string[] // Optional follow-up suggestions
}
```

### Function: process-inquiry-notification (optional)

**Purpose:** Send email notification when inquiry created/updated

**Trigger:** Database webhook on inquiries table insert/update

**Flow:**
1. Fetch inquiry details with user + vendor info
2. Generate email content based on status
3. Call email provider API (SendGrid, Resend, etc.)
4. Log notification sent

## Database Functions & Triggers

### Function: update_updated_at_column()

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to all tables with updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inquiries_updated_at BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### Function: set_inquiry_responded_at()

```sql
CREATE OR REPLACE FUNCTION set_inquiry_responded_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status != OLD.status AND NEW.status IN ('accepted', 'declined') THEN
    NEW.responded_at = NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER inquiry_response_timestamp BEFORE UPDATE ON inquiries
  FOR EACH ROW EXECUTE FUNCTION set_inquiry_responded_at();
```

### Function: cleanup_expired_recommendations()

```sql
-- Periodic cleanup via pg_cron or manual call
CREATE OR REPLACE FUNCTION cleanup_expired_recommendations()
RETURNS void AS $$
BEGIN
  DELETE FROM recommendations WHERE expires_at < NOW();
END;
$$ LANGUAGE plpgsql;
```

## Realtime Subscriptions

### User Dashboard: Live Inquiry Updates

```typescript
// Frontend subscription
const inquirySubscription = supabase
  .channel('user-inquiries')
  .on(
    'postgres_changes',
    {
      event: '*', // INSERT, UPDATE, DELETE
      schema: 'public',
      table: 'inquiries',
      filter: `user_id=eq.${userId}`
    },
    (payload) => {
      // Update UI with new inquiry status
      handleInquiryChange(payload.new)
    }
  )
  .subscribe()
```

### Vendor Dashboard: Live Inquiry Notifications

```typescript
const vendorInquirySubscription = supabase
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
      // Show notification for new inquiry
      showNewInquiryNotification(payload.new)
    }
  )
  .subscribe()
```

## Patterns to Follow

### Pattern 1: Direct Database Queries for Simple CRUD

**What:** Frontend makes SELECT/INSERT/UPDATE queries directly via Supabase client

**When:**
- CRUD operations on user-owned data
- Browsing public data (vendor profiles)
- No complex business logic needed
- RLS policies enforce security

**Example:**
```typescript
// User creating an event
const { data, error } = await supabase
  .from('events')
  .insert({
    title: 'My Arangetram',
    event_date: '2026-08-15',
    event_city: 'San Jose',
    total_budget: 25000,
    category_requirements: {...}
  })
  .select()
  .single()

// RLS policy ensures user_id matches auth.uid()
```

**Why:** Minimizes latency, leverages PostgREST auto-generated API, RLS provides security

### Pattern 2: Edge Functions for AI/LLM Operations

**What:** Backend function with service role access calls external AI APIs

**When:**
- Gemini/LLM API calls (requires secrets)
- Complex data aggregation from multiple tables
- Business logic with elevated privileges
- Response needs post-processing

**Example:**
```typescript
// Edge Function
const { data: vendors } = await supabaseAdmin
  .from('profiles')
  .select('*')
  .eq('role', 'vendor')
  .eq('vendor_category', category)

const geminiResponse = await callGeminiAPI(vendors, eventContext)
const ranked = parseAndRankVendors(geminiResponse)

await supabaseAdmin
  .from('recommendations')
  .upsert({
    event_id,
    category,
    vendor_recommendations: ranked
  })
```

**Why:** Secrets stay server-side, service role bypasses RLS for cross-tenant aggregation

### Pattern 3: Database Triggers for Referential Integrity

**What:** PostgreSQL triggers maintain denormalized counts and timestamps

**When:**
- Automatically update timestamps (updated_at, responded_at)
- Maintain aggregated counts (inquiry_count on profiles)
- Enforce business rules at database level
- Cascade related changes

**Example:**
```sql
CREATE OR REPLACE FUNCTION increment_vendor_inquiry_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE profiles
  SET inquiry_count = inquiry_count + 1
  WHERE id = NEW.vendor_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_inquiry_count AFTER INSERT ON inquiries
  FOR EACH ROW EXECUTE FUNCTION increment_vendor_inquiry_count();
```

**Why:** Guarantees consistency, removes logic from application layer, atomic with transaction

### Pattern 4: JSONB for Flexible Schema

**What:** Use JSONB columns for semi-structured data that varies

**When:**
- Service packages (each vendor has different offerings)
- Category requirements (each event needs different categories)
- Metadata that doesn't need relational queries
- Rapid schema evolution without migrations

**Example:**
```sql
-- profiles.services JSONB structure
{
  "packages": [
    {
      "name": "Basic Photography",
      "price": 2500,
      "includes": ["4 hours coverage", "200 edited photos", "online gallery"]
    },
    {
      "name": "Premium Photography",
      "price": 5000,
      "includes": ["8 hours coverage", "500 edited photos", "album", "prints"]
    }
  ]
}

-- events.category_requirements JSONB structure
{
  "venue": {"needed": true, "budget": 5000, "notes": "Temple preferred"},
  "catering": {"needed": false},
  "photography": {"needed": true, "budget": 3000}
}
```

**Why:** Avoids EAV anti-pattern, supports GIN indexes for queries, flexible without migrations

### Pattern 5: Realtime for Live Updates

**What:** Frontend subscribes to database changes via Realtime

**When:**
- Inquiry status changes need instant UI update
- Chat messages arrive in real-time
- Availability calendar changes
- Multi-user scenarios (admin + vendor)

**Example:**
```typescript
// Subscribe to inquiry updates for specific event
supabase
  .channel(`event-${eventId}-inquiries`)
  .on(
    'postgres_changes',
    {
      event: 'UPDATE',
      schema: 'public',
      table: 'inquiries',
      filter: `event_id=eq.${eventId}`
    },
    (payload) => {
      // Optimistically update local state
      updateInquiryInState(payload.new)
    }
  )
  .subscribe()
```

**Why:** Eliminates polling, instant feedback, better UX for async operations

## Anti-Patterns to Avoid

### Anti-Pattern 1: Overly Normalized Schema

**What:** Creating separate tables for every vendor type (photographers table, venues table, caterers table...)

**Why bad:**
- Causes schema explosion (11+ vendor types)
- Makes polymorphic queries complex
- Requires union queries for browsing all vendors
- Harder to add new vendor categories

**Instead:** Single `profiles` table with `vendor_category` field. Use JSONB for category-specific data.

### Anti-Pattern 2: Service Role in Frontend

**What:** Using Supabase service role key in React app

**Why bad:**
- Exposes full database access to client
- Bypasses all RLS policies
- Security catastrophe if leaked
- No way to revoke without full migration

**Instead:** Use anon/authenticated keys only. Service role stays in Edge Functions.

### Anti-Pattern 3: Edge Function for Every Query

**What:** Creating Edge Functions for simple CRUD operations

**Why bad:**
- Adds latency (client → function → database vs client → database)
- Increases complexity (more code to maintain)
- Costs more (function invocation + database query)
- Defeats purpose of PostgREST auto-generated API

**Instead:** Use Edge Functions only for AI/LLM calls, complex business logic, or operations requiring service role.

### Anti-Pattern 4: Storing Large JSON in Recommendations Cache

**What:** Caching entire vendor profile objects in recommendations JSONB

**Why bad:**
- Duplicates data (profiles already in database)
- Stale data if vendor updates profile
- Bloats database with repeated data
- Large JSONB slows queries

**Instead:** Store only `vendor_id` + score + reasoning in cache. Join with profiles table when fetching recommendations.

```sql
-- Good: Lightweight cache
{
  "recommendations": [
    {"vendor_id": "uuid", "score": 0.95, "reasoning": "..."}
  ]
}

-- Bad: Duplicated data
{
  "recommendations": [
    {
      "vendor_id": "uuid",
      "score": 0.95,
      "reasoning": "...",
      "profile": {/* entire vendor object */}
    }
  ]
}
```

### Anti-Pattern 5: Ignoring RLS During Development

**What:** Disabling RLS policies or using service role during development

**Why bad:**
- Security bugs slip into production
- Hard to debug policy issues later
- Test data doesn't match production behavior
- False confidence in app security

**Instead:** Enable RLS from day one. Test with authenticated user keys. Verify policies work as expected.

## AI/LLM Integration Architecture

### Hybrid Recommendation Engine

**Phase 1: PostgreSQL Filtering**
```sql
SELECT * FROM profiles
WHERE role = 'vendor'
  AND vendor_category = 'photography'
  AND city = 'San Jose'
  AND id IN (
    SELECT vendor_id FROM vendor_availability
    WHERE date = '2026-08-15' AND is_available = true
  )
```

**Result:** 20-50 candidate vendors matching hard constraints

**Phase 2: AI Ranking (Edge Function)**
```typescript
const prompt = `
Event: Arangetram on August 15, 2026 in San Jose
Budget: $3000 for photography
Preferences: Traditional style, experience with Indian events

Vendors:
${vendors.map(v => `- ${v.business_name}: ${v.description}`).join('\n')}

Rank these vendors by fit, provide reasoning for top 5.
`

const geminiResponse = await gemini.generateContent(prompt)
```

**Result:** Top 5 vendors with AI-generated explanations

**Why hybrid:**
- PostgreSQL filters by hard constraints (location, availability, category)
- AI ranks remaining candidates by soft factors (style fit, experience, reviews)
- Keeps AI costs low (only rank 20-50 instead of thousands)
- Fast response (database filter takes <50ms, AI ranking takes 1-2s)

### Chat Assistant Context

**System prompt includes:**
- User's event details (date, budget, location, guest count)
- Categories already handled vs still needed
- Previous conversation history
- General Arangetram planning knowledge

**Example:**
```typescript
const systemPrompt = `
You are an Arangetram planning assistant.

Current event:
- Date: August 15, 2026
- Location: San Jose, CA
- Budget: $25,000
- Guest count: 200

Categories covered:
- Venue: Yes (booked)
- Catering: Yes (booked)
- Photography: No (still searching)

Help the user plan their Arangetram. Answer questions about vendors, traditions, budgeting, and logistics.
`
```

## Suggested Build Order

Based on dependencies between components:

### Phase 1: Foundation (Week 1-2)
1. **Supabase project setup** - Create project, configure auth
2. **Core schema** - Create profiles, events tables with RLS
3. **Auth integration** - Supabase Auth in React app
4. **Profile management** - User/vendor signup and profile editing

**Milestone:** Users can register, create profile, login

### Phase 2: Vendor Discovery (Week 3-4)
5. **Vendor browsing** - List vendors with filters (no AI yet)
6. **Storage setup** - Vendor portfolio image uploads
7. **Vendor profiles** - Full vendor detail pages
8. **Basic search** - Filter by category, location, price range

**Milestone:** Users can browse and filter vendors

### Phase 3: Event Planning (Week 5-6)
9. **Event creation** - Users create events with category requirements
10. **Category management** - Mark categories as needed/optional
11. **Availability system** - Vendors manage calendar, filter by availability
12. **Basic recommendations** - PostgreSQL-only filtering (no AI yet)

**Milestone:** Users can create events, see available vendors

### Phase 4: AI Integration (Week 7-8)
13. **Edge Function setup** - recommend-vendors function
14. **Gemini integration** - AI ranking with explanations
15. **Recommendation caching** - Store results in database
16. **Chat assistant** - AI planning helper with context

**Milestone:** AI-powered recommendations and chat working

### Phase 5: Connection Flow (Week 9-10)
17. **Inquiry system** - Users send inquiries to vendors
18. **Realtime setup** - Live inquiry notifications
19. **Inquiry management** - Vendor dashboard for responding
20. **Status tracking** - Inquiry lifecycle (pending → accepted/declined)

**Milestone:** End-to-end inquiry flow working

### Phase 6: Polish & Launch (Week 11-12)
21. **Plan curation UI** - Users swap vendors, compare options
22. **Email notifications** - Inquiry sent/responded webhooks
23. **Guest access** - Browse vendors without account
24. **Performance optimization** - Index tuning, query optimization

**Milestone:** MVP ready for beta users

**Build order rationale:**
- Foundation first (auth + schema) enables everything else
- Vendor browsing before events (users need to see what's available)
- PostgreSQL filtering before AI (validate UX before adding complexity)
- AI integration as enhancement, not blocker
- Connection flow last (requires vendor supply + event creation working)

## Migration Strategy: MongoDB → Supabase

### Approach: Clean Rebuild

**Why not incremental migration:**
- Data models fundamentally different (document vs relational)
- Schema needs redesign (normalize relationships)
- Auth system different (JWT vs Supabase Auth)
- Clean slate prevents technical debt

### Migration Steps

**1. Schema Mapping**
```
MongoDB → PostgreSQL
users collection → profiles table
events collection → events table
bookings collection → inquiries table
vendors collection → profiles table (role = 'vendor')
```

**2. Data Export & Transform**
```bash
# Export from MongoDB
mongoexport --collection=users --out=users.json
mongoexport --collection=vendors --out=vendors.json
mongoexport --collection=events --out=events.json
mongoexport --collection=bookings --out=bookings.json

# Transform with script (Python/Node)
# - Flatten nested documents
# - Generate UUIDs for foreign keys
# - Map old IDs to new UUIDs
# - Convert ObjectIds to UUIDs
```

**3. Bulk Import to Supabase**
```typescript
// Use Supabase client with service role
const { data, error } = await supabaseAdmin
  .from('profiles')
  .insert(transformedUsers)

// Maintain ID mapping for relationships
const idMap = new Map()
transformedUsers.forEach((user, idx) => {
  idMap.set(originalIds[idx], user.id)
})
```

**4. Parallel Testing**
- Run old FastAPI backend alongside new Supabase
- Gradually move features to new stack
- Compare query results between systems
- Validate RLS policies match old auth logic

**5. Cutover**
- Feature freeze on old system
- Final data sync
- Update DNS/routing to new app
- Keep old system read-only for 1 month (safety)

## Scalability Considerations

| Concern | At 100 users | At 10K users | At 1M users |
|---------|--------------|--------------|-------------|
| **Database size** | <1GB, single Postgres instance sufficient | <100GB, connection pooling needed | Sharding by geography (state/region), read replicas |
| **Recommendations cache** | In-memory OK, 24hr TTL | Database cache table with aggressive cleanup | Redis/Memcached for hot recommendations, CDN edge caching |
| **Image storage** | Supabase Storage default limits OK | CDN in front of Storage (Cloudflare) | Multi-region buckets, image optimization pipeline |
| **AI API costs** | ~$50/mo (100 users × 5 recommendations/mo × $0.10/call) | ~$5K/mo, implement aggressive caching | Hybrid model: PostgreSQL + lightweight embedding model, LLM only for final ranking |
| **Realtime connections** | Default limits sufficient | Upgrade Supabase plan for more concurrent connections | Separate Realtime infrastructure, use presence channels for load balancing |
| **Edge Function cold starts** | Negligible for low traffic | Keep-warm pings for critical functions | Move to dedicated serverless (Cloudflare Workers, Fastly Compute) |

**Optimization triggers:**
- **100 users:** Basic monitoring setup
- **10K users:** Database query optimization, index tuning, caching layer
- **1M users:** Architecture review, potential multi-region deployment, API rate limiting

## Confidence Assessment

| Area | Confidence | Reasoning |
|------|-----------|-----------|
| Database schema | HIGH | Standard marketplace patterns, proven relational model for two-sided platforms |
| RLS policies | HIGH | Supabase RLS is mature, multi-tenant patterns well-documented |
| Edge Functions | MEDIUM | Correct pattern for AI calls, but specific Gemini integration details need validation |
| Realtime | MEDIUM | Supabase Realtime works well for these use cases, but scale limits need monitoring |
| Build order | HIGH | Dependencies clear, phased approach de-risks AI integration |
| Migration strategy | MEDIUM | Clean rebuild is correct, but data transformation complexity TBD until MongoDB schema reviewed |

## Sources

- **Supabase Documentation** (official patterns, assumed current as of Jan 2025)
- **PostgreSQL Best Practices** (relational database design, indexing, RLS)
- **Marketplace Architecture Patterns** (two-sided platform data models)
- **AI Integration Patterns** (hybrid filtering + LLM ranking approach)

**Note:** Web tools unavailable during research. All recommendations based on established Supabase patterns and marketplace architecture best practices as of training data (Jan 2025). Critical areas flagged as MEDIUM confidence should be validated against current Supabase documentation during implementation.

## Open Questions for Phase-Specific Research

- **Gemini API integration details** - Specific prompt engineering for vendor ranking, response parsing, error handling
- **MongoDB schema review** - Exact data transformation logic depends on current MongoDB structure
- **Real-time scale testing** - Connection limits and fallback strategies need load testing
- **Storage optimization** - Image compression, CDN configuration, responsive image serving
- **Email notification provider** - SendGrid vs Resend vs AWS SES evaluation for inquiry notifications

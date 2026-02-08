# Domain Pitfalls: Arangetaram Planning Marketplace

**Domain:** Two-sided event planning marketplace with Supabase migration and AI recommendations
**Researched:** 2026-02-07
**Confidence:** MEDIUM (based on training knowledge; external verification unavailable)

## Critical Pitfalls

Mistakes that cause rewrites, security vulnerabilities, or major issues.

### Pitfall 1: RLS Policies Missing on New Tables

**What goes wrong:** Developers create new tables in Supabase but forget to add Row Level Security (RLS) policies. With RLS disabled, ALL data becomes publicly accessible through the auto-generated API, even if the frontend doesn't expose it.

**Why it happens:**
- MongoDB has no equivalent concept to RLS—access control happens in application code
- Supabase tables default to RLS disabled for developer convenience during prototyping
- Auto-generated APIs bypass application-layer security

**Consequences:**
- **CRITICAL SECURITY VULNERABILITY:** Vendors can read/modify other vendors' data
- Users can access private vendor availability, pricing, or contact information
- Malicious actors can scrape entire database via API
- Compliance violations (GDPR, user privacy)

**Prevention:**
1. **Enable RLS by default in migration templates:**
   ```sql
   CREATE TABLE vendors (...);
   ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
   -- Add policies immediately after
   ```

2. **Create checklist for every new table:**
   - [ ] RLS enabled
   - [ ] SELECT policy for public/authenticated users
   - [ ] INSERT/UPDATE/DELETE policies for owners
   - [ ] Service role bypass documented

3. **Add database test:**
   ```sql
   -- Check all tables have RLS enabled
   SELECT tablename
   FROM pg_tables
   WHERE schemaname = 'public'
   AND tablename NOT IN (
     SELECT tablename FROM pg_policies
   );
   ```

4. **Use Supabase dashboard security advisor** to audit RLS configuration

**Detection:**
- Warning sign: Can query table data from unauthenticated API client
- Supabase dashboard shows "RLS disabled" badge on table
- Security audit returns tables without policies

**Phase mapping:** Phase 1 (Database Migration) must establish RLS-first migration template

---

### Pitfall 2: RLS Policies That Create N+1 Query Performance Issues

**What goes wrong:** RLS policies execute for EVERY row returned by a query. Complex policies with JOINs or subqueries cause exponential slowdowns.

**Why it happens:**
- Developers write RLS policies like application code: "Check if user is vendor owner"
- Each policy becomes a subquery executed per row
- MongoDB query patterns don't translate—no row-level filtering concept

**Consequences:**
- Vendor list page takes 10+ seconds to load (checking policy for each vendor)
- Search queries timeout with 100+ results
- Database CPU spikes under normal load
- Realtime subscriptions drop connections due to slow policy evaluation

**Example of bad policy:**
```sql
-- BAD: Subquery runs for EVERY vendor row
CREATE POLICY "Vendors see own data"
ON vendors FOR SELECT
USING (
  id IN (
    SELECT vendor_id FROM vendor_users WHERE user_id = auth.uid()
  )
);
```

**Example of good policy:**
```sql
-- GOOD: Use indexed foreign key, simple comparison
CREATE POLICY "Vendors see own data"
ON vendors FOR SELECT
USING (owner_user_id = auth.uid());
```

**Prevention:**
1. **Keep RLS policies simple:**
   - Direct column comparisons only: `user_id = auth.uid()`
   - Avoid subqueries, JOINs, function calls in policies
   - Denormalize user_id onto tables if needed for RLS

2. **Index columns used in RLS policies:**
   ```sql
   CREATE INDEX idx_vendors_owner ON vendors(owner_user_id);
   ```

3. **Test policy performance:**
   ```sql
   EXPLAIN ANALYZE
   SELECT * FROM vendors; -- Run as authenticated user
   -- Look for "SubPlan" in execution plan = bad
   ```

4. **Use materialized views for complex access patterns:**
   - Pre-compute vendor visibility
   - Apply simple RLS to view instead of complex base table policies

**Detection:**
- Query EXPLAIN shows nested loops or subplans
- Database monitoring shows high CPU on SELECT queries
- Response times increase linearly with result set size

**Phase mapping:** Phase 1 (Schema Migration) must include RLS performance testing

---

### Pitfall 3: Auth User Migration Without Password Hash Compatibility

**What goes wrong:** Attempting to migrate existing users from MongoDB to Supabase Auth, but password hashes are incompatible. Users cannot log in, requiring mass password reset.

**Why it happens:**
- MongoDB app likely uses bcrypt, argon2, or custom hashing
- Supabase Auth uses bcrypt by default but requires specific format
- No direct bulk import preserving existing password hashes

**Consequences:**
- ALL existing users must reset passwords (terrible UX)
- Support flood from confused users
- User churn during migration ("Why is this broken?")
- Loss of trust in platform

**Prevention:**
1. **Verify hash compatibility BEFORE migration:**
   - Supabase Auth supports bcrypt hashes
   - If current app uses bcrypt, hashes MAY be compatible
   - Test with sample users first

2. **Migration strategy options:**

   **Option A: Gradual migration (RECOMMENDED for brownfield)**
   - Keep MongoDB auth running alongside Supabase
   - On successful login, migrate that user's hash to Supabase
   - Phase out MongoDB auth after 90 days
   - Force password reset only for inactive users

   **Option B: Dual auth check**
   - Custom auth function that checks Supabase first, falls back to MongoDB
   - Migrate hash on successful MongoDB auth
   - Requires custom auth flow

   **Option C: Forced password reset (LAST RESORT)**
   - Send personalized emails explaining migration
   - Offer incentive for early reset (vendor onboarding credit)
   - Stagger reset requirement by user segments

3. **Preserve user identities:**
   - Map MongoDB user IDs to Supabase auth.users.id
   - Store MongoDB ID in user metadata: `raw_user_meta_data.legacy_user_id`
   - Migrate all user data using ID mapping

**Detection:**
- Warning sign: Migration script attempts to INSERT into auth.users (not allowed)
- Users report "invalid password" after migration
- Login success rate drops below 50%

**Phase mapping:** Phase 0 (Auth Strategy) must resolve before Phase 1

---

### Pitfall 4: Marketplace Cold Start—No Vendors or No Users

**What goes wrong:** Classic chicken-and-egg problem. Users won't join without vendors; vendors won't join without users. Platform launches to crickets.

**Why it happens:**
- Underestimating acquisition difficulty
- Launching in "build it and they will come" mode
- No go-to-market strategy for initial liquidity

**Consequences:**
- Platform appears dead to first visitors (bounce rate >90%)
- Vendors who sign up don't renew ("No inquiries received")
- Negative brand perception ("Is this platform even real?")
- Burn through marketing budget with no traction

**Prevention:**
1. **Seed supply side FIRST (vendors):**
   - Manually recruit 20-30 high-quality vendors before public launch
   - Offer free premium listings for 6 months
   - Personally onboard each vendor (white-glove service)
   - Get professional photos, complete profiles

2. **Create illusion of activity:**
   - "Featured vendors" section highlighting seed vendors
   - Show aggregate stats: "15 vendors available in your area"
   - User testimonials (even if from beta testers)

3. **Geographic focus:**
   - Launch in ONE city/region only
   - Achieve density before expanding
   - Better to dominate Chennai than be thin across all India

4. **Content marketing for early users:**
   - Blog posts: "How to plan an Arangetaram" drive organic traffic
   - Rank for "Arangetaram vendors [city]"
   - Users arrive already warm

5. **Measure supply/demand ratio:**
   - Target: 10+ vendors per category before user acquisition
   - Track "inquiry response rate" (vendors must respond within 24h)
   - Remove inactive vendors ruthlessly

**Detection:**
- Warning sign: Vendor signup stalls at <10 vendors
- Users visit but don't create inquiries
- Session duration <30 seconds (bounce immediately)

**Phase mapping:** Phase 0 (Pre-launch vendor recruitment) happens BEFORE Phase 1 tech migration

---

### Pitfall 5: Vendor Quality Collapse—No Curation

**What goes wrong:** Allowing any vendor to self-register without vetting. Low-quality vendors flood platform, users have bad experiences, platform reputation suffers.

**Why it happens:**
- Optimizing for vendor quantity over quality
- No manual review process (seems like work)
- Fear of being "too restrictive" at launch

**Consequences:**
- Users contact vendors who never respond
- Vendors with fake portfolios or stolen photos
- Price gouging or unprofessional behavior
- User trust evaporates: "This platform is full of scammers"
- High-quality vendors leave (don't want to be associated)

**Prevention:**
1. **Manual approval for MVP:**
   - Vendors submit application, admin reviews before publish
   - Check: portfolio authenticity, contact info, sample pricing
   - Interview or phone screen for first 50 vendors
   - Accept 50-60% of applications (selective = quality signal)

2. **Progressive verification tiers:**
   - Tier 1: Basic (email verified, profile complete)
   - Tier 2: Verified (phone + business license checked)
   - Tier 3: Premium (past client references, featured)
   - Display badges on vendor profiles

3. **Reputation system:**
   - User ratings AFTER service delivered (not just inquiries)
   - Prompt: "Did [vendor] respond within 24 hours?"
   - Hide vendors with <4.0 stars or <70% response rate

4. **Platform standards enforcement:**
   - Require professional portfolio photos (no blurry phone pics)
   - Mandate response time SLA: 24-hour reply to inquiries
   - Auto-pause vendors who miss 3+ inquiries

5. **Community moderation:**
   - Users can flag suspicious vendors
   - Admin reviews flagged profiles within 24h
   - Transparent removal policy

**Detection:**
- Warning sign: User complaints about unresponsive vendors
- Vendor response rate <60%
- Multiple users report same vendor negatively
- Portfolio photos appear in reverse image search

**Phase mapping:** Phase 2 (Vendor Management) must include manual approval workflow

---

### Pitfall 6: AI Recommendation Latency Kills UX

**What goes wrong:** Hybrid AI recommendation system (filter + LLM) takes 5-10 seconds to return results. Users bounce before seeing recommendations.

**Why it happens:**
- LLM API calls (OpenAI, Anthropic) have 1-3s latency
- Chaining filter → LLM → re-rank creates sequential delays
- No loading state or progressive results
- Running LLM calls synchronously on every search

**Consequences:**
- Search page feels broken (users think it crashed)
- Bounce rate on search >70%
- Server costs spike (LLM calls for abandoned searches)
- Users revert to manual filtering (AI provides no value)

**Prevention:**
1. **Progressive disclosure:**
   ```
   1. Show filtered results immediately (0.1s)
   2. Display "AI is enhancing results..." loader
   3. Stream LLM-enhanced results as they arrive (2-3s)
   ```

2. **Cache aggressively:**
   - Cache LLM results by search parameters for 24h
   - Pre-compute recommendations for popular searches
   - "Users searching for 'Bharatanatyam costume' also liked..."

3. **Async processing:**
   - Return filtered results synchronously
   - Trigger LLM enhancement in background
   - Update results via Realtime subscription when ready
   - Or use polling: "Updated results available, click to refresh"

4. **Debounce LLM calls:**
   - Don't call LLM on every filter change
   - Wait for 2 seconds of inactivity
   - Cancel pending LLM calls if user changes query

5. **Implement timeouts:**
   ```javascript
   const llmPromise = enhanceWithAI(results);
   const timeoutPromise = delay(3000);
   const enhanced = await Promise.race([llmPromise, timeoutPromise]);
   // Fall back to non-AI results if timeout
   ```

6. **Optimize LLM usage:**
   - Use smaller, faster models for simple tasks (GPT-3.5, Claude Haiku)
   - Batch multiple recommendations in single LLM call
   - Limit LLM to top 20 results, not all 100

**Detection:**
- Warning sign: Time to first result >2 seconds
- Users click "back" before results load
- LLM API costs exceed $X per search
- Monitoring shows 90th percentile latency >5s

**Phase mapping:** Phase 3 (AI Integration) must include latency budgets and progressive loading

---

### Pitfall 7: LLM Hallucinations in Vendor Recommendations

**What goes wrong:** LLM invents vendor capabilities, prices, or availability that don't exist. Users contact vendors expecting services they don't offer.

**Why it happens:**
- Treating LLM as database query instead of ranking/explanation tool
- Allowing LLM to generate facts about vendors
- No grounding in actual vendor data

**Consequences:**
- User frustration: "Vendor said they don't do that"
- Vendor frustration: "Why are users asking for things I don't offer?"
- Loss of trust in AI recommendations
- Legal risk if LLM generates false claims

**Prevention:**
1. **NEVER let LLM generate facts:**
   ```
   BAD:  "This vendor offers Bharatanatyam costumes for $500"
   GOOD: "Based on your search for traditional costumes,
          we recommend [Vendor Name] (4.8 stars)"
   ```

2. **Use LLM for ranking, not generation:**
   - Filter vendors by actual database fields
   - LLM ranks/reorders existing results based on query intent
   - Display actual vendor data from database, not LLM output

3. **Structured output only:**
   ```javascript
   const prompt = `
   Given vendors: ${JSON.stringify(vendors)}
   Rank by relevance to query: "${userQuery}"
   Return: ["vendor_id_1", "vendor_id_2", ...]
   `;
   // Parse IDs, look up full vendor data from DB
   ```

4. **Display grounding sources:**
   - Show which vendor attributes matched: "Matches: Bharatanatyam, 15+ years experience"
   - User can verify claims against vendor profile
   - Transparency builds trust

5. **Human review for AI-surfaced vendors:**
   - Flag first-time AI recommendations for manual check
   - Vendor can dispute incorrect AI categorization

**Detection:**
- Warning sign: User reports "Vendor doesn't offer this"
- Vendor contacts support: "Why is my profile showing wrong info?"
- Recommendation diverges from vendor's listed services

**Phase mapping:** Phase 3 (AI Integration) must define LLM boundaries clearly

---

### Pitfall 8: Supabase Realtime Overuse Creates Chaos

**What goes wrong:** Enabling Realtime subscriptions on every table "because it's cool." Client state thrashes as data updates, UI flickers, unnecessary re-renders.

**Why it happens:**
- Supabase makes Realtime easy (one line of code)
- Coming from MongoDB, Realtime feels like magic
- No consideration of when Realtime actually helps UX

**Consequences:**
- User's vendor list constantly reordering as vendors update profiles
- Form inputs lose focus when data refreshes mid-edit
- Battery drain on mobile (constant WebSocket traffic)
- Race conditions: user edits profile → Realtime overwrites → data loss

**Prevention:**
1. **Use Realtime sparingly:**
   - **YES:** Unread inquiry count badge (user needs instant update)
   - **YES:** Vendor availability calendar (prevent double-booking)
   - **NO:** Vendor search results (updates don't matter)
   - **NO:** User's own profile form (they're editing it!)

2. **Disable Realtime on tables by default:**
   - Enable only for specific use cases
   - Require explicit justification

3. **Implement smart merging:**
   ```javascript
   subscription.on('UPDATE', (payload) => {
     // Don't update if user is editing
     if (isEditing) return;

     // Don't update currently focused element
     if (document.activeElement.id === `vendor-${payload.new.id}`) return;

     updateState(payload.new);
   });
   ```

4. **Debounce updates:**
   - Batch Realtime updates, apply every 5 seconds
   - Smooth transitions instead of jarring jumps

5. **Optimistic updates + conflict resolution:**
   - Apply user's change immediately (optimistic)
   - If Realtime says different, show conflict modal
   - Let user choose which version to keep

**Detection:**
- Warning sign: UI elements move/flicker during normal use
- Users report "form cleared itself"
- WebSocket connection count in hundreds
- Client-side CPU spikes when idle

**Phase mapping:** Phase 1 (Migration) should NOT enable Realtime by default; Phase 4 adds selectively

---

### Pitfall 9: Data Migration Without Validation

**What goes wrong:** Migrating MongoDB data to Supabase with a one-time script. Data arrives corrupted, duplicated, or missing. No ability to verify correctness.

**Why it happens:**
- Schema differences between MongoDB (flexible) and Postgres (strict)
- Data type mismatches: ObjectId → UUID, nested objects → JSONB
- No dry-run or rollback plan
- Optimism bias: "The script will just work"

**Consequences:**
- Vendor profiles missing critical fields (phone, location)
- User inquiry history lost
- Duplicate vendor entries
- Foreign key constraint violations break app
- Rollback impossible (MongoDB data already updated/deleted)

**Prevention:**
1. **Dual-write period:**
   - Write to both MongoDB AND Supabase for 1-2 weeks
   - Read from MongoDB (source of truth)
   - Compare Supabase data against MongoDB to find discrepancies
   - Fix migration script iteratively

2. **Schema validation layer:**
   ```javascript
   const validateVendor = (mongoDoc) => {
     const required = ['name', 'category', 'phone', 'city'];
     const missing = required.filter(field => !mongoDoc[field]);
     if (missing.length) {
       throw new Error(`Vendor ${mongoDoc._id} missing: ${missing}`);
     }
     // Type checks, format validation, etc.
   };
   ```

3. **Dry-run with checksums:**
   ```javascript
   // Generate before migration
   const mongoChecksum = {
     totalVendors: db.vendors.count(),
     totalUsers: db.users.count(),
     vendorsByCategory: db.vendors.aggregate([...]),
   };

   // Verify after migration
   const supabaseChecksum = {
     totalVendors: await supabase.from('vendors').select('count'),
     // ...
   };

   assert.deepEqual(mongoChecksum, supabaseChecksum);
   ```

4. **Incremental migration:**
   - Migrate 10 vendors → validate → migrate 100 → validate → all
   - Stop on first error, fix, restart
   - Keep MongoDB data intact until validation passes

5. **Parallel verification queries:**
   ```javascript
   // For each migrated vendor
   const mongoVendor = await mongo.collection('vendors').findOne({_id});
   const supabaseVendor = await supabase.from('vendors').select('*').eq('id', uuid).single();

   assertEqual(mongoVendor.name, supabaseVendor.name);
   assertEqual(mongoVendor.services.length, supabaseVendor.services.length);
   // ...
   ```

**Detection:**
- Warning sign: Record counts don't match
- App throws "foreign key constraint" errors
- Users report missing data after migration
- Vendor profiles have null/undefined fields

**Phase mapping:** Phase 1 (Data Migration) must include multi-stage validation

---

### Pitfall 10: Ignoring Supabase Storage Limits and Costs

**What goes wrong:** Allowing unlimited vendor portfolio photo uploads without size limits, format restrictions, or CDN optimization. Storage costs explode, page load times suffer.

**Why it happens:**
- Supabase Storage seems "unlimited" in free tier during dev
- No upload limits configured
- Vendors upload 10MB raw phone photos
- No image optimization pipeline

**Consequences:**
- Vendor profile page loads 50MB of images (mobile users can't load)
- Storage costs jump from $0 to $100+/month
- Slow image loading → high bounce rate
- Bandwidth costs from repeated large file downloads

**Prevention:**
1. **Client-side upload limits:**
   ```javascript
   const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2MB
   const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

   if (file.size > MAX_FILE_SIZE) {
     throw new Error('Image must be under 2MB');
   }
   ```

2. **Server-side image optimization:**
   - Use Supabase Storage image transformations (if available)
   - Or: Upload triggers Edge Function → resize/compress → store optimized version
   - Generate thumbnails (200x200) and previews (800x600) automatically

3. **Lazy loading:**
   ```jsx
   <img
     src={thumbnailUrl}
     loading="lazy"
     onClick={() => openLightbox(fullSizeUrl)}
   />
   ```

4. **Portfolio limits:**
   - Free vendors: 5 photos max
   - Premium vendors: 20 photos max
   - Enforce in RLS policy + client validation

5. **Monitor storage metrics:**
   - Alert if storage growth >10GB/month
   - Track per-vendor storage usage
   - Bill premium vendors for excess storage

6. **CDN caching:**
   - Supabase Storage includes CDN by default
   - Set Cache-Control headers for images (1 year)
   - Use image URLs with version hashes (cache busting)

**Detection:**
- Warning sign: Storage dashboard shows rapid growth
- Page Speed Insights flags large image sizes
- Mobile users report slow loading
- Storage costs exceed $X/month

**Phase mapping:** Phase 2 (Vendor Profiles) must implement upload limits and optimization

---

## Moderate Pitfalls

Mistakes that cause delays or technical debt.

### Pitfall 11: Not Planning for Multi-Tenancy from Start

**What goes wrong:** Building vendor profiles, inquiries, and data without clear tenant boundaries. When launching city-specific or vendor-team features, requires major refactor.

**Why it happens:**
- Starting with simple model: one vendor = one user
- Not anticipating vendor teams (multiple staff, role-based access)
- Not planning geographic segmentation

**Prevention:**
1. **Add tenant_id early:**
   ```sql
   CREATE TABLE vendors (
     id UUID PRIMARY KEY,
     organization_id UUID REFERENCES organizations(id),
     -- Vendor might have multiple team members
   );

   CREATE TABLE vendor_users (
     vendor_id UUID REFERENCES vendors(id),
     user_id UUID REFERENCES auth.users(id),
     role TEXT CHECK (role IN ('owner', 'staff', 'viewer'))
   );
   ```

2. **Design for multiple admins:**
   - Vendor owner can invite team members
   - Role-based permissions (owner can edit pricing, staff can reply to inquiries)

**Phase mapping:** Phase 1 (Schema Design) should consider multi-tenancy even if MVP is single-user

---

### Pitfall 12: Hardcoding Supabase Client Instead of Using Service Role Where Needed

**What goes wrong:** Using anon/authenticated client everywhere, including background jobs or admin operations. RLS policies block legitimate operations.

**Why it happens:**
- Single client initialization pattern from docs
- Not understanding anon vs service role distinction
- Fear of "bypassing security"

**Prevention:**
1. **Two clients:**
   ```javascript
   // Client-side: RLS enforced
   const supabase = createClient(url, anonKey);

   // Server-side/Edge Functions: RLS bypass
   const supabaseAdmin = createClient(url, serviceRoleKey);
   ```

2. **When to use service role:**
   - Nightly cleanup jobs (delete expired inquiries)
   - Admin dashboard (view all vendors)
   - Data migration scripts
   - Webhook handlers (external system updates)

3. **Never expose service role key to client:**
   - Environment variable on server only
   - Never in browser bundle

**Phase mapping:** Phase 1 establishes client patterns; Phase 4 (Admin) requires service role

---

### Pitfall 13: Search Doesn't Match User Mental Model

**What goes wrong:** Implementing exact-match search or Postgres LIKE queries. Users type "bharatnatyam" (typo) or "dance teacher" (generic) and get zero results.

**Why it happens:**
- Using basic Postgres text search
- Not accounting for spelling variations, synonyms
- Not understanding domain-specific search terms

**Prevention:**
1. **Use Postgres full-text search (FTS):**
   ```sql
   ALTER TABLE vendors ADD COLUMN search_vector tsvector;
   CREATE INDEX idx_search ON vendors USING GIN(search_vector);

   -- Update trigger to maintain search_vector
   CREATE TRIGGER update_search_vector
   BEFORE INSERT OR UPDATE ON vendors
   FOR EACH ROW EXECUTE FUNCTION
   tsvector_update_trigger(search_vector, 'pg_catalog.english', name, description, category);
   ```

2. **Fuzzy matching for typos:**
   - Use `pg_trgm` extension for trigram similarity
   ```sql
   SELECT * FROM vendors
   WHERE name % 'bharatnatyam' -- Fuzzy match
   ORDER BY similarity(name, 'bharatnatyam') DESC;
   ```

3. **Synonym handling:**
   - Map "dance teacher" → "Bharatanatyam instructor"
   - Create domain-specific thesaurus
   - Pre-process search query to expand synonyms

4. **Category + keyword search:**
   - Let users filter by category first (dropdown)
   - Then search within category (reduces noise)

**Phase mapping:** Phase 2 (Search) should implement FTS, not basic LIKE queries

---

### Pitfall 14: No Rate Limiting on Inquiry Submissions

**What goes wrong:** Allowing unlimited inquiry submissions. Spam bots flood vendors, users abuse system to contact all vendors, vendor experience degrades.

**Why it happens:**
- No rate limiting configured
- Supabase doesn't enforce rate limits by default
- "We're small, spam won't happen to us"

**Prevention:**
1. **Database-level rate limiting:**
   ```sql
   CREATE TABLE inquiry_rate_limits (
     user_id UUID PRIMARY KEY,
     inquiries_sent INT DEFAULT 0,
     reset_at TIMESTAMP DEFAULT NOW() + INTERVAL '1 day'
   );

   -- Check in RLS policy or Edge Function
   ```

2. **Client-side debouncing:**
   - Disable submit button for 5 seconds after inquiry sent

3. **CAPTCHA for suspicious patterns:**
   - Trigger CAPTCHA if user sends >5 inquiries in 10 minutes
   - Use Cloudflare Turnstile or hCaptcha

4. **Vendor notification throttling:**
   - Don't email vendor for every inquiry instantly
   - Batch: "You have 3 new inquiries" digest every hour

**Phase mapping:** Phase 3 (Inquiry System) should include rate limiting from day 1

---

### Pitfall 15: No Monitoring or Error Tracking

**What goes wrong:** App breaks in production, users silently churn, no visibility into errors, performance, or user behavior.

**Why it happens:**
- "We'll add monitoring later"
- Focused on features, not observability
- Underestimating importance of metrics

**Prevention:**
1. **Error tracking (Sentry):**
   - Catch client-side errors
   - Catch Edge Function errors
   - Alert on error spike

2. **Performance monitoring (Vercel Analytics, PostHog):**
   - Track page load times
   - Identify slow queries
   - Monitor Core Web Vitals

3. **Business metrics:**
   - Track conversion funnel: visit → search → inquiry → response
   - Monitor vendor response rate
   - Alert if inquiry volume drops 50%

4. **Supabase monitoring:**
   - Database connection pool usage
   - Query performance (pg_stat_statements)
   - Storage usage growth

**Phase mapping:** Phase 1 should include basic error tracking; expand in later phases

---

## Minor Pitfalls

Mistakes that cause annoyance but are fixable.

### Pitfall 16: Email Verification UX Friction

**What goes wrong:** Requiring email verification before users can browse vendors. Creates signup friction, high abandonment.

**Prevention:**
- Let users browse without signup
- Require signup only when submitting inquiry
- Email verification required only for vendors, not users

**Phase mapping:** Phase 1 (Auth) should optimize signup flow

---

### Pitfall 17: No Vendor Onboarding Guidance

**What goes wrong:** Vendor creates account, sees empty profile form, doesn't know what to write, abandons.

**Prevention:**
- Onboarding wizard with examples
- Show sample vendor profiles: "Here's what a great profile looks like"
- Progressively unlock features (complete profile → get listed)

**Phase mapping:** Phase 2 (Vendor Experience) should include onboarding

---

### Pitfall 18: Forgetting to Set up Database Backups

**What goes wrong:** Relying on Supabase's automatic backups without verifying restore process. Disaster recovery untested.

**Prevention:**
- Enable Point-in-Time Recovery (PITR) in Supabase
- Test restore process quarterly
- Export critical data to external backup weekly

**Phase mapping:** Phase 1 (Infrastructure) must enable backups

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Database Migration | RLS policies missing on new tables | Use migration template that enables RLS by default |
| Database Migration | Data validation skipped during migration | Implement dual-write period and checksum validation |
| Auth Migration | Password hash incompatibility | Use gradual migration strategy, test hash compatibility first |
| Vendor Profiles | No upload size limits | Enforce 2MB limit + image optimization pipeline |
| Vendor Profiles | No quality curation | Manual approval workflow for MVP |
| Search Implementation | Basic LIKE queries instead of FTS | Use Postgres full-text search with fuzzy matching |
| Inquiry System | No rate limiting | Database-level rate limits + CAPTCHA for suspicious patterns |
| AI Integration | LLM latency kills UX | Progressive disclosure: show filtered results first, enhance with AI asynchronously |
| AI Integration | LLM hallucinates vendor details | Use LLM for ranking only, not fact generation |
| Realtime Features | Overusing Realtime subscriptions | Enable Realtime only for specific use cases (inquiry counts, availability) |
| Marketplace Launch | Cold start problem (no vendors) | Recruit 20-30 seed vendors before public launch |

---

## Confidence Assessment

**Overall Confidence: MEDIUM (LOW for external verification, HIGH for known patterns)**

| Area | Confidence | Reason |
|------|------------|--------|
| Supabase RLS pitfalls | HIGH | Well-documented pattern from Supabase community and training data |
| Database migration pitfalls | HIGH | Common patterns across SQL migrations generally |
| Marketplace cold start | HIGH | Classic two-sided marketplace problem, extensively studied |
| AI integration pitfalls | MEDIUM | Based on general LLM integration patterns; specific to this use case is LOW |
| Supabase-specific migration | LOW | Cannot verify with official docs or Context7 (tools unavailable) |

## Sources

**Note:** Unable to access WebSearch, WebFetch, or Context7 for external verification. All findings based on training knowledge (as of January 2025). **CRITICAL: Verify all Supabase-specific claims against official documentation before implementation.**

For authoritative sources, consult:
- Supabase official documentation: https://supabase.com/docs
- Supabase RLS best practices: https://supabase.com/docs/guides/database/postgres/row-level-security
- Supabase migration guides: https://supabase.com/docs/guides/database/migrations
- Marketplace platform literature (Reid Hoffman's "Blitzscaling", Bill Gurley essays on marketplaces)
- AI integration best practices (OpenAI, Anthropic developer guides)

---

## Summary for Roadmap Creation

**Top 3 Critical Pitfalls to Address Early:**

1. **RLS Security (Phase 1):** Missing RLS policies create critical security vulnerability. Must enable RLS by default in all migration templates.

2. **Auth Migration Strategy (Phase 0):** Password hash incompatibility requires gradual migration approach. Resolve before starting database migration.

3. **Marketplace Cold Start (Phase 0):** Platform is worthless without vendors. Recruit 20-30 seed vendors manually before public launch.

**Pitfalls Requiring Deeper Phase-Specific Research:**

- Phase 3 (AI Integration): Specific LLM model selection, cost optimization, prompt engineering (requires testing)
- Phase 1 (Data Migration): MongoDB → Postgres schema mapping for actual data model (requires examining existing codebase)
- Phase 2 (Search): Domain-specific synonym mapping for event planning terminology (requires domain expert input)

**Pitfalls With Standard Solutions:**

- Phase 1 (Database Setup): RLS patterns, indexing, backups (well-documented, unlikely to need custom research)
- Phase 3 (Inquiry System): Rate limiting, spam prevention (standard patterns)
- Phase 4 (Monitoring): Error tracking, analytics integration (standard tooling)

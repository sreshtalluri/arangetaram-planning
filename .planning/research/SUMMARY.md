# Project Research Summary

**Project:** Arangetram Planning Marketplace
**Domain:** Two-sided marketplace for Bharatanatyam debut ceremony planning
**Researched:** 2026-02-07
**Confidence:** MEDIUM

## Executive Summary

This is a cultural event planning marketplace connecting users planning Arangetram ceremonies (Bharatanatyam dance debuts) with specialized vendors across 15 service categories. The project involves migrating from a MongoDB + FastAPI + JWT stack to a full Supabase stack (PostgreSQL, Auth, Storage, Realtime, Edge Functions) while adding AI-powered recommendations via Gemini/Emergent LLM. The migration represents a brownfield project with existing users and data requiring careful migration strategy.

The recommended approach centers on Supabase as the integrated backend (eliminating 60-70% of current backend code), React 19 + TanStack Query on the frontend, and a hybrid recommendation engine combining PostgreSQL filtering with LLM-based ranking. The architecture follows a Row Level Security (RLS) first model where security policies live at the database layer, not in application code. Edge Functions handle only AI calls and complex business logic—most CRUD operations become direct client-to-database queries protected by RLS.

**Key risks:** (1) RLS policies must be enabled on all tables from day one—missing policies create critical security vulnerabilities, (2) marketplace cold start requires manually seeding 20-30 quality vendors before public launch, (3) AI recommendation latency (2-3s for LLM calls) demands progressive loading UX, and (4) password hash incompatibility during auth migration requires gradual migration strategy. These risks are all mitigable with the prevention strategies documented in research.

## Key Findings

### Recommended Stack

The migration eliminates most backend infrastructure in favor of Supabase's integrated stack. The core recommendation is **Supabase PostgreSQL + Auth + Storage + Edge Functions** replacing MongoDB + FastAPI + custom JWT, with **React 19 + TanStack Query** on the frontend managing server state. TypeScript becomes essential (not optional) because Supabase generates types from database schema, preventing runtime errors from field mismatches.

**Core technologies:**
- **Supabase PostgreSQL**: Primary database replacing MongoDB. Relational model better suits marketplace data (users ↔ events ↔ bookings ↔ vendors) with foreign key integrity.
- **Supabase Auth**: Replaces custom JWT implementation. Includes session refresh, magic links, OAuth, and RLS integration out of box.
- **TanStack Query v5**: NEW ADDITION for server state management. Standard pattern for Supabase + React. Handles caching, refetching, optimistic updates for database queries.
- **Supabase Edge Functions (Deno)**: Replaces FastAPI but only for AI calls and complex business logic. Most CRUD moves to direct queries.
- **TypeScript**: NEW ADDITION (currently JavaScript). Supabase type generation from schema is critical for preventing database mismatches at build time.
- **Existing UI stack preserved**: Radix UI, Tailwind, React Hook Form, Zod all remain—no breaking changes to UI layer.

**What eliminates:** JWT token generation/validation, password hashing, session middleware, authorization middleware, CORS config, and most CRUD endpoints (~60-70% backend code reduction).

### Expected Features

The platform needs comprehensive vendor categorization (15 categories from venue to musicians to costume rental), budget allocation guidance (users don't know typical % splits), timeline planning (booking lead times vary 1-12 months by category), and comparison/curation tools for managing multiple quotes. The existing app has basic vendor browsing and booking—what's missing is the orchestration layer that treats Arangetram planning as a coordinated multi-vendor project, not individual transactions.

**Must have (table stakes):**
- All 15 vendor categories with cultural context (explain what nattuvanar is, why musicians matter)
- Filter by location, budget range, availability
- Vendor portfolios with image galleries
- Event profile creation (store date, location, budget once)
- Mark categories as "covered" (many via dance school connections)
- Inquiry/quote request system with status tracking
- User and vendor authentication

**Should have (competitive advantages):**
- Budget allocation guidance showing typical % ranges per category
- Timeline planning with recommended booking lead times
- AI-powered vendor recommendations with explanations
- Comparison tools (side-by-side vendor comparison per category)
- Cultural context in category descriptions (first-time planner education)
- Vendor credential verification badges (especially for musicians, nattuvanar)
- Running budget total as categories filled

**Defer (v2+):**
- In-app payment processing (validate discovery value first; payments happen off-platform initially)
- Real-time chat (email-based inquiry sufficient; add chat if data shows need)
- User-generated reviews (cold-start problem; seed with testimonials first)
- Bilingual interface (English-first MVP, i18n after validation)
- Vendor package deals (single vendors first, packages later)

### Architecture Approach

Multi-tenant PostgreSQL with Row Level Security (RLS) policies enforcing data boundaries at database level. Architecture centers on three core entities: **profiles** (unified user + vendor table with role field), **events** (user planning sessions), and **inquiries** (connection points between users and vendors). The key shift from MongoDB + backend authorization is that security moves from application code to declarative database policies—more secure because policies can't be accidentally bypassed by buggy frontend code.

**Major components:**
1. **React Frontend** — Direct database queries via Supabase client (no backend API layer for CRUD). RLS policies enforce access control.
2. **PostgreSQL + RLS** — Data persistence and access control. Policies like "users read own events" and "public vendor profiles" run at database level.
3. **Edge Functions** — AI/LLM calls only. Hybrid recommendation: PostgreSQL filters by hard constraints (location, category, availability) → Edge Function calls Gemini to rank top 20-50 candidates by soft factors (style fit, experience).
4. **Supabase Storage** — Vendor portfolio images with storage policies (public read, authenticated vendor upload to own folder).
5. **Supabase Realtime** — Selective use for live inquiry notifications and vendor availability updates. Not used for static data like vendor profiles.

**Data flow:** React → Supabase client → PostgreSQL (filtered by RLS) for CRUD. React → Edge Function → Gemini + PostgreSQL for AI recommendations. Triggers maintain denormalized counts (inquiry_count on profiles) and timestamps (responded_at).

### Critical Pitfalls

Research identified 18 pitfalls across critical/moderate/minor categories. Top 5 requiring immediate attention in roadmap structure:

1. **RLS Policies Missing on New Tables** — Without RLS, all data becomes publicly accessible via auto-generated API. Coming from MongoDB (no RLS concept), developers forget to enable policies. PREVENTION: Migration template that enables RLS by default, checklist for every new table, database test to audit missing policies.

2. **Auth Migration Password Hash Incompatibility** — Attempting to migrate MongoDB users to Supabase Auth but password hashes incompatible. Forces mass password reset (terrible UX). PREVENTION: Gradual migration strategy—keep MongoDB auth running alongside, migrate user on successful login, phase out after 90 days.

3. **Marketplace Cold Start (No Vendors)** — Classic chicken-egg. Users won't join without vendors; vendors won't join without users. PREVENTION: Manually recruit 20-30 seed vendors before public launch, offer free premium for 6 months, launch in ONE city for density.

4. **AI Recommendation Latency (5-10 seconds)** — LLM API calls take 2-3s, users bounce before seeing results. PREVENTION: Progressive disclosure (show filtered results immediately, display "AI enhancing..." loader, stream LLM results), aggressive caching (24h TTL), async processing with Realtime update.

5. **RLS Performance N+1 Queries** — Complex RLS policies with JOINs/subqueries slow exponentially. Vendor list takes 10+ seconds. PREVENTION: Keep policies simple (direct column comparisons only), index columns used in policies, avoid subqueries in USING clauses.

## Implications for Roadmap

Based on research findings, suggested phase structure prioritizes foundation (auth + schema with RLS), vendor supply before user features, PostgreSQL filtering before AI enhancement, and connection flow last. Total estimated timeline: 10-12 weeks to MVP.

### Phase 1: Foundation & Migration (Weeks 1-2)
**Rationale:** All subsequent phases depend on Supabase infrastructure and secure database foundation. RLS must be correct from day one—retrofitting security is expensive and dangerous.
**Delivers:** Supabase project setup, core schema (profiles, events, inquiries) with RLS policies, auth migration strategy, user/vendor signup and profile management.
**Addresses:** Critical Pitfall #1 (RLS missing) via migration template, Pitfall #2 (auth migration) via gradual strategy, TypeScript setup for type safety.
**Avoids:** Creating tables without RLS (security vulnerability), attempting bulk password migration (user experience disaster).
**Key decisions:** Auth migration approach (gradual vs forced reset), schema normalization (unified profiles table vs separate user/vendor tables), RLS policy testing strategy.

### Phase 2: Vendor Supply & Discovery (Weeks 3-4)
**Rationale:** Marketplace requires vendor supply first. Without vendors, no user value. Seed manually before building user-facing features.
**Delivers:** Vendor browsing with filters (category, location, price—no AI yet), Storage setup for portfolio uploads, complete vendor profile pages, basic PostgreSQL search (full-text search, not just LIKE queries).
**Addresses:** Critical Pitfall #3 (cold start) via manual vendor recruitment goal (20-30 vendors), Pitfall #10 (storage limits) via upload size restrictions and image optimization, all 15 vendor categories with cultural context descriptions.
**Avoids:** Building user inquiry system before vendors exist, allowing unlimited image uploads without optimization, using basic LIKE queries for search.
**Key decisions:** Which city/region to launch first (geographic focus), vendor approval workflow (manual vs automatic), portfolio photo limits (5 free, 20 premium).

### Phase 3: Event Planning & Matching (Weeks 5-6)
**Rationale:** Once vendor supply exists, enable users to define needs and discover matches. PostgreSQL filtering first validates UX before adding AI complexity.
**Delivers:** Event creation with category requirements, mark categories as "covered" (already have vendor), vendor availability calendar system, PostgreSQL-only recommendations (filtering by constraints, no AI ranking yet).
**Addresses:** Budget allocation guidance feature (typical % per category), timeline planning (recommended booking lead times), vendor category explanations (cultural context).
**Avoids:** Trying to implement AI before validating basic filtering works, allowing users to create events without understanding categories needed.
**Key decisions:** Event data model (JSONB for category_requirements flexibility), availability system design (date blocking vs availability windows), budget guidance sources (research estimates vs real vendor data).

### Phase 4: AI Enhancement (Weeks 7-8)
**Rationale:** With working PostgreSQL filters, add AI as enhancement not dependency. Hybrid approach (filter → rank) keeps costs low and latency manageable.
**Delivers:** Edge Function for vendor recommendations (Gemini integration), AI ranking with explanations, recommendation caching (24h TTL), chat assistant for planning questions.
**Addresses:** Critical Pitfall #4 (AI latency) via progressive loading and caching, Pitfall #7 (LLM hallucinations) via ranking-only (not fact generation), AI recommendation feature as competitive differentiator.
**Avoids:** Blocking user flow on LLM response, allowing LLM to generate vendor facts (hallucination risk), calling LLM on every search (cost explosion).
**Key decisions:** LLM model selection (GPT-4 vs Claude vs Gemini), prompt engineering for vendor ranking, cache invalidation strategy, timeout handling for slow API calls.
**Research flag:** NEEDS DEEPER RESEARCH—specific LLM integration patterns, cost optimization, prompt engineering for vendor ranking quality.

### Phase 5: Connection & Inquiry Flow (Weeks 9-10)
**Rationale:** With vendors listed and matching working, enable connection. Requires vendor supply + event creation working first.
**Delivers:** Inquiry submission system, Realtime setup for live notifications, vendor dashboard for managing inquiries, status tracking (pending → accepted/declined/withdrawn).
**Addresses:** Inquiry/quote feature (table stakes), vendor response tracking, Realtime for inquiry count badges and status updates.
**Avoids:** Pitfall #14 (no rate limiting) via database-level inquiry throttling and CAPTCHA for suspicious patterns, Pitfall #8 (Realtime overuse) via selective subscription (inquiry updates only, not vendor browsing).
**Key decisions:** Rate limiting thresholds (5 inquiries per 10 minutes?), email notification strategy (instant vs digest), inquiry form per-category customization.

### Phase 6: Curation & Polish (Weeks 11-12)
**Rationale:** Core flow working, add tools for decision-making and prepare for launch.
**Delivers:** Plan curation UI (compare vendors side-by-side, swap vendors, total cost view), email notifications for inquiry lifecycle, guest browsing (no account needed), performance optimization (index tuning).
**Addresses:** Comparison tools (competitive feature), guest access for discovery (reduce signup friction), monitoring setup (error tracking, performance metrics).
**Avoids:** Requiring signup before browsing (friction), launching without error tracking (blind to production issues).
**Key decisions:** Comparison UI design (per-category vs all-vendors view), email provider selection (SendGrid vs Resend), monitoring tool choices (Sentry + PostHog?).

### Phase Ordering Rationale

- **Foundation first (RLS + auth)** — Security can't be retrofitted. All features depend on correct access control.
- **Vendor supply before user features** — Marketplace is worthless without vendors. Manual recruitment happens during Phase 2, before inquiry system exists.
- **PostgreSQL filtering before AI** — Validates UX and keeps AI as enhancement, not blocker. If LLM integration fails, basic filtering still works.
- **AI as enhancement, not dependency** — Phase 4 can slip without breaking core value. Users get working search in Phase 3.
- **Connection flow last** — Requires both vendors (Phase 2) and event creation (Phase 3) working. Building inquiry system before these exists creates empty experience.

### Research Flags

**Phases likely needing deeper research during planning:**

- **Phase 4 (AI Integration)** — Specific Gemini API integration patterns, prompt engineering for vendor ranking quality, cost optimization strategies, error handling for LLM timeouts. Research was based on general LLM patterns, not Gemini-specific details.

- **Phase 1 (Data Migration)** — Exact MongoDB → PostgreSQL schema mapping depends on current data model (not available during research). Transformation logic for nested documents → relational tables needs codebase examination.

- **Phase 2 (Search)** — Domain-specific synonym mapping for event planning terminology (e.g., "dance teacher" → "Bharatanatyam instructor"), fuzzy matching tuning for common typos, full-text search configuration for cultural terms.

**Phases with standard patterns (skip research-phase):**

- **Phase 1 (Database Setup)** — RLS policies, PostgreSQL indexing, Supabase Auth configuration are well-documented with established patterns.

- **Phase 3 (CRUD Operations)** — Event creation, vendor browsing, basic filtering follow standard Supabase patterns documented in official guides.

- **Phase 5 (Inquiry System)** — Rate limiting, spam prevention, notification systems have standard implementations.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | MEDIUM | Standard Supabase + React pattern, but versions unverified against current docs (training cutoff Jan 2025, current date Feb 2026) |
| Features | MEDIUM | Vendor categories culturally validated, feature prioritization based on marketplace patterns, but budget percentages and lead times are estimates not verified with real vendor data |
| Architecture | MEDIUM to HIGH | Core patterns (RLS, multi-tenant, hybrid AI) are proven approaches, but Edge Function specifics and Realtime scale limits need validation during implementation |
| Pitfalls | MEDIUM to HIGH | RLS security patterns HIGH confidence (fundamental Supabase), AI integration pitfalls MEDIUM (general patterns), marketplace cold start HIGH (well-studied problem) |

**Overall confidence:** MEDIUM

Research provides solid foundation for roadmap decisions, but external verification was unavailable (no web access during research). All recommendations based on training data patterns and established best practices as of January 2025.

### Gaps to Address

- **Supabase version currency** — Package versions (@supabase/supabase-js, auth-helpers-react) need verification against official docs. Training data from Jan 2025, implementation will be Feb 2026 or later. Recommendation: Check Supabase changelog for breaking changes in past year.

- **MongoDB schema details** — Data migration strategy depends on actual MongoDB document structure. Research assumed typical event marketplace schema but can't provide exact transformation logic without examining codebase. Recommendation: Phase 1 planning should include MongoDB schema audit before finalizing migration approach.

- **Actual vendor data** — Budget percentages (catering 20-30%, venue 15-25%) and booking lead times (musicians 6-12 months) are estimates based on general event planning knowledge, not validated with Arangetram vendors. Recommendation: Validate during Phase 2 vendor recruitment, adjust guidance based on real vendor quotes.

- **LLM API specifics** — Research covered general LLM integration patterns (hybrid filtering, caching, latency mitigation) but couldn't verify Gemini/Emergent LLM SDK 0.1.0 current API. Recommendation: Phase 4 planning should include API documentation review and prototype testing before committing to model choice.

- **Cultural terminology** — Search synonym mapping and category descriptions need validation with actual Arangetram planners and vendors. Research based on cultural knowledge may miss region-specific variations (Tamil Nadu vs Karnataka traditions). Recommendation: User research during Phase 2 (vendor interviews) and Phase 3 (user onboarding) to refine terminology.

## Sources

### Primary (MEDIUM confidence)
- **Training data (Jan 2025 cutoff)** — Supabase documentation patterns, PostgreSQL RLS best practices, marketplace architecture patterns, LLM integration approaches. Comprehensive but unverified against current state (Feb 2026).
- **Cultural domain knowledge** — Arangetram ceremony structure, vendor categories, event planning requirements. Based on Bharatanatyam tradition knowledge.
- **Existing codebase context (PROJECT.md)** — Current tech stack (MongoDB, FastAPI, React 19, Radix UI), project structure, active milestones. Verified from project documentation.

### Secondary (MEDIUM confidence)
- **Two-sided marketplace patterns** — Cold start problem, supply-side prioritization, curation vs quantity tradeoffs. Well-studied in platform literature (Reid Hoffman, Bill Gurley).
- **Event planning marketplace best practices** — Budget allocation guidance, timeline planning, vendor comparison tools. Generalized from wedding/event platforms (The Knot, PartySlate patterns).

### Tertiary (LOW confidence - needs validation)
- **Budget percentages by category** — 20-30% catering, 15-25% venue, 8-12% photography. Estimates based on general event planning, not Arangetram-specific data.
- **Booking lead times** — 9-12 months for venue, 6-9 months for musicians. Logical estimates but not validated with actual vendor booking patterns.
- **Supabase Realtime scale limits** — Connection thresholds and fallback strategies need load testing. Training data patterns may not reflect current Supabase infrastructure.

---
*Research completed: 2026-02-07*
*Ready for roadmap: yes*

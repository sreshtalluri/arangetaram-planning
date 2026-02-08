# Roadmap: Arangetram Planner

## Overview

This roadmap transforms the existing MongoDB + FastAPI codebase into a Supabase-powered marketplace. The journey starts with migrating infrastructure and authentication (Phase 1), enables vendor supply creation (Phase 2), adds user event planning and discovery (Phase 3), enhances with AI recommendations (Phase 4), and completes with the inquiry/connection flow (Phase 5). Each phase delivers a working capability that builds toward the core value: users discover the right vendors for their needs, budget, and location.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Foundation & Authentication** - Supabase migration with secure database and auth
- [ ] **Phase 2: Vendor Supply Platform** - Vendor profiles, categories, availability, and dashboard
- [ ] **Phase 3: Event Planning & Discovery** - Event creation and vendor browsing with filters
- [ ] **Phase 4: AI Enhancement** - AI-powered recommendations and chat assistant
- [ ] **Phase 5: Inquiry & Connection** - User-vendor inquiry system with status tracking

## Phase Details

### Phase 1: Foundation & Authentication
**Goal**: Supabase infrastructure is operational with secure multi-tenant database and working authentication for users and vendors
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-04, INFRA-05, AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. User can create account with email/password and role is set correctly
  2. User can log in and session persists across browser refresh
  3. User can log out from any page
  4. Guest can browse without creating account
  5. Vendor can create account with vendor role
  6. All database tables have Row Level Security policies enabled (no public data leaks)
  7. TypeScript types are generated from database schema
**Plans**: 6 plans

Plans:
- [ ] 01-01-PLAN.md — Supabase infrastructure setup, database schema with RLS, TypeScript types
- [ ] 01-02-PLAN.md — Supabase client singleton and auth library functions
- [ ] 01-03-PLAN.md — React Query setup with QueryClient and useProfile hook
- [ ] 01-04-PLAN.md — AuthContext with Supabase integration and ProtectedRoute
- [ ] 01-05-PLAN.md — Auth UI pages (signup, login, password reset, email callback)
- [ ] 01-06-PLAN.md — Guest experience, logout, protected dashboards, cleanup old auth

### Phase 2: Vendor Supply Platform
**Goal**: Vendors can create complete profiles with portfolios, manage availability, and access their dashboard
**Depends on**: Phase 1 (requires auth and database)
**Requirements**: INFRA-03, CAT-01, CAT-02, CAT-03, CAT-04, CAT-05, CAT-06, CAT-07, CAT-08, CAT-09, CAT-10, CAT-11, VEND-01, VEND-02, VEND-03, VEND-04, VEND-05, VEND-06, VEND-07, AVAIL-01, AVAIL-02, AVAIL-03, AVAIL-04, VDASH-01, VDASH-02, VDASH-03, VDASH-04
**Success Criteria** (what must be TRUE):
  1. Platform supports all 11 vendor categories with cultural context descriptions
  2. Vendor can create profile with business name, description, category, service areas, and pricing
  3. Vendor can upload portfolio images and see them displayed on profile
  4. Vendor can edit their profile at any time
  5. Vendor can manage availability calendar (mark dates as booked/unavailable)
  6. Vendor availability is visible when users browse vendor profiles
  7. Vendor profile displays in public vendor listings
  8. Vendor can access dashboard showing their profile and availability
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 3: Event Planning & Discovery
**Goal**: Users can create events, browse vendors with filters, and view detailed vendor profiles
**Depends on**: Phase 2 (requires vendor profiles to exist)
**Requirements**: EVENT-01, EVENT-02, EVENT-03, EVENT-04, EVENT-05, EVENT-06, EVENT-07, DISC-01, DISC-02, DISC-03, DISC-04, DISC-05, DISC-06, DISC-07, DISC-08, DASH-01, DASH-02, DASH-03
**Success Criteria** (what must be TRUE):
  1. User can create event with name, date, location, guest count, budget, and needed categories
  2. User can mark categories as "covered" (already have vendor)
  3. User can edit their event details at any time
  4. User can browse all vendors with filters (category, location, price range, availability)
  5. User can search vendors by name or keyword
  6. User can view vendor detail page with full profile and portfolio
  7. User can filter vendors by availability for their event date
  8. User dashboard shows their events and category coverage status
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 4: AI Enhancement
**Goal**: Users receive AI-powered vendor recommendations with explanations and can use chat assistant for planning questions
**Depends on**: Phase 3 (requires event creation and vendor discovery working)
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, CHAT-01, CHAT-02, CHAT-03, CHAT-04
**Success Criteria** (what must be TRUE):
  1. User receives vendor recommendations based on their event details
  2. Recommendations use hybrid approach (database filter then AI ranking)
  3. Each recommendation includes AI explanation of why vendor is suggested
  4. User can refresh recommendations with updated preferences
  5. Recommendations respect user's budget constraints
  6. User can access AI chat assistant from any page
  7. Chat assistant answers Arangetram planning questions with event context
  8. Chat maintains conversation history within session
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

### Phase 5: Inquiry & Connection
**Goal**: Users can send inquiries to vendors and track status; vendors can receive, view, and respond to inquiries
**Depends on**: Phase 3 (requires event creation and vendor profiles; AI optional)
**Requirements**: INQ-01, INQ-02, INQ-03, INQ-04, INQ-05, INQ-06, INQ-07
**Success Criteria** (what must be TRUE):
  1. User can send inquiry to vendor from vendor profile page
  2. Inquiry automatically includes user's event details
  3. User can add custom message to inquiry
  4. User can view status of sent inquiries (pending/accepted/declined)
  5. User can view vendor's response or quote
  6. Vendor can view list of received inquiries
  7. Vendor can respond to inquiry (accept/decline/provide quote)
  8. Vendor dashboard shows inquiry statistics
**Plans**: TBD

Plans:
- [ ] TBD during plan-phase

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation & Authentication | 0/6 | Ready to execute | - |
| 2. Vendor Supply Platform | 0/TBD | Not started | - |
| 3. Event Planning & Discovery | 0/TBD | Not started | - |
| 4. AI Enhancement | 0/TBD | Not started | - |
| 5. Inquiry & Connection | 0/TBD | Not started | - |

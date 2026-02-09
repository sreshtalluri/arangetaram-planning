# Requirements: Arangetram Planner

**Defined:** 2026-02-07
**Core Value:** Users discover the right vendors for their needs, budget, and location

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Infrastructure

- [x] **INFRA-01**: Migrate database from MongoDB to Supabase PostgreSQL
- [x] **INFRA-02**: Replace JWT auth with Supabase Auth (email/password)
- [x] **INFRA-03**: Implement Supabase Storage for vendor media
- [x] **INFRA-04**: Configure Row Level Security policies on all tables
- [x] **INFRA-05**: Set up TypeScript with generated database types

### Authentication

- [x] **AUTH-01**: User can create account with email and password
- [x] **AUTH-02**: User can log in with email and password
- [x] **AUTH-03**: User session persists across browser refresh
- [x] **AUTH-04**: User can log out from any page
- [x] **AUTH-05**: User can browse vendors without creating account (guest)
- [x] **AUTH-06**: Vendor can create account with vendor role

### Vendor Categories

- [x] **CAT-01**: Platform supports venue vendors
- [x] **CAT-02**: Platform supports catering vendors
- [x] **CAT-03**: Platform supports photography vendors
- [x] **CAT-04**: Platform supports videography vendors
- [x] **CAT-05**: Platform supports stage decoration vendors
- [x] **CAT-06**: Platform supports musician vendors
- [x] **CAT-07**: Platform supports nattuvanar vendors
- [x] **CAT-08**: Platform supports makeup artist vendors
- [x] **CAT-09**: Platform supports invitation/printing vendors
- [x] **CAT-10**: Platform supports costume/jewelry rental vendors
- [x] **CAT-11**: Platform supports return gift vendors

### Vendor Profiles

- [x] **VEND-01**: Vendor can create profile with business name and description
- [x] **VEND-02**: Vendor can select service category
- [x] **VEND-03**: Vendor can specify service areas (cities/metros)
- [x] **VEND-04**: Vendor can upload portfolio images
- [x] **VEND-05**: Vendor can set pricing information (packages or ranges)
- [x] **VEND-06**: Vendor can edit their profile at any time
- [x] **VEND-07**: Vendor profile displays in public vendor listings

### Vendor Availability

- [x] **AVAIL-01**: Vendor can manage availability calendar
- [x] **AVAIL-02**: Vendor can mark dates as booked/unavailable
- [x] **AVAIL-03**: Availability is visible when users browse vendors
- [x] **AVAIL-04**: Users can filter vendors by availability for their event date

### Event Planning

- [x] **EVENT-01**: User can create event profile with name and date
- [x] **EVENT-02**: User can specify event location (city/metro)
- [x] **EVENT-03**: User can specify expected guest count
- [x] **EVENT-04**: User can set total budget
- [x] **EVENT-05**: User can select which vendor categories they need
- [x] **EVENT-06**: User can mark categories as "covered" (already have vendor)
- [x] **EVENT-07**: User can view and edit their event details

### Vendor Discovery

- [x] **DISC-01**: User can browse all vendors
- [x] **DISC-02**: User can filter vendors by category
- [x] **DISC-03**: User can filter vendors by location/service area
- [x] **DISC-04**: User can filter vendors by price range
- [x] **DISC-05**: User can filter vendors by availability for event date
- [x] **DISC-06**: User can search vendors by name or keyword
- [x] **DISC-07**: User can view vendor detail page with full profile
- [x] **DISC-08**: User can view vendor portfolio images

### AI Recommendations

- [ ] **AI-01**: System provides vendor recommendations based on event details
- [ ] **AI-02**: Recommendations use hybrid approach (database filter + AI ranking)
- [ ] **AI-03**: AI explains why each vendor is recommended
- [ ] **AI-04**: User can refresh recommendations with updated preferences
- [ ] **AI-05**: Recommendations respect user's budget constraints

### AI Chat Assistant

- [ ] **CHAT-01**: User can access AI chat assistant from any page
- [ ] **CHAT-02**: Chat assistant answers Arangetram planning questions
- [ ] **CHAT-03**: Chat assistant has context of user's event details
- [ ] **CHAT-04**: Chat maintains conversation history within session

### Inquiry System

- [ ] **INQ-01**: User can send inquiry to vendor from vendor profile
- [ ] **INQ-02**: Inquiry includes user's event details automatically
- [ ] **INQ-03**: User can add custom message to inquiry
- [ ] **INQ-04**: Vendor can view list of received inquiries
- [ ] **INQ-05**: Vendor can respond to inquiry (accept/decline/provide quote)
- [ ] **INQ-06**: User can view status of sent inquiries
- [ ] **INQ-07**: User can view vendor's response/quote

### User Dashboard

- [x] **DASH-01**: User can view their events
- [ ] **DASH-02**: User can view sent inquiries and their status
- [x] **DASH-03**: User can see which categories are covered vs pending

### Vendor Dashboard

- [x] **VDASH-01**: Vendor can view their profile
- [x] **VDASH-02**: Vendor can view received inquiries
- [x] **VDASH-03**: Vendor can manage their availability calendar
- [x] **VDASH-04**: Vendor can see inquiry statistics

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### Enhanced Authentication

- **AUTH-V2-01**: User can log in via magic link (passwordless)
- **AUTH-V2-02**: User can log in via Google OAuth

### Planning Tools

- **PLAN-V2-01**: System shows budget allocation guidance (typical % per category)
- **PLAN-V2-02**: System shows recommended booking timeline by category
- **PLAN-V2-03**: User can compare vendors side-by-side
- **PLAN-V2-04**: User can see running total of estimated costs

### Notifications

- **NOTIF-V2-01**: User receives email when vendor responds to inquiry
- **NOTIF-V2-02**: Vendor receives email when new inquiry arrives
- **NOTIF-V2-03**: Real-time inquiry status updates via Supabase Realtime

### Extended Categories

- **CAT-V2-01**: Platform supports floral decoration vendors
- **CAT-V2-02**: Platform supports mehendi/henna artists
- **CAT-V2-03**: Platform supports transportation vendors
- **CAT-V2-04**: Platform supports emcee/host vendors

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| In-app payments | Validate discovery value before building transaction infrastructure |
| User-generated reviews | Cold start problem; seed with testimonials, add user reviews post-MVP |
| Vendor bidding/auctions | Commoditizes cultural services where relationship matters more than price |
| Bilingual interface (Tamil/Telugu) | English-first; add i18n after validation |
| Mobile native apps | Responsive web covers mobile use cases |
| Real-time chat | Contact happens off-platform for MVP; email-based inquiry sufficient |
| Fully automated booking | High-touch services need human coordination |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Complete |
| INFRA-02 | Phase 1 | Complete |
| INFRA-03 | Phase 2 | Complete |
| INFRA-04 | Phase 1 | Complete |
| INFRA-05 | Phase 1 | Complete |
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Complete |
| AUTH-03 | Phase 1 | Complete |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Complete |
| AUTH-06 | Phase 1 | Complete |
| CAT-01 | Phase 2 | Complete |
| CAT-02 | Phase 2 | Complete |
| CAT-03 | Phase 2 | Complete |
| CAT-04 | Phase 2 | Complete |
| CAT-05 | Phase 2 | Complete |
| CAT-06 | Phase 2 | Complete |
| CAT-07 | Phase 2 | Complete |
| CAT-08 | Phase 2 | Complete |
| CAT-09 | Phase 2 | Complete |
| CAT-10 | Phase 2 | Complete |
| CAT-11 | Phase 2 | Complete |
| VEND-01 | Phase 2 | Complete |
| VEND-02 | Phase 2 | Complete |
| VEND-03 | Phase 2 | Complete |
| VEND-04 | Phase 2 | Complete |
| VEND-05 | Phase 2 | Complete |
| VEND-06 | Phase 2 | Complete |
| VEND-07 | Phase 2 | Complete |
| AVAIL-01 | Phase 2 | Complete |
| AVAIL-02 | Phase 2 | Complete |
| AVAIL-03 | Phase 2 | Complete |
| AVAIL-04 | Phase 2 | Complete |
| VDASH-01 | Phase 2 | Complete |
| VDASH-02 | Phase 2 | Complete |
| VDASH-03 | Phase 2 | Complete |
| VDASH-04 | Phase 2 | Complete |
| EVENT-01 | Phase 3 | Complete |
| EVENT-02 | Phase 3 | Complete |
| EVENT-03 | Phase 3 | Complete |
| EVENT-04 | Phase 3 | Complete |
| EVENT-05 | Phase 3 | Complete |
| EVENT-06 | Phase 3 | Complete |
| EVENT-07 | Phase 3 | Complete |
| DISC-01 | Phase 3 | Complete |
| DISC-02 | Phase 3 | Complete |
| DISC-03 | Phase 3 | Complete |
| DISC-04 | Phase 3 | Complete |
| DISC-05 | Phase 3 | Complete |
| DISC-06 | Phase 3 | Complete |
| DISC-07 | Phase 3 | Complete |
| DISC-08 | Phase 3 | Complete |
| DASH-01 | Phase 3 | Complete |
| DASH-02 | Phase 5 | Pending |
| DASH-03 | Phase 3 | Complete |
| AI-01 | Phase 4 | Pending |
| AI-02 | Phase 4 | Pending |
| AI-03 | Phase 4 | Pending |
| AI-04 | Phase 4 | Pending |
| AI-05 | Phase 4 | Pending |
| CHAT-01 | Phase 4 | Pending |
| CHAT-02 | Phase 4 | Pending |
| CHAT-03 | Phase 4 | Pending |
| CHAT-04 | Phase 4 | Pending |
| INQ-01 | Phase 5 | Pending |
| INQ-02 | Phase 5 | Pending |
| INQ-03 | Phase 5 | Pending |
| INQ-04 | Phase 5 | Pending |
| INQ-05 | Phase 5 | Pending |
| INQ-06 | Phase 5 | Pending |
| INQ-07 | Phase 5 | Pending |

**Coverage:**
- v1 requirements: 71 total
- Mapped to phases: 71
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-07*
*Last updated: 2026-02-09 after Phase 3 completion*

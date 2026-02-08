# Arangetram Planner

## What This Is

A two-sided marketplace that helps families plan their Arangetram (Bharatanatyam debut ceremony) by discovering and connecting with vendors across all ceremony needs — venue, catering, photography, musicians, stage decoration, and more. Users enter their event details and get AI-powered recommendations they can curate into their perfect plan. Vendors manage their profiles, availability, and inquiries.

## Core Value

Users discover the right vendors for their needs, budget, and location. Everything else supports this.

## Requirements

### Validated

<!-- Existing capabilities from current codebase -->

- ✓ User authentication (register/login) — existing
- ✓ Guest access for browsing — existing
- ✓ Vendor profile display with portfolio images — existing
- ✓ Vendor browsing with category/location/price filters — existing
- ✓ Event creation with date, budget, location, categories — existing
- ✓ AI chat assistant for planning questions — existing
- ✓ Basic vendor recommendations by category — existing
- ✓ Booking request workflow (pending/accepted/declined) — existing
- ✓ User dashboard showing events and bookings — existing
- ✓ Vendor dashboard showing profile and bookings — existing

### Active

<!-- Current scope: Supabase migration + enhanced MVP -->

**Infrastructure Migration**
- [ ] Migrate database from MongoDB to Supabase PostgreSQL
- [ ] Replace JWT auth with Supabase Auth
- [ ] Implement Supabase Storage for vendor media
- [ ] Set up Supabase Realtime for live updates
- [ ] Configure Supabase Edge Functions for AI/backend logic

**Enhanced User Experience**
- [ ] Categories marked as optional ("I've got this covered")
- [ ] Hybrid recommendation engine (filter + AI ranking with explanations)
- [ ] Plan curation view to swap vendors and compare options
- [ ] Inquiry-based contact flow with vendor details display

**Vendor Platform**
- [ ] Vendor availability calendar management
- [ ] Inquiry tracking with status management
- [ ] Enhanced profile with service packages and pricing

**Expanded Categories**
- [ ] Support all Arangetram vendor types: venue, catering, photographer, videographer, stage decoration, musicians, makeup artists, invitations, nattuvanar, return gifts, costume/jewelry rental

### Out of Scope

- In-app payments/booking transactions — future milestone after inquiry flow validated
- Mobile native apps — web-first, responsive design covers mobile use
- Real-time chat between users and vendors — contact happens off-platform for MVP
- Vendor reviews/ratings submission — display only for MVP, user-generated reviews later
- Multi-event management — one event per user for MVP
- Vendor subscription/premium tiers — all vendors equal for MVP

## Context

**Domain:** Arangetram is a Bharatanatyam dancer's solo debut performance, typically organized by the dancer's family. It requires coordinating many vendors: venue (often a temple or auditorium), catering (South Indian cuisine), photography/videography, stage decoration (traditional kolam/rangoli, backdrop), live musicians, makeup, printed invitations, nattuvanar (rhythm recitation), return gifts for guests, and sometimes costume/jewelry rental.

**Target Users:**
- Parents/families planning their child's Arangetram
- Adult dancers planning their own debut
- Vendors serving the South Indian cultural event market

**Geography:** Major US metros with significant South Indian communities — Bay Area, Los Angeles, Houston, Dallas, Chicago, NYC/NJ area, Atlanta, Seattle, and others.

**Existing Codebase:** React 19 frontend with Radix UI components, FastAPI backend with MongoDB. Being rebuilt on Supabase while preserving UI patterns and component library.

**Vendor Supply Strategy:** Hybrid — seed initial vendors to ensure quality supply, then open self-signup.

## Constraints

- **Tech Stack:** Supabase (PostgreSQL, Auth, Storage, Realtime, Edge Functions) + React frontend — clean rebuild, not incremental migration
- **AI Provider:** Keep Gemini/Emergent LLM integration for recommendations and chat
- **MVP Scope:** Inquiry-based contact only — no payment processing
- **Design:** Preserve existing Tailwind + Radix UI component patterns

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Clean Supabase rebuild vs incremental migration | Allows proper data model design, avoids dual-system complexity | — Pending |
| Hybrid recommendation engine | Pure filtering misses nuance; pure AI is slow and expensive | — Pending |
| All categories optional | Users often have existing relationships via dance schools | — Pending |
| Inquiry-based MVP (no payments) | Validate discovery value before building transaction infrastructure | — Pending |

---
*Last updated: 2026-02-07 after initialization*

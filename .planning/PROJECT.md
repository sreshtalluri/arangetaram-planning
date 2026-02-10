# Arangetram Planner

## What This Is

A two-sided marketplace that helps families plan their Arangetram (Bharatanatyam debut ceremony) by discovering and connecting with vendors across all ceremony needs — venue, catering, photography, musicians, stage decoration, and more. Users enter their event details and get AI-powered recommendations they can curate into their perfect plan. Vendors manage their profiles, availability, and inquiries.

## Core Value

Users discover the right vendors for their needs, budget, and location. Everything else supports this.

## Current State (v1.0 Shipped)

**Tech Stack:**
- Frontend: React 19, TypeScript, Tailwind CSS, Radix UI, React Query
- Backend: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- AI: Groq/Llama 3.3 70B for recommendations and chat

**Codebase:**
- ~13,500 lines of TypeScript/JavaScript/SQL
- 7 database migrations
- 2 Edge Functions (ai-chat, ai-recommendations)

**Capabilities:**
- User/vendor authentication with role-based routing
- Vendor profiles with portfolios and availability calendars
- Event creation with category tracking
- Vendor discovery with filters (category, location, price, availability)
- AI-powered recommendations with explanations
- AI chat assistant with event context
- Inquiry system with status tracking and contact reveal

## Requirements

### Validated (v1.0)

- ✓ Supabase migration (PostgreSQL, Auth, Storage, Edge Functions) — v1.0
- ✓ User/vendor authentication with roles — v1.0
- ✓ All 11 Arangetram vendor categories — v1.0
- ✓ Vendor profiles with portfolios and availability — v1.0
- ✓ Event creation with category needs/covered tracking — v1.0
- ✓ Vendor discovery with filters — v1.0
- ✓ AI recommendations (hybrid filter + ranking) — v1.0
- ✓ AI chat assistant with event context — v1.0
- ✓ Inquiry system with status and contact reveal — v1.0
- ✓ User and vendor dashboards — v1.0

### Active

(To be defined for next milestone)

### Out of Scope

- In-app payments/booking transactions — validate discovery value first
- Mobile native apps — web-first, responsive design covers mobile
- Real-time chat between users and vendors — contact happens off-platform
- User-generated reviews — display only for MVP, user-generated later
- Multi-event management — one event per user for MVP
- Vendor subscription/premium tiers — all vendors equal for MVP

## Context

**Domain:** Arangetram is a Bharatanatyam dancer's solo debut performance, typically organized by the dancer's family. It requires coordinating many vendors: venue (often a temple or auditorium), catering (South Indian cuisine), photography/videography, stage decoration (traditional kolam/rangoli, backdrop), live musicians, makeup, printed invitations, nattuvanar (rhythm recitation), return gifts for guests, and sometimes costume/jewelry rental.

**Target Users:**
- Parents/families planning their child's Arangetram
- Adult dancers planning their own debut
- Vendors serving the South Indian cultural event market

**Geography:** Major US metros with significant South Indian communities — Bay Area, Los Angeles, Houston, Dallas, Chicago, NYC/NJ area, Atlanta, Seattle, and others.

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Supabase rebuild (not incremental migration) | Proper data model design, avoid dual-system complexity | ✓ Good |
| RLS on all tables from day one | Multi-tenant security critical for marketplace | ✓ Good |
| Groq/Llama for AI (not Anthropic) | Free tier sufficient for MVP, 6000 tokens/min | ✓ Good |
| Hybrid AI recommendations | Database filter + AI ranking balances speed and intelligence | ✓ Good |
| Inquiry-based MVP (no payments) | Validate discovery before building transactions | ✓ Good |
| SECURITY DEFINER triggers for RLS | Avoids infinite recursion in cross-table policies | ✓ Good |
| Categories optional ("I've got this covered") | Users often have existing vendor relationships | ✓ Good |

## Constraints

- **Tech Stack:** Supabase + React — established in v1.0
- **AI Provider:** Groq/Llama — working well, keep unless scaling issues
- **MVP Scope:** Inquiry-based contact only — no payment processing yet
- **Design:** Tailwind + Radix UI component patterns established

---
*Last updated: 2026-02-10 after v1.0 milestone*

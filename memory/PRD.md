# Arangetram Event Planning Platform PRD

## Original Problem Statement
Build a website/app that helps with planning an Arangetram (classical dance debut performance). Users can input event details (date, budget, guest count) and receive AI-powered recommendations for vendors (venues, catering, photographers, videographers, decorations, musicians). Users can select, compare, and book vendors. Platform supports both users (families) and vendors with different account types.

## User Personas
1. **Families/Event Planners**: Planning their child's Arangetram, need help finding and coordinating multiple vendors
2. **Guest Users**: Browsing/planning without committing to an account
3. **Vendors**: Service providers (venues, caterers, photographers, etc.) who want to be discovered by families

## Core Requirements
- AI-powered vendor recommendations based on event details
- Guest mode for users (no login required to start planning)
- JWT authentication for vendors
- Booking request system (no payments yet)
- All vendor categories: Venues, Catering, Photographers, Videographers, Decorations, Musicians
- Bay Area geographic focus

## What's Been Implemented (January 2025)

### Backend (FastAPI)
- ✅ JWT Authentication (register, login, guest creation)
- ✅ Vendor CRUD APIs with filtering by category, location, price
- ✅ Event management (create, update, add/remove vendors)
- ✅ Booking request system (create, accept, decline)
- ✅ AI chat endpoint using Gemini 3 Flash
- ✅ AI recommendations endpoint
- ✅ Database seeded with 13 Bay Area vendors

### Frontend (React)
- ✅ Landing page with hero, categories, how-it-works
- ✅ Browse vendors with category tabs, search, price filter
- ✅ Vendor detail page with booking request
- ✅ Event planning wizard with date picker, AI recommendations
- ✅ User dashboard (events, booking requests)
- ✅ Vendor dashboard (profile management, booking management)
- ✅ AI chat assistant (floating widget)
- ✅ Authentication pages (login, register)
- ✅ Design: Playfair Display + Manrope fonts, Crimson/Teal/Gold palette

## Prioritized Backlog

### P0 (Critical - Next Phase)
- [ ] Add vendor portfolio image upload
- [ ] Email notifications for booking requests
- [ ] Vendor reviews and ratings system

### P1 (High Priority)
- [ ] Payment integration (Stripe) for booking deposits
- [ ] Calendar integration for availability management
- [ ] Advanced AI recommendations (learn from user preferences)

### P2 (Medium Priority)
- [ ] Admin dashboard for platform management
- [ ] Multiple event support per user
- [ ] Vendor comparison feature
- [ ] Save/favorite vendors

### P3 (Future Enhancements)
- [ ] Mobile app (React Native)
- [ ] Vendor packages/bundles
- [ ] Event timeline/checklist generator
- [ ] Expand beyond Bay Area

## Technical Stack
- Frontend: React, TailwindCSS, Shadcn/UI
- Backend: FastAPI, MongoDB, JWT Auth
- AI: Gemini 3 Flash via Emergent LLM Key
- Hosting: Emergent Platform

## Next Action Items
1. Add vendor image upload functionality
2. Implement email notifications for booking confirmations
3. Build vendor rating/review system after event completion

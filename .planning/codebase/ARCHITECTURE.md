# Architecture

**Analysis Date:** 2026-02-07

## Pattern Overview

**Overall:** Client-server architecture with React frontend, Python FastAPI backend, and MongoDB database. Modular design separating concerns into API layers, state management, and UI components.

**Key Characteristics:**
- RESTful API with JWT authentication
- Stateless backend with async/await patterns
- React Context API for client-side state management
- Axios for HTTP communication with request/response interceptors
- AI integration via LLM Chat service
- Monorepo structure with separate frontend and backend directories

## Layers

**Frontend UI Layer:**
- Purpose: React components rendering user interfaces with Radix UI primitives
- Location: `frontend/src/components/`
- Contains: Navbar, AIChat, VendorCard, and 47 UI components (dialog, button, form, card, etc.)
- Depends on: React, lucide-react icons, Tailwind CSS
- Used by: Page components

**Page/Route Layer:**
- Purpose: Full-page components representing application routes
- Location: `frontend/src/pages/`
- Contains: LandingPage, LoginPage, RegisterPage, VendorsPage, VendorDetailPage, PlanEventPage, UserDashboard, VendorDashboard
- Depends on: Components, hooks, API library
- Used by: React Router in App.js

**Business Logic Layer (Frontend):**
- Purpose: API communication, authentication, and business logic
- Location: `frontend/src/lib/`
- Contains:
  - `api.js` - Axios instance with interceptors for all CRUD operations (auth, vendors, events, bookings, AI, categories, seed)
  - `auth.js` - AuthContext providing user state and authentication methods
  - `utils.js` - Utility functions
- Depends on: Axios, React Context
- Used by: All pages and components

**API Routes (Backend):**
- Purpose: HTTP endpoints for frontend consumption
- Location: `backend/server.py` (APIRouter with `/api` prefix)
- Contains:
  - `/auth/*` - Authentication (register, login, guest creation, current user)
  - `/vendors/*` - Vendor CRUD and filtering
  - `/events/*` - Event management
  - `/bookings/*` - Booking requests
  - `/ai/*` - AI chat and recommendations
  - `/categories` - Category enumeration
  - `/seed` - Database initialization
- Depends on: FastAPI, Pydantic models, Motor (async MongoDB)
- Used by: Frontend via axios

**Data Models (Backend):**
- Purpose: Define request/response schemas
- Location: `backend/server.py` (Pydantic models)
- Contains: UserBase, UserCreate, UserLogin, UserResponse, GuestCreate, VendorProfile, VendorCreate, VendorUpdate, Event, EventCreate, EventUpdate, BookingRequest, BookingRequestCreate, BookingRequestUpdate, ChatMessage, RecommendationRequest
- Depends on: Pydantic
- Used by: Route handlers for validation and serialization

**Authentication Layer:**
- Purpose: JWT token generation, verification, and user context injection
- Location: `backend/server.py` (create_token, verify_token, get_current_user, get_optional_user)
- Depends on: PyJWT, HTTPBearer
- Used by: Protected routes via Depends()

**Database Layer:**
- Purpose: Async MongoDB operations
- Location: `backend/server.py` (Motor AsyncIOMotorClient)
- Contains: Collections for users, vendors, events, bookings
- Depends on: Motor (async MongoDB driver)
- Used by: All API route handlers

**AI Integration Layer:**
- Purpose: External LLM communication for chat and recommendations
- Location: `backend/server.py` (/ai/chat, /ai/recommendations endpoints)
- Depends on: emergentintegrations.llm.chat (LlmChat, UserMessage)
- Used by: AI endpoints, receives Gemini 3 Flash Preview model

## Data Flow

**Authentication Flow:**

1. User submits credentials or continues as guest
2. Frontend calls `authAPI.register/login/createGuest`
3. Backend validates, creates user in MongoDB, generates JWT token
4. Frontend stores token and user in localStorage
5. Axios interceptor automatically includes Bearer token in all subsequent requests
6. Backend validates token with `get_current_user` dependency on protected routes
7. On 401 response, axios interceptor clears localStorage and redirects to /login

**Event Planning Flow:**

1. User navigates to PlanEventPage or clicks "Start Planning"
2. User enters event details (name, date, guest count, budget, location, categories needed)
3. Frontend calls `aiAPI.getRecommendations` with event parameters
4. Backend queries MongoDB vendors, filters by category/location/price, returns top 3 per category
5. User reviews recommendations and can toggle vendor selection
6. Frontend calls `eventAPI.create` to save event with selected vendors
7. User sends booking requests via `bookingAPI.create`
8. Backend enriches booking response with vendor/event/user details

**AI Chat Flow:**

1. User opens AIChat component
2. User sends message with optional event context
3. Frontend calls `aiAPI.chat` with message and event context
4. Backend retrieves active vendors from MongoDB
5. Backend constructs system prompt with vendor context and event details
6. Backend sends to Gemini via LlmChat with session persistence
7. Response returned to frontend, appended to chat message history
8. Messages persist in component state during session

**Vendor Browsing Flow:**

1. User navigates to VendorsPage
2. Frontend calls `vendorAPI.getAll` with optional filters (category, location, price_range, search)
3. Backend queries MongoDB with regex patterns, returns up to 100 vendors
4. Frontend renders vendor cards
5. User clicks vendor detail
6. Frontend calls `vendorAPI.getById`
7. VendorDetailPage displays full profile, booking button
8. User clicks book, routes to PlanEventPage or creates booking directly

**State Management:**

- **Global Auth State:** AuthContext in `frontend/src/lib/auth.js` - provides user, loading, login, logout, continueAsGuest, role check methods
- **Persistent Auth:** Token and user stored in localStorage, restored on app mount
- **Page-Level State:** Each page component manages form state, recommendations, loading states with useState
- **API Caching:** No explicit caching layer - requests made on-demand
- **Real-time Updates:** No WebSocket - polling or manual refresh required

## Key Abstractions

**API Client:**
- Purpose: Centralized HTTP communication with auth headers and error handling
- Examples: `frontend/src/lib/api.js`
- Pattern: Modular export of service objects (authAPI, vendorAPI, eventAPI, bookingAPI, aiAPI, categoryAPI, seedAPI) with methods returning axios promises

**Auth Context:**
- Purpose: Global authentication state and methods
- Examples: `frontend/src/lib/auth.js`
- Pattern: React Context with custom hook (useAuth) enforcing usage within AuthProvider

**Pydantic Models:**
- Purpose: Request validation and response serialization with type hints
- Examples: `backend/server.py` UserBase, VendorProfile, Event, BookingRequest
- Pattern: Dataclass-like models with field defaults, ConfigDict for flexibility, Field for defaults/factories

**Radix UI Component Library:**
- Purpose: Accessible, unstyled UI primitives
- Examples: Dialog, Button, Form, Input, Select, Calendar, Popover, Toast
- Pattern: Primitive components wrapped in separate modules, styled with Tailwind CSS

**Router Configuration:**
- Purpose: Organize routes by prefix and dependency injection
- Examples: FastAPI APIRouter with `/api` prefix, FastAPI Depends()
- Pattern: APIRouter allows modular route grouping; Depends() provides auth, validation, error handling

## Entry Points

**Frontend App Entry:**
- Location: `frontend/src/index.js`
- Triggers: npm start (via craco)
- Responsibilities: Mounts React app to DOM, wraps with AuthProvider

**Frontend App Root:**
- Location: `frontend/src/App.js`
- Triggers: Rendered from index.js
- Responsibilities: Route configuration with React Router, Toaster setup, initial DB seed

**Backend Server Entry:**
- Location: `backend/server.py`
- Triggers: uvicorn server.py (production) or FastAPI dev server
- Responsibilities: MongoDB connection, CORS middleware setup, router inclusion, shutdown handler

**Seed Endpoint:**
- Location: `backend/server.py` POST /api/seed
- Triggers: Called on frontend mount (App.js useEffect)
- Responsibilities: Populates initial vendor data if DB empty

## Error Handling

**Strategy:** Try-catch blocks with HTTP exception mapping (Backend), Promise rejection interception (Frontend)

**Patterns:**

- **Backend Route Errors:** HTTPException raised with status codes (400 duplicates, 401 auth, 403 forbidden, 404 not found, 500 server)
- **Auth Errors:** JWT verify catches ExpiredSignatureError and InvalidTokenError, raises 401
- **Frontend API Errors:** Axios interceptor catches 401, clears auth and redirects
- **AI Errors:** Try-catch with fallback message, logger.error() logs failure
- **Form Validation:** Frontend toast notifications for validation errors before API call
- **Async Operations:** Loading states prevent duplicate submissions, try-finally ensures loading is cleared

## Cross-Cutting Concerns

**Logging:** Backend uses Python logging module (INFO level), logger instantiated at module level. Frontend uses console (browser dev tools).

**Validation:**
- Backend: Pydantic models validate request bodies, EmailStr enforces email format
- Frontend: React Hook Form with Zod schemas on pages requiring complex forms

**Authentication:**
- JWT tokens with 7-day expiration
- HTTPBearer extracts "Bearer {token}" from Authorization header
- User role embedded in token (user_type: user, vendor, guest)
- Optional auth with get_optional_user for AI endpoints

**CORS:** Middleware allows origins from CORS_ORIGINS env var (defaults to *)

**Request/Response Interceptors:**
- Axios adds Authorization header from localStorage token
- Axios catches 401 and clears auth state

**Date/Time:** ISO 8601 format with UTC timezone (datetime.now(timezone.utc).isoformat())

**Error Recovery:** No automatic retry - user must manually resubmit. Logout on 401 provides fresh token opportunity.

---

*Architecture analysis: 2026-02-07*

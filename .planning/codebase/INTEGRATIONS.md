# External Integrations

**Analysis Date:** 2026-02-07

## APIs & External Services

**AI/LLM Services:**
- Emergent LLM (via emergentintegrations SDK) - AI chat and vendor recommendations
  - SDK/Client: `emergentintegrations==0.1.0` (imported in `backend/server.py` line 15)
  - Auth: `EMERGENT_LLM_KEY` env var (backend/.env)
  - Usage: Chat endpoints at `POST /api/ai/chat` (line 507-560) and `POST /api/ai/recommendations` (line 562-592)
  - Model: Gemini 3 Flash Preview (configured in server.py line 552)
  - Session Management: Uses `LlmChat` class with session IDs for conversation context
  - Event Context: Passes event details and vendor information to AI for recommendations

**OAuth/Third-party Auth:**
- requests-oauthlib - OAuth2 support (in requirements.txt, configured but not actively used in main server.py)

## Data Storage

**Primary Database:**
- MongoDB 4.4+ (NoSQL document store)
  - Connection: `MONGO_URL` env var (mongodb://localhost:27017 in backend/.env)
  - Database Name: `DB_NAME` env var (test_database in backend/.env)
  - Client: Motor 3.3.1 (async driver) - `from motor.motor_asyncio import AsyncIOMotorClient` (server.py line 5)
  - Fallback: PyMongo 4.5.0 (synchronous driver for compatibility)
  - Collections:
    - `db.users` - User accounts with hashed passwords (lines 210, 225, 240, 283)
    - `db.vendors` - Vendor profiles with services, ratings, portfolio (lines 310, 315, 334, 338)
    - `db.events` - User-created events with details and selected vendors (lines 372, 376, 394)
    - `db.bookings` - Booking requests between users and vendors (lines 452, 457, 474, 500)
  - Indexes: Query optimization on email, user_id, vendor_id, event_id fields (implicit via queries)
  - Connection Lifecycle: Initialized on startup (line 21-23), closed on shutdown (line 889-891)

**File Storage:**
- AWS S3 (via boto3) - Image/portfolio uploads
  - SDK/Client: `boto3>=1.34.129`
  - Configuration: Likely in AWS credentials (not explicitly in backend/.env, AWS SDK uses environment/credential chain)
  - Usage: Portfolio images stored as URLs (vendor profile portfolio_images field)
  - Current approach: External URLs (Pexels images used as placeholders in seed data, line 631, 649, 667, etc.)

**Caching:**
- None detected - Direct database queries on each request (no Redis/Memcached)

## Authentication & Identity

**Auth Provider:**
- Custom JWT-based authentication
  - Implementation: JWT tokens created in `create_token()` function (line 174-180 in server.py)
  - Algorithm: HS256 (line 27)
  - Secret: `JWT_SECRET` env var (arangetram-secret-key-2024 in backend/.env)
  - Expiration: 7 days from token creation (line 178)
  - Token Storage: Frontend stores JWT in auth context (imported in App.js line 4: `from "./lib/auth"`)
  - Verification: `verify_token()` function (line 182-189) with expiration checks
  - Bearer Token: HTTP Authorization header with Bearer scheme (HTTPBearer dependency at line 2, server.py)

**Password Security:**
- bcrypt 4.1.3 for hashing
  - Registration: `bcrypt.hashpw()` for password storage (line 215)
  - Login: `bcrypt.checkpw()` for verification (line 244)
  - Rounds: Default bcrypt rounds (gensalt() without rounds parameter)

**User Types:**
- Regular users (user_type: "user")
- Vendors (user_type: "vendor") - Can create vendor profiles
- Guests (user_type: "guest") - Temporary unauthenticated access (line 258-279)

## Monitoring & Observability

**Error Tracking:**
- None detected (no Sentry, DataDog, or rollbar integration)
- Exception logging via Python logging module (line 883-887, server.py)

**Logs:**
- Backend: Python logging to console with INFO level and timestamp format (line 883-887)
- Frontend: Console.log for errors (App.js line 25)
- Log Pattern: `%(asctime)s - %(name)s - %(levelname)s - %(message)s`
- Errors logged in AI endpoints (line 559, 591)

**Health Checks:**
- Webpack health plugin (optional) - Configured in craco.config.js but disabled by default (ENABLE_HEALTH_CHECK=false in frontend/.env)
- Database connectivity: Implicit via queries (fails if MongoDB unavailable)

## CI/CD & Deployment

**Hosting:**
- Frontend: Static file hosting compatible (built React app from `yarn build`)
- Backend: Python ASGI server via uvicorn 0.25.0
- Current Preview: `https://danceplanr.preview.emergentagent.com` (from frontend/.env REACT_APP_BACKEND_URL)

**CI Pipeline:**
- None detected (no .github/workflows, CircleCI, or GitLab CI config)
- Manual deployment implied

**Deployment Platform:**
- Likely Emergent Agent cloud platform (based on preview URL domain)
- Backend API expected at: `https://danceplanr.preview.emergentagent.com/api/` (CORS configured for `*` by default)

## Environment Configuration

**Required env vars:**

Frontend (`frontend/.env`):
- `REACT_APP_BACKEND_URL` - Backend API base URL (required for all API calls)
- `WDS_SOCKET_PORT` - WebSocket port for dev server (443 for HTTPS preview)
- `ENABLE_HEALTH_CHECK` - Boolean to enable health check plugin (false by default)

Backend (`backend/.env`):
- `MONGO_URL` - MongoDB connection string (mongodb://localhost:27017 default)
- `DB_NAME` - MongoDB database name (test_database default)
- `JWT_SECRET` - Secret key for JWT signing (CRITICAL for auth)
- `CORS_ORIGINS` - Comma-separated allowed origins (* for all)
- `EMERGENT_LLM_KEY` - API key for Emergent LLM integration (sk-emergent-..., CRITICAL for AI features)

**Secrets location:**
- `.env` files in `frontend/` and `backend/` directories (not committed to git, listed in .gitignore)
- Frontend: Accessed via `REACT_APP_` prefix in JavaScript
- Backend: Accessed via `os.environ.get()` in Python

## Webhooks & Callbacks

**Incoming:**
- None detected - No webhook endpoints for external services

**Outgoing:**
- None detected - No notifications sent to external services
- Potential: Could integrate with payment/booking confirmation webhooks to third-party services

## API Architecture

**Backend API Structure:**
- Base URL: Configured via `REACT_APP_BACKEND_URL`
- Prefix: `/api` (router created at line 33, server.py)
- Authentication: Bearer token in Authorization header
- Response Format: JSON

**Endpoints Summary:**
- Auth: `/api/auth/register`, `/api/auth/login`, `/api/auth/guest`, `/api/auth/me`
- Vendors: `/api/vendors`, `/api/vendors/{id}`, `/api/vendors/my/profile`
- Events: `/api/events`, `/api/events/{id}`, `/api/events/{id}/vendors/{vendor_id}`
- Bookings: `/api/bookings`, `/api/bookings/user`, `/api/bookings/vendor`
- AI: `/api/ai/chat`, `/api/ai/recommendations`
- Seed: `/api/seed` (for database initialization)
- Categories: `/api/categories`

**CORS Configuration:**
- Middleware at line 874-880 (server.py)
- Allows origins from `CORS_ORIGINS` env var (wildcard * by default)
- Allows credentials, all methods, all headers

---

*Integration audit: 2026-02-07*

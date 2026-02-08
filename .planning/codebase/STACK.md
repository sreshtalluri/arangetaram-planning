# Technology Stack

**Analysis Date:** 2026-02-07

## Languages

**Primary:**
- JavaScript (ES6+) - Frontend React application in `frontend/src/`
- Python 3 - Backend FastAPI server in `backend/server.py`

**Secondary:**
- JSX - React component syntax in `frontend/src/components/`
- HTML/CSS - Generated via Tailwind CSS configuration

## Runtime

**Environment:**
- Node.js (Frontend) - Managed by `yarn` package manager
- Python 3 - FastAPI async runtime with uvicorn

**Package Manager:**
- Yarn 1.22.22 (Frontend) - Specified in `frontend/package.json`
- Pip (Backend) - Python dependency management via `backend/requirements.txt`
- Lockfile: Both present (yarn.lock implied, requirements.txt pinned)

## Frameworks

**Core:**
- React 19.0.0 - Frontend UI library
- FastAPI 0.110.1 - Backend REST API framework at `backend/server.py`
- React Router DOM 7.5.1 - Client-side routing in `frontend/src/`

**UI Components:**
- Radix UI (comprehensive primitives) - Dialog, Select, Accordion, Tabs, etc. in `frontend/src/components/ui/`
- Lucide React 0.507.0 - Icon library used throughout UI components
- Recharts 3.6.0 - Data visualization for charts

**Form & Validation:**
- React Hook Form 7.56.2 - Form state management in `frontend/src/`
- Zod 3.24.4 - Schema validation (integrates with Hook Form)
- Pydantic 2.6.4+ - Backend data validation in `backend/server.py`

**Styling:**
- Tailwind CSS 3.4.17 - Utility-first CSS framework in `frontend/tailwind.config.js`
- PostCSS 8.4.49 - CSS transformations
- Class Variance Authority 0.7.1 - Component variant management
- Tailwind Merge 3.2.0 - Utility class merging
- Tailwind CSS Animate 1.0.7 - Animation utilities

**Testing:**
- pytest 8.0.0+ - Python unit testing in `backend/`
- Jest (implied) - JavaScript testing via `react-scripts`

**Build/Dev:**
- Create React App (react-scripts 5.0.1) - Frontend build tooling
- Craco 7.1.0 - Create React App configuration override in `frontend/craco.config.js`
- Webpack (via Craco) - Module bundling and code splitting
- Vite-like dev server configured in craco.config.js

**Code Quality:**
- ESLint 9.23.0 - JavaScript linting rules defined in craco.config.js
- Prettier - Code formatting (configured in project)
- Black 24.1.1+ - Python code formatter in `backend/`
- isort 5.13.2+ - Python import sorting
- flake8 7.0.0+ - Python style checker
- mypy 1.8.0+ - Python type checker

## Key Dependencies

**Critical:**
- motor 3.3.1 - Async MongoDB driver for Python
- pymongo 4.5.0 - MongoDB synchronous driver (for compatibility)
- PyJWT 2.10.1+ - JWT token creation/verification in `backend/server.py`
- bcrypt 4.1.3 - Password hashing for authentication
- requests-oauthlib 2.0.0+ - OAuth support (configured but not heavily used)
- cryptography 42.0.8+ - Encryption utilities
- emergentintegrations 0.1.0 - Custom Emergent LLM integration package (imported in `backend/server.py` line 15)

**HTTP & API:**
- axios 1.8.4 - Frontend HTTP client for API calls
- uvicorn 0.25.0 - ASGI server for FastAPI
- Starlette (via FastAPI) - ASGI middleware framework
- requests 2.31.0+ - Python HTTP library for backend

**Infrastructure:**
- boto3 1.34.129+ - AWS SDK (for S3 file storage, configured but not visible in main server.py)
- python-dotenv 1.0.1+ - Environment variable loading in `backend/.env`

**Data Processing:**
- pandas 2.2.0+ - Data analysis (for vendor/event data processing)
- numpy 1.26.0+ - Numerical computing
- python-multipart 0.0.9+ - Multipart form parsing for file uploads
- jq 1.6.0+ - JSON query utility

**Utilities:**
- date-fns 4.1.0 - Date manipulation in React
- react-day-picker 8.10.1 - Calendar component
- sonner 2.0.3 - Toast notification library
- vaul 1.1.2 - Drawer/sidebar component
- input-otp 1.4.2 - OTP input field
- cmdk 1.1.1 - Command palette component
- embla-carousel-react 8.6.0 - Carousel component
- react-resizable-panels 3.0.1 - Resizable layout panels
- next-themes 0.4.6 - Theme switching (light/dark mode)
- email-validator 2.2.0+ - Email validation
- passlib 1.7.4+ - Password hashing utilities
- typer 0.9.0+ - CLI framework for Python scripts
- tzdata 2024.2+ - Timezone database

## Configuration

**Environment:**
- Frontend: `frontend/.env` with `REACT_APP_BACKEND_URL`, `WDS_SOCKET_PORT`, `ENABLE_HEALTH_CHECK`
- Backend: `backend/.env` with `MONGO_URL`, `DB_NAME`, `CORS_ORIGINS`, `JWT_SECRET`, `EMERGENT_LLM_KEY`
- Key configs required:
  - MongoDB connection string (`MONGO_URL`)
  - JWT secret for token signing (`JWT_SECRET`)
  - Emergent LLM API key for AI features (`EMERGENT_LLM_KEY`)
  - Backend URL for frontend API calls (`REACT_APP_BACKEND_URL`)

**Build:**
- `frontend/package.json` - Yarn scripts: start, build, test
- `frontend/craco.config.js` - Webpack override with alias configuration (@ → src)
- `frontend/tailwind.config.js` - Tailwind theme customization
- `frontend/postcss.config.js` - PostCSS plugins
- `backend/requirements.txt` - Pinned Python dependencies
- `backend/server.py` - Inline FastAPI configuration (CORS, logging, middleware)

## Platform Requirements

**Development:**
- Node.js 16+ (for Yarn package manager)
- Python 3.8+ (FastAPI compatibility)
- MongoDB 4.4+ (async motor driver support)
- Yarn package manager (v1.22.22 specified)

**Production:**
- Node.js 16+ runtime (for built React app serving)
- Python 3.8+ runtime with uvicorn ASGI server
- MongoDB (cloud or self-hosted, URI configurable)
- Environment variables configured (MONGO_URL, JWT_SECRET, EMERGENT_LLM_KEY)
- Backend deployed as Python app listening on HTTP
- Frontend built as static assets (via `yarn build`)

**Deployment Target:**
- Frontend: Static file hosting (Apache, Nginx, Vercel, Netlify)
- Backend: Python app server (Heroku, AWS Lambda, DigitalOcean App Platform, Docker)
- Database: MongoDB Atlas or self-hosted MongoDB
- Current preview: `https://danceplanr.preview.emergentagent.com` (from frontend/.env)

---

*Stack analysis: 2026-02-07*

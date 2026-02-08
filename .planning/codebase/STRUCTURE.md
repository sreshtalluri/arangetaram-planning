# Codebase Structure

**Analysis Date:** 2026-02-07

## Directory Layout

```
arangetaram-planning/
├── backend/                    # Python FastAPI server
│   ├── server.py              # Main application, routes, models
│   ├── requirements.txt        # Python dependencies
│   └── .env                    # Environment variables
├── frontend/                   # React web application
│   ├── src/
│   │   ├── index.js           # React DOM entry point
│   │   ├── App.js             # Main app component with routes
│   │   ├── App.css            # Global styles
│   │   ├── index.css          # Base styles
│   │   ├── components/        # Reusable UI components
│   │   │   ├── Navbar.jsx     # Navigation bar
│   │   │   ├── AIChat.jsx     # AI chat assistant modal
│   │   │   ├── VendorCard.jsx # Vendor display card
│   │   │   └── ui/            # 47 Radix UI primitive components
│   │   ├── pages/             # Full-page route components
│   │   │   ├── LandingPage.jsx
│   │   │   ├── LoginPage.jsx
│   │   │   ├── RegisterPage.jsx
│   │   │   ├── VendorsPage.jsx
│   │   │   ├── VendorDetailPage.jsx
│   │   │   ├── PlanEventPage.jsx
│   │   │   ├── UserDashboard.jsx
│   │   │   └── VendorDashboard.jsx
│   │   ├── lib/               # Business logic and utilities
│   │   │   ├── api.js         # Axios instance and API methods
│   │   │   ├── auth.js        # AuthContext and useAuth hook
│   │   │   └── utils.js       # Utility functions
│   │   └── hooks/             # Custom React hooks
│   │       └── use-toast.js
│   ├── public/
│   │   └── index.html         # HTML entry point
│   ├── plugins/               # Custom build plugins
│   │   ├── health-check/      # Health check webpack plugin
│   │   └── visual-edits/      # Visual editing dev tools
│   ├── package.json           # Dependencies and scripts
│   ├── craco.config.js        # Create React App config overrides
│   ├── tailwind.config.js     # Tailwind CSS configuration
│   └── .env                   # Environment variables
├── tests/                     # Test directory
├── test_reports/              # Test output reports
├── memory/                    # Development notes/memory
├── .planning/                 # Planning documents
│   └── codebase/             # Codebase analysis documents
├── .emergent/                 # Emergent integrations
├── .git/                      # Git repository
└── README.md                  # Project overview
```

## Directory Purposes

**`backend/`:**
- Purpose: FastAPI server providing REST API for frontend consumption
- Contains: Single monolithic server.py file with all routes and models
- Key files: `server.py` (891 lines, all application logic)

**`frontend/src/`:**
- Purpose: React application source code
- Contains: Pages, components, styles, and business logic
- Key files: Entry points and route handlers

**`frontend/src/components/`:**
- Purpose: Reusable React components
- Contains: Navigation, AI chat, vendor cards, and 47 UI primitives from Radix UI
- Key files: Navbar.jsx, AIChat.jsx, VendorCard.jsx plus ui/* folder

**`frontend/src/pages/`:**
- Purpose: Full-page components for each route
- Contains: 8 page components handling different user workflows
- Key files: LandingPage.jsx, PlanEventPage.jsx, UserDashboard.jsx, VendorDashboard.jsx

**`frontend/src/lib/`:**
- Purpose: Shared business logic and API communication
- Contains: Axios-based API client, React Context auth, utilities
- Key files: `api.js` (HTTP client), `auth.js` (authentication state)

**`frontend/src/hooks/`:**
- Purpose: Custom React hooks
- Contains: Toast notification hook
- Key files: `use-toast.js`

**`frontend/plugins/`:**
- Purpose: Custom webpack and dev server plugins
- Contains: Health check monitoring and visual editing tools
- Key files: webpack-health-plugin, dev-server-setup, babel-metadata-plugin

**`frontend/public/`:**
- Purpose: Static assets and HTML shell
- Contains: index.html (React mount point)
- Key files: `index.html`

## Key File Locations

**Entry Points:**

- `frontend/src/index.js` - React DOM mount, wraps App with AuthProvider
- `frontend/src/App.js` - Route configuration, database seed call, Toaster setup
- `frontend/public/index.html` - HTML shell with `<div id="root">`
- `backend/server.py` - FastAPI app creation, route registration, middleware setup

**Configuration:**

- `frontend/package.json` - Dependencies, npm scripts (start, build, test)
- `frontend/craco.config.js` - Webpack alias (@), build plugin setup
- `frontend/tailwind.config.js` - Tailwind CSS theme customization
- `frontend/.env` - REACT_APP_BACKEND_URL for API communication
- `backend/.env` - MONGO_URL, DB_NAME, JWT_SECRET, EMERGENT_LLM_KEY

**Core Logic:**

- `frontend/src/lib/api.js` - All HTTP endpoints (authAPI, vendorAPI, eventAPI, bookingAPI, aiAPI, categoryAPI, seedAPI)
- `frontend/src/lib/auth.js` - User state, authentication methods, role checks
- `backend/server.py` - REST routes, Pydantic models, database operations

**Authentication:**

- `frontend/src/lib/auth.js` - AuthContext providing user state and login/logout/register methods
- `backend/server.py` - JWT token creation/verification, HTTPBearer extraction, current_user dependency

**Styling:**

- `frontend/src/index.css` - Base Tailwind CSS directives
- `frontend/src/App.css` - Global app styles
- `frontend/tailwind.config.js` - Theme colors (#800020 primary, #F9F8F4 background, etc.)

**Testing:**

- `tests/` - Test directory (empty structure available)
- `test_reports/` - Test output location
- `backend_test.py` - Python backend test file

## Naming Conventions

**Files:**

- Pages: PascalCase with Page suffix (LandingPage.jsx, VendorDetailPage.jsx)
- Components: PascalCase (Navbar.jsx, VendorCard.jsx)
- Utilities: camelCase (api.js, auth.js, utils.js)
- Styles: lowercase with .css extension (index.css, App.css)
- Config: lowercase with .config.js or .config.ts (craco.config.js, tailwind.config.js)
- Tests: .test.js or .spec.js suffix (not currently used)

**Directories:**

- Feature areas: plural or descriptive (components, pages, hooks, plugins)
- UI primitives: ui/ folder groups all Radix components
- Config: root level (frontend/, backend/)
- Utilities: lib/ for shared logic

**Component Exports:**

- Named exports for page components: `export default function LandingPage() {}`
- Named exports for utility functions: `export const useAuth = () => {}`
- Modular API client: `export const authAPI = {}; export const vendorAPI = {};`

## Where to Add New Code

**New Page/Route:**
- Implementation: `frontend/src/pages/[NewPage].jsx`
- Add route to App.js Routes
- Use existing pages (LandingPage.jsx, VendorDetailPage.jsx) as template

**New Feature Component:**
- Implementation: `frontend/src/components/[Feature].jsx`
- Import from lib/api and lib/auth as needed
- Follow patterns in Navbar.jsx, AIChat.jsx, VendorCard.jsx

**New Reusable UI Component:**
- Implementation: `frontend/src/components/ui/[ComponentName].jsx`
- Use Radix UI primitives as base
- Apply Tailwind CSS classes following existing pattern
- See dialog.jsx, button.jsx, card.jsx for examples

**New API Endpoint:**
- Implementation: `backend/server.py` - add @api_router.post/get/put/delete decorator
- Define Pydantic model for request/response
- Add to appropriate section (AUTH, VENDOR, EVENT, BOOKING, AI, CATEGORIES, etc.)
- Enrich with related data from MongoDB as needed (see booking enrichment at line 459-481)

**New Utility Function:**
- Shared: `frontend/src/lib/utils.js`
- Business logic: `frontend/src/lib/api.js` (if API-related) or `frontend/src/pages/` (if page-specific)

**New Custom Hook:**
- Implementation: `frontend/src/hooks/use[HookName].js`
- Use for complex state logic or reusable logic across components
- Pattern: see use-toast.js

**Shared Constants/Enums:**
- Categories array: Defined in pages (LandingPage.jsx:11, PlanEventPage.jsx:33) - consolidate to lib/
- Budget options: Defined in PlanEventPage.jsx:42 - consider moving to lib/constants
- User types: "user", "vendor", "guest" strings scattered - define enum in lib/

## Special Directories

**`frontend/src/components/ui/`:**
- Purpose: 47 Radix UI primitive components styled with Tailwind
- Generated: No (manually created from Radix UI library)
- Committed: Yes (version-controlled components)
- Usage: Every page component imports from here (Button, Dialog, Form, etc.)

**`frontend/plugins/`:**
- Purpose: Custom webpack and dev server extensions
- Generated: No (custom code)
- Committed: Yes
- Enabled: Visual edits on dev server only; health-check when ENABLE_HEALTH_CHECK=true

**`frontend/public/`:**
- Purpose: Static files served at root
- Generated: No (index.html is static)
- Committed: Yes
- Usage: index.html provides React mount point

**`.planning/codebase/`:**
- Purpose: Codebase analysis documents (ARCHITECTURE.md, STRUCTURE.md, etc.)
- Generated: Yes (by Claude during mapping)
- Committed: Yes
- Usage: Reference for future development phases

**`.git/`:**
- Purpose: Git repository metadata
- Generated: Yes (git init)
- Committed: N/A (always present)

**`memory/`:**
- Purpose: Development notes and context
- Generated: Yes (development notes)
- Committed: Yes
- Usage: Context preservation for future development

---

*Structure analysis: 2026-02-07*

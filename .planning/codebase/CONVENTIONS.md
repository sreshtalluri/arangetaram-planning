# Coding Conventions

**Analysis Date:** 2026-02-07

## Naming Patterns

**Files:**
- React components: PascalCase with `.jsx` extension: `LoginPage.jsx`, `VendorCard.jsx`, `AIChat.jsx`
- Hooks: camelCase with `use-` prefix and `.js` extension: `use-toast.js`
- Utility modules: camelCase with `.js` extension: `auth.js`, `api.js`, `utils.js`
- UI components: lowercase with `.jsx` extension: `button.jsx`, `dialog.jsx`, `form.jsx`
- Pages: PascalCase with `.jsx` extension in `/pages` directory: `LoginPage.jsx`, `RegisterPage.jsx`, `VendorDetailPage.jsx`

**Functions:**
- Component functions: PascalCase: `function LoginPage()`, `export const VendorCard`
- Hook functions: camelCase starting with `use`: `useAuth()`, `useToast()`
- Helper functions: camelCase: `handleSubmit()`, `toggleCategory()`, `handleLogout()`
- Arrow functions commonly used for callbacks: `const handleChange = (e) => { ... }`

**Variables:**
- State variables: camelCase: `email`, `loading`, `eventData`, `recommendations`
- Constants (object literals): camelCase or PascalCase for React components
- Object properties: snake_case for API data (from backend): `event_date`, `user_type`, `business_name`
- Local scoped constants: camelCase: `TOAST_LIMIT`, `TOAST_REMOVE_DELAY`, `API_BASE`

**Types/Components:**
- React components exported with capital letter: `export const VendorCard`, `export default function LoginPage()`
- UI library variants: camelCase (from Radix UI): `DropdownMenuTrigger`, `SelectContent`

## Code Style

**Formatting:**
- No explicit linter/formatter detected (no `.eslintrc`, `.prettierrc`, Prettier, ESLint configs found)
- Style is inferred from existing code:
  - 2-space indentation (implicit in craco.config.js)
  - Line breaks after arrow functions, JSX blocks
  - Trailing commas in multi-line objects
  - Consistent spacing around braces and operators

**Linting:**
- ESLint configured in `craco.config.js` with `react-hooks` rules
- Rules enforced:
  - `"react-hooks/rules-of-hooks": "error"` - React hooks must be called at top level
  - `"react-hooks/exhaustive-deps": "warn"` - Warning for missing useEffect dependencies
  - Extensions: `["plugin:react-hooks/recommended"]`

## Import Organization

**Order:**
1. React core imports: `import { useState, useEffect } from "react"`
2. Third-party libraries: `import axios from 'axios'`, `import { toast } from "sonner"`
3. Routing: `import { Link, useNavigate } from "react-router-dom"`
4. Project utilities/context: `import { useAuth } from "../lib/auth"`, `import { authAPI } from "../lib/api"`
5. Components: `import Navbar from "../components/Navbar"`, `import { Button } from "../components/ui/button"`
6. UI components: Grouped imports from same module: `import { Select, SelectContent, SelectItem, ... } from "../components/ui/select"`
7. Icons: `import { Loader2, ArrowLeft } from "lucide-react"`
8. Styles: `import "@/App.css"`

**Path Aliases:**
- `@/*` maps to `src/*` (defined in `jsconfig.json`)
- Usage examples: `import { cn } from "@/lib/utils"`, `import "@/App.css"`
- Relative paths used for local imports: `import { useAuth } from "../lib/auth"`
- Both patterns used: prefer `@/` for library code, relative paths for sibling/nearby files

## Error Handling

**Patterns:**
- Try-catch blocks in async functions with specific error access: `error.response?.data?.detail`
- Toast notifications for user-facing errors: `toast.error("message")`
- Console.error for debugging in development: `console.error("Failed to load vendors:", error)`
- Silent error handling in some cases: App.js seed catches and logs only: `console.log("Database may already be seeded")`
- Axios interceptor handles 401 errors globally by clearing auth and redirecting: `window.location.href = '/login'`
- Optional chaining for safe property access: `error.response?.status === 401`, `vendor.portfolio_images?.[0]`

**Example from `RegisterPage.jsx`:**
```javascript
try {
  const user = await register({...});
  toast.success(`Welcome, ${user.name}!`);
  // Navigation logic
} catch (error) {
  toast.error(error.response?.data?.detail || "Registration failed");
} finally {
  setLoading(false);
}
```

## Logging

**Framework:** `console` (no structured logging library detected)

**Patterns:**
- `console.error()` for error logging with context: `console.error("Failed to load categories:", error)`
- `console.log()` for non-critical info: `console.log("Database may already be seeded")`
- Located in catch blocks and critical paths (pages, components)
- Files using logging: `LoginPage.jsx`, `RegisterPage.jsx`, `VendorsPage.jsx`, `VendorDetailPage.jsx`, `UserDashboard.jsx`, `VendorDashboard.jsx`, `App.js`

## Comments

**When to Comment:**
- Minimal comment usage observed - mostly inline comments in complex logic
- Side effect notifications: `// ! Side effects ! - This could be extracted into a dismissToast() action, but I'll keep it here for simplicity` (in `use-toast.js`)
- Section dividers in components: `{/* Left side - Image */}`, `{/* Right side - Form */}`
- Conditional logic: `// Seed database on first load`

**JSDoc/TSDoc:**
- Not used - no TypeScript in codebase
- Comments are minimal and informal

## Function Design

**Size:** Functions average 10-50 lines, with page components reaching 200+ lines (PlanEventPage.jsx has 400+ lines)

**Parameters:**
- Props destructured in function signatures: `export const VendorCard = ({ vendor })`
- Event handlers use standard naming: `handleChange`, `handleSubmit`, `handleLogout`, `handleInputChange`, `handleKeyDown`, `toggleCategory`
- Arrow functions for callbacks: `(e) => {...}`, `(field, value) => {...}`

**Return Values:**
- Components return JSX directly
- Hooks return objects with multiple values: `{ user, loading, login, register, logout, continueAsGuest, isVendor, isGuest, isAuthenticated }`
- API functions return Axios promises: `api.post('/auth/register', data)`
- Utility functions return values or react elements: `cn()` returns className string

## Module Design

**Exports:**
- Named exports for components: `export const VendorCard = ({ vendor }) => { ... }`
- Default exports for pages: `export default function LoginPage() { ... }`
- Named exports for utilities: `export { useToast, toast }`, `export { Button, buttonVariants }`
- Mixed approach in `api.js`: `export const authAPI = { ... }`, `export const vendorAPI = { ... }`, `export default api`

**Barrel Files:**
- Not used - imports are direct: `import { Button } from "../components/ui/button"` (not from index)
- UI components in `/components/ui/` directory are imported individually

## Styling Conventions

**Tailwind CSS:**
- Extensively used with utility classes: `className="min-h-screen bg-[#F9F8F4]"`
- Color values often inline as hex codes: `bg-[#800020]`, `text-[#1A1A1A]`, `border-[#E5E5E5]`
- Custom color scheme follows design system: primary brand colors (#800020 maroon, #0F4C5C teal, #C5A059 gold)
- Responsive classes: `hidden lg:flex`, `hidden md:flex`, `hidden sm:inline`
- State classes: `hover:`, `focus:`, `disabled:`, `group-hover:`
- Animation classes: `animate-spin`, `animate-pulse`, `transition-colors`

**CSS Classes:**
- Custom CSS classes defined alongside Tailwind: `className="input-styled"`, `className="btn-primary"`, `className="btn-secondary"`
- Custom styles in CSS files: `App.css` (3350 bytes), `index.css` (3683 bytes)

**Class Naming Utilities:**
- `cn()` helper from `@/lib/utils` merges Tailwind with clsx and twMerge: `className={cn(buttonVariants({ variant, size, className }))}`

## API Integration Conventions

**Axios Usage:**
- Centralized in `lib/api.js` with pre-configured instance
- Base URL from environment: `process.env.REACT_APP_BACKEND_URL`
- Request interceptor adds Bearer token: `Authorization: Bearer ${token}`
- Response interceptor handles auth errors globally
- Grouped API endpoints by domain: `authAPI`, `vendorAPI`, `eventAPI`, `bookingAPI`, `aiAPI`, `categoryAPI`, `seedAPI`
- Naming pattern: `${domain}API.${method}`: `authAPI.login()`, `vendorAPI.getAll()`, `eventAPI.create()`

## Testing Markers

**Data Attributes:**
- Extensive use of `data-testid` for component testing: 48 instances found
- Naming pattern: `data-testid="component-name-action"` or `data-testid="component-name-${id}"`
- Examples: `data-testid="login-email"`, `data-testid="vendor-card-${vendor.id}"`, `data-testid="ai-chat-toggle"`, `data-testid="category-checkbox-${cat.id}"`
- Located in interactive elements and key components for E2E testing

---

*Convention analysis: 2026-02-07*

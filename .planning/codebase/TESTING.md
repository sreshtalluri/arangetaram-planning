# Testing Patterns

**Analysis Date:** 2026-02-07

## Test Framework

**Status:** No testing framework currently configured

**Framework Setup:**
- `package.json` defines test script: `"test": "craco test"`
- This uses Create React App's default Jest/React Testing Library setup
- No explicit Jest config, Vitest config, or test files detected
- No `.test.js`, `.spec.js`, `.test.jsx`, or `.spec.jsx` files found in codebase

**Expected Test Runner:**
- Jest (via Create React App/craco)
- React Testing Library (default with CRA)
- No custom test configuration overrides detected

**Assertion Library:**
- Default: Jest's built-in matchers (expect, etc.)
- No additional assertion libraries installed

**Run Commands:**
```bash
npm test                # Run tests via craco
yarn test               # Run tests via yarn (package manager: yarn@1.22.22)
npm test -- --watch    # Watch mode (inferred from CRA default)
npm test -- --coverage # Coverage report (inferred from CRA default)
```

## Test File Organization

**Status:** No test files exist

**Location Pattern (Expected):**
- Co-located or in adjacent `__tests__` directories per Create React App convention
- Suggested location: `src/components/__tests__/Button.test.jsx`, `src/pages/__tests__/LoginPage.test.jsx`

**Naming Convention (Expected):**
- `ComponentName.test.jsx` or `ComponentName.spec.jsx`
- Example: `VendorCard.test.jsx`, `AIChat.test.jsx`, `LoginPage.test.jsx`

**Directory Structure (Expected):**
```
src/
├── components/
│   ├── __tests__/
│   │   ├── VendorCard.test.jsx
│   │   ├── AIChat.test.jsx
│   │   └── Navbar.test.jsx
│   └── ...
├── pages/
│   ├── __tests__/
│   │   ├── LoginPage.test.jsx
│   │   ├── RegisterPage.test.jsx
│   │   └── VendorsPage.test.jsx
│   └── ...
├── lib/
│   ├── __tests__/
│   │   ├── api.test.js
│   │   ├── auth.test.js
│   │   └── utils.test.js
│   └── ...
└── ...
```

## Test Structure Patterns

**Component Test Pattern (Expected):**
```javascript
import { render, screen } from '@testing-library/react';
import { VendorCard } from '../VendorCard';

describe('VendorCard', () => {
  it('should render vendor name', () => {
    const vendor = {
      id: 1,
      business_name: 'Test Venue',
      portfolio_images: ['image.jpg'],
      location: 'Bay Area',
      description: 'Test description',
      rating: 4.5,
      review_count: 10,
      price_range: '$$',
      price_estimate: '$5000'
    };

    render(<VendorCard vendor={vendor} />);
    expect(screen.getByText('Test Venue')).toBeInTheDocument();
  });
});
```

**Setup Pattern:**
- Render component with necessary context/providers
- Set up mock data for props
- Use data-testid for element queries

**Teardown Pattern:**
- No explicit cleanup needed - React Testing Library handles automatically
- May need to clear localStorage in auth tests

**Assertion Pattern:**
- Visibility: `expect(screen.getByText()).toBeInTheDocument()`
- Existence: `expect(screen.queryByTestId()).toBeNull()`
- Attributes: `expect(button).toHaveAttribute('disabled')`
- Classes: `expect(element).toHaveClass('btn-primary')`

## Mocking

**Framework:** Jest mocks (built-in with Create React App)

**Patterns:**

**API Mocking:**
```javascript
jest.mock('../lib/api', () => ({
  authAPI: {
    login: jest.fn(),
    register: jest.fn(),
  },
  vendorAPI: {
    getAll: jest.fn(),
    getById: jest.fn(),
  },
}));
```

**Hook Mocking:**
```javascript
jest.mock('../lib/auth', () => ({
  useAuth: jest.fn(() => ({
    user: null,
    loading: false,
    login: jest.fn(),
    logout: jest.fn(),
    isAuthenticated: jest.fn(() => false),
    isVendor: jest.fn(() => false),
  })),
}));
```

**Module Mocking:**
```javascript
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: jest.fn(),
  useSearchParams: jest.fn(),
}));
```

**What to Mock:**
- External API calls via Axios (`lib/api.js`) - always mock to avoid network calls
- React Router hooks (`useNavigate`, `useSearchParams`, `useParams`) - mock navigation
- Auth context (`useAuth`) - mock user state for different test scenarios
- Toast notifications (`sonner.toast`) - mock to verify call patterns
- Third-party libraries with side effects

**What NOT to Mock:**
- Utility functions (`cn()`, `genId()`) - test actual behavior
- Pure component rendering - test real JSX output
- UI component library from Radix UI - import actual components
- Standard React hooks (`useState`, `useEffect`, `useContext`) - use real hooks
- Date formatting (`date-fns`) - test with real functions
- Form validation logic - test actual validation rules

## Fixtures and Factories

**Test Data Patterns (Expected):**

**Vendor Fixture:**
```javascript
export const mockVendor = {
  id: 1,
  business_name: 'Elite Catering',
  portfolio_images: ['image1.jpg', 'image2.jpg'],
  location: 'Bay Area',
  description: 'Premium catering services',
  rating: 4.8,
  review_count: 45,
  price_range: '$$$',
  price_estimate: '$8000',
  category: 'catering'
};
```

**User Fixture:**
```javascript
export const mockUser = {
  id: 1,
  name: 'John Doe',
  email: 'john@example.com',
  user_type: 'user',
  token: 'mock-token-123'
};
```

**Event Fixture:**
```javascript
export const mockEvent = {
  id: 1,
  event_name: 'My Arangetram',
  event_date: '2025-06-15',
  event_time: '10:00',
  guest_count: 150,
  budget: '$$',
  location_preference: 'San Francisco',
  categories_needed: ['venue', 'catering', 'photographer']
};
```

**Location:**
- Create `src/__fixtures__/` or `src/__mocks__/` directory
- Or co-locate in `__tests__/` directory as separate files: `vendors.fixtures.js`, `auth.fixtures.js`
- Import in test files: `import { mockVendor } from '../__fixtures__/vendors.fixtures'`

## Coverage

**Requirements:** Not enforced currently (no coverage thresholds in configuration)

**Setup Recommendation:**
```bash
npm test -- --coverage
```

**Target Coverage (Recommended):**
- Statements: 80%+
- Branches: 75%+
- Functions: 80%+
- Lines: 80%+

**Priority Areas for Testing:**
1. `src/lib/auth.js` - Authentication context, login/register/logout flows (critical business logic)
2. `src/lib/api.js` - API request/response interceptors
3. `src/pages/LoginPage.jsx`, `RegisterPage.jsx` - Authentication flows
4. `src/pages/PlanEventPage.jsx` - Event creation multi-step form (complex state)
5. `src/components/AIChat.jsx` - Message handling and async chat operations
6. `src/components/VendorCard.jsx` - Component rendering with dynamic data
7. Form validation logic across pages

## Test Types

**Unit Tests (Expected):**
- Scope: Individual functions, utilities, components in isolation
- Approach: Mock dependencies, test single responsibility
- Examples:
  - `cn()` utility returns correct className
  - `useToast()` hook manages toast state correctly
  - `VendorCard` renders passed vendor data
  - API endpoint mapping correct

**Integration Tests (Expected):**
- Scope: Component with hooks, pages with routing, API client with interceptors
- Approach: Use real providers, mock API responses
- Examples:
  - `LoginPage` with `useAuth` context renders and handles login flow
  - `PlanEventPage` multi-step form with state management
  - API client applies auth interceptor on requests
  - Auth context updates localStorage on login/logout

**E2E Tests (Not implemented):**
- Framework: Not configured (not detected)
- Would use: Cypress, Playwright, or Puppeteer
- Scope: Full user workflows from UI to backend
- Examples: User registration → login → browse vendors → create event

## Common Patterns

**Async Testing:**
```javascript
it('should load vendors on mount', async () => {
  vendorAPI.getAll.mockResolvedValue({
    data: [mockVendor]
  });

  render(<VendorsPage />);

  await waitFor(() => {
    expect(screen.getByText('Elite Catering')).toBeInTheDocument();
  });
});
```

**Error Testing:**
```javascript
it('should display error message on login failure', async () => {
  authAPI.login.mockRejectedValue({
    response: {
      data: { detail: 'Invalid credentials' }
    }
  });

  render(<LoginPage />);

  await userEvent.type(screen.getByTestId('login-email'), 'test@example.com');
  await userEvent.type(screen.getByTestId('login-password'), 'password');
  await userEvent.click(screen.getByTestId('login-submit'));

  await waitFor(() => {
    expect(toast.error).toHaveBeenCalledWith('Invalid credentials');
  });
});
```

**User Event Simulation:**
```javascript
import userEvent from '@testing-library/user-event';

it('should toggle category selection', async () => {
  const user = userEvent.setup();

  render(<PlanEventPage />);

  const checkbox = screen.getByTestId('category-checkbox-venue');
  await user.click(checkbox);

  expect(checkbox).toBeChecked();
});
```

## Test Data Strategy

**Current State:** 48 `data-testid` attributes already placed throughout codebase for testing

**Covered Components:**
- Login/Register pages: `login-email`, `login-password`, `login-submit`
- Event planning: `event-name-input`, `event-date-picker`, `event-time-input`, `guest-count-input`, `budget-select`, `category-checkbox-*`
- Vendor browsing: `category-tab-*`, `vendor-search`, `price-filter`, `vendors-grid`
- Chat: `ai-chat-toggle`, `ai-chat-container`, `ai-chat-input`, `ai-chat-send`, `close-chat-btn`

**Testing Strategy:**
- Use existing `data-testid` attributes for queries: `screen.getByTestId('login-email')`
- Use semantic queries as fallback: `screen.getByRole()`, `screen.getByLabelText()`
- Avoid testing implementation details like CSS classes or props

---

*Testing analysis: 2026-02-07*

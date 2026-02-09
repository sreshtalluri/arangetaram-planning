# Phase 3: Event Planning & Discovery - Research

**Researched:** 2026-02-09
**Domain:** Multi-step forms, filtering/search UX, Supabase queries, progress visualization
**Confidence:** HIGH

## Summary

Phase 3 builds the user-facing event planning and vendor discovery experience. Users create events through a multi-step wizard, browse vendors with filters synced to URL params, view detailed vendor profiles with portfolio lightboxes, and track their planning progress on a dashboard.

The codebase already has established patterns from Phase 2 (vendor ProfileWizard, useVendors hook, VendorCard component) that should be extended. The tech stack is fixed: React 19, React Hook Form + Zod, TanStack Query, Supabase, shadcn/ui components (Radix primitives), react-day-picker, and Tailwind CSS.

**Primary recommendation:** Extend existing patterns (ProfileWizard for event wizard, useVendors for discovery filters, AvailabilityCalendar for date-based availability checking) rather than building new abstractions. Use URL search params for filter state to enable shareable/bookmarkable searches.

## Standard Stack

The established libraries/tools for this phase (already in package.json):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-hook-form | ^7.56.2 | Form state management | Already used in ProfileWizard, handles validation well |
| zod | ^3.24.4 | Schema validation | Paired with react-hook-form via @hookform/resolvers |
| @tanstack/react-query | ^5.90.20 | Server state management | Already used for all Supabase queries |
| @supabase/supabase-js | ^2.95.3 | Database client | Established data layer |
| react-router-dom | ^7.5.1 | Routing + URL params | useSearchParams for filter state |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| date-fns | ^4.1.0 | Date formatting/manipulation | Event dates, availability filtering |
| react-day-picker | 8.10.1 | Calendar UI | Event date picker, availability display |
| @radix-ui/react-dialog | ^1.1.11 | Modal dialogs | Portfolio lightbox, confirmations |
| @radix-ui/react-progress | ^1.1.4 | Progress indicators | Category coverage progress bar |
| sonner | ^2.0.3 | Toast notifications | Success/error feedback |
| lucide-react | ^0.507.0 | Icons | UI icons throughout |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL params | Zustand | URL params enable shareable links, Zustand adds complexity |
| react-day-picker | date-fns-datepicker | Already using react-day-picker in Phase 2, consistency |
| Custom lightbox | react-image-lightbox | Radix Dialog + custom is lighter, matches design system |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── event/                    # Event-specific components
│   │   ├── EventWizard/          # Multi-step form (mirrors ProfileWizard)
│   │   │   ├── index.tsx
│   │   │   ├── StepProgress.tsx  # Can reuse from vendor/
│   │   │   ├── StepDetails.tsx   # Name, date, location
│   │   │   ├── StepCategories.tsx # Category selection
│   │   │   └── StepReview.tsx    # Summary + submit
│   │   └── EventCard.tsx         # Event summary card
│   ├── discovery/                # Vendor discovery components
│   │   ├── FilterSidebar.tsx     # Left sidebar filters
│   │   ├── VendorGrid.tsx        # Results grid
│   │   └── AvailabilityBadge.tsx # Availability indicator
│   ├── vendor/                   # Extend existing
│   │   └── PortfolioLightbox.tsx # New: image lightbox
│   └── dashboard/                # User dashboard components
│       ├── EventList.tsx
│       ├── CategoryProgress.tsx  # Progress ring/bar
│       └── QuickActions.tsx
├── hooks/
│   ├── useEvents.ts              # CRUD for events
│   ├── useVendors.ts             # Extend with availability filter
│   ├── useSavedVendors.ts        # Favorites/saved vendors
│   └── useDiscoveryFilters.ts    # URL param sync
├── pages/
│   ├── CreateEventPage.tsx       # Event wizard host
│   ├── VendorsPage.jsx           # Extend with sidebar layout
│   ├── VendorDetailPage.jsx      # Extend with lightbox
│   └── UserDashboard.jsx         # Extend with progress
└── lib/
    └── event-categories.ts       # Category constants (reuse vendor-categories)
```

### Pattern 1: Multi-Step Wizard with React Hook Form
**What:** Form wizard using FormProvider to share state across steps
**When to use:** Event creation wizard (Details -> Categories -> Review)
**Example:**
```typescript
// Source: Existing ProfileWizard pattern + React Hook Form docs
// https://react-hook-form.com/advanced-usage

import { useForm, FormProvider } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

const eventSchema = z.object({
  event_name: z.string().min(1, 'Event name required'),
  event_date: z.date({ required_error: 'Date required' }),
  location: z.string().optional(),
  guest_count: z.number().optional(),
  budget: z.number().optional(),
  categories_needed: z.array(z.string()).min(1, 'Select at least one category'),
  categories_covered: z.array(z.string()).default([]),
})

type EventFormData = z.infer<typeof eventSchema>

export function EventWizard() {
  const [step, setStep] = useState(1)
  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: { categories_needed: [], categories_covered: [] },
    mode: 'onChange',
  })

  // Auto-save draft to localStorage
  useEffect(() => {
    const subscription = methods.watch((data) => {
      localStorage.setItem('event-draft', JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [methods])

  return (
    <FormProvider {...methods}>
      {step === 1 && <StepDetails onNext={() => setStep(2)} />}
      {step === 2 && <StepCategories onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepReview onBack={() => setStep(2)} />}
    </FormProvider>
  )
}
```

### Pattern 2: URL-Synced Filter State
**What:** Filter state persisted in URL search params for shareability
**When to use:** Vendor browse page filters
**Example:**
```typescript
// Source: React Router useSearchParams pattern
// https://blog.logrocket.com/url-state-usesearchparams/

import { useSearchParams } from 'react-router-dom'
import { useMemo } from 'react'

interface Filters {
  category: string
  location: string
  priceRange: string
  availableDate: string
  search: string
}

export function useDiscoveryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<Filters>(() => ({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    priceRange: searchParams.get('price') || '',
    availableDate: searchParams.get('date') || '',
    search: searchParams.get('q') || '',
  }), [searchParams])

  const setFilter = (key: keyof Filters, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    if (value) {
      newParams.set(key === 'search' ? 'q' : key, value)
    } else {
      newParams.delete(key === 'search' ? 'q' : key)
    }
    setSearchParams(newParams)
  }

  const clearFilters = () => setSearchParams({})

  return { filters, setFilter, clearFilters }
}
```

### Pattern 3: Availability Filtering Query
**What:** Filter vendors by availability for a specific date
**When to use:** When user has event date set, filter to available vendors
**Example:**
```typescript
// Source: Supabase query patterns + existing useVendors hook

export function useVendorsWithAvailability(params: {
  category?: string
  location?: string
  priceRange?: string
  availableDate?: string  // YYYY-MM-DD format
  search?: string
}) {
  return useQuery({
    queryKey: ['vendors', 'discovery', params],
    queryFn: async () => {
      let query = supabase
        .from('vendor_profiles')
        .select('*')
        .eq('is_published', true)

      if (params.category) query = query.eq('category', params.category)
      if (params.location) query = query.contains('service_areas', [params.location])
      if (params.search) {
        query = query.or(`business_name.ilike.%${params.search}%,description.ilike.%${params.search}%`)
      }

      const { data: vendors, error } = await query

      if (error) throw error
      if (!vendors) return []

      // Filter by availability if date specified
      if (params.availableDate) {
        const { data: blockedVendors } = await supabase
          .from('vendor_availability')
          .select('vendor_id')
          .eq('blocked_date', params.availableDate)

        const blockedIds = new Set(blockedVendors?.map(b => b.vendor_id) || [])
        return vendors.filter(v => !blockedIds.has(v.id))
      }

      return vendors
    },
    staleTime: 30 * 1000,
  })
}
```

### Pattern 4: Portfolio Lightbox with Radix Dialog
**What:** Full-screen image gallery using Radix Dialog
**When to use:** Vendor detail page portfolio gallery
**Example:**
```typescript
// Source: Radix UI Dialog docs
// https://www.radix-ui.com/primitives/docs/components/dialog

import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PortfolioLightboxProps {
  images: string[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function PortfolioLightbox({ images, initialIndex = 0, open, onOpenChange }: PortfolioLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  const goNext = () => setCurrentIndex((i) => (i + 1) % images.length)
  const goPrev = () => setCurrentIndex((i) => (i - 1 + images.length) % images.length)

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
        <Dialog.Content className="fixed inset-4 z-50 flex items-center justify-center">
          <Dialog.Close className="absolute top-4 right-4 text-white">
            <X className="w-8 h-8" />
          </Dialog.Close>

          <button onClick={goPrev} className="absolute left-4 text-white">
            <ChevronLeft className="w-12 h-12" />
          </button>

          <img
            src={images[currentIndex]}
            alt={`Portfolio ${currentIndex + 1}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          <button onClick={goNext} className="absolute right-4 text-white">
            <ChevronRight className="w-12 h-12" />
          </button>

          <div className="absolute bottom-4 text-white">
            {currentIndex + 1} / {images.length}
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}
```

### Anti-Patterns to Avoid
- **Syncing form state to Zustand:** React Hook Form already manages form state; duplicating to Zustand creates sync issues
- **Client-side filtering large datasets:** Use Supabase queries for filtering, not fetching all then filtering in JS
- **Uncontrolled URL param updates:** Debounce search input to avoid URL spam during typing
- **Nested modals:** Don't open lightbox inside another dialog; flatten modal hierarchy

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Multi-step form state | Custom context/reducer | React Hook Form + FormProvider | Handles validation, dirty state, auto-rerender |
| Calendar date picker | Custom date picker | react-day-picker | Already used, handles edge cases |
| Modal/lightbox | Custom portal logic | Radix Dialog | Focus trap, escape handling, accessibility |
| Progress indicator | Custom SVG | @radix-ui/react-progress or Tailwind SVG | Animation, accessibility |
| Toast notifications | Custom toast system | sonner | Already installed, handles queuing |
| URL param sync | Custom hook | useSearchParams from react-router-dom | Handles history, encoding |

**Key insight:** The codebase already has patterns for everything Phase 3 needs. Extend existing components (ProfileWizard -> EventWizard, useVendors -> add availability filter, AvailabilityCalendar pattern for read-only display) rather than creating new abstractions.

## Common Pitfalls

### Pitfall 1: Form State Loss on Navigation
**What goes wrong:** User fills step 1, goes to step 2, navigates away, loses all data
**Why it happens:** Form state only exists in memory
**How to avoid:** Auto-save to localStorage on form change (pattern exists in ProfileWizard)
**Warning signs:** User complaints about lost work

### Pitfall 2: Filter State Not Shareable
**What goes wrong:** User applies filters, copies URL, shares - recipient sees unfiltered view
**Why it happens:** Filters stored in React state instead of URL
**How to avoid:** Use useSearchParams for all filter state
**Warning signs:** "Share this search" feature requests

### Pitfall 3: N+1 Query for Availability
**What goes wrong:** For each vendor, making separate query to check availability
**Why it happens:** Naive implementation checks each vendor individually
**How to avoid:** Batch query blocked dates, filter client-side, or use Supabase JOIN
**Warning signs:** Slow page load, many network requests

### Pitfall 4: Stale Event Date in Filters
**What goes wrong:** User changes event date, vendor availability filter uses old date
**Why it happens:** Event context not synced to filter state
**How to avoid:** Derive filter default from user's event, allow manual override
**Warning signs:** User sees "available" vendors who are actually booked

### Pitfall 5: Lightbox Focus/Scroll Issues
**What goes wrong:** Opening lightbox allows background scroll, focus escapes modal
**Why it happens:** Custom portal without proper focus trap
**How to avoid:** Use Radix Dialog which handles focus trap automatically
**Warning signs:** Accessibility audit failures, scroll-behind bugs

### Pitfall 6: Category State Confusion
**What goes wrong:** User marks category as "covered" during event creation, it's not saved
**Why it happens:** Separate state for needed vs covered categories not handled properly
**How to avoid:** Clear data model: categories_needed (array), categories_covered (array), derive "pending" as needed - covered
**Warning signs:** Dashboard shows wrong coverage count

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Schema for Events (new migration needed)
```sql
-- Source: Pattern from existing 00002_vendor_tables.sql

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  guest_count INTEGER,
  budget INTEGER,
  categories_needed TEXT[] DEFAULT '{}',
  categories_covered TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own events"
ON public.events FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can insert own events"
ON public.events FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can update own events"
ON public.events FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can delete own events"
ON public.events FOR DELETE
USING ((SELECT auth.uid()) = user_id);
```

### Saved Vendors Table (new migration needed)
```sql
CREATE TABLE public.saved_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

ALTER TABLE public.saved_vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own saved vendors"
ON public.saved_vendors FOR SELECT
USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can save vendors"
ON public.saved_vendors FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "Users can unsave vendors"
ON public.saved_vendors FOR DELETE
USING ((SELECT auth.uid()) = user_id);
```

### Category Progress Ring Component
```typescript
// Source: Tailwind SVG progress pattern
// https://daisyui.com/components/radial-progress/

interface CategoryProgressProps {
  covered: number
  total: number
}

export function CategoryProgress({ covered, total }: CategoryProgressProps) {
  const percentage = total > 0 ? Math.round((covered / total) * 100) : 0
  const circumference = 2 * Math.PI * 45 // radius = 45
  const offset = circumference - (percentage / 100) * circumference

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg className="w-24 h-24 transform -rotate-90">
        <circle
          cx="48"
          cy="48"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          className="text-gray-200"
        />
        <circle
          cx="48"
          cy="48"
          r="45"
          stroke="currentColor"
          strokeWidth="6"
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-[#0F4C5C] transition-all duration-500"
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="text-2xl font-bold text-[#1A1A1A]">{covered}/{total}</span>
        <span className="text-xs text-[#888888]">categories</span>
      </div>
    </div>
  )
}
```

### Filter Sidebar Layout (Left Sidebar Pattern)
```typescript
// Source: CONTEXT.md decision - "Left sidebar filter layout"

export function VendorDiscoveryLayout() {
  const { filters, setFilter, clearFilters } = useDiscoveryFilters()
  const { data: vendors, isLoading } = useVendorsWithAvailability(filters)

  return (
    <div className="flex gap-6">
      {/* Left Sidebar - Filters */}
      <aside className="w-64 shrink-0 hidden lg:block">
        <div className="sticky top-24 space-y-6 bg-white p-4 rounded-xl shadow-sm">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Filters</h3>
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              Clear all
            </Button>
          </div>

          {/* Category Filter */}
          <FilterSection title="Category">
            <Select value={filters.category} onValueChange={(v) => setFilter('category', v)}>
              {/* ... category options */}
            </Select>
          </FilterSection>

          {/* Location Filter */}
          <FilterSection title="Location">
            <Select value={filters.location} onValueChange={(v) => setFilter('location', v)}>
              {/* ... metro area options from metro-areas.ts */}
            </Select>
          </FilterSection>

          {/* Price Range Filter */}
          <FilterSection title="Price Range">
            {/* ... price options */}
          </FilterSection>

          {/* Availability Date Filter */}
          <FilterSection title="Available On">
            <DatePicker
              selected={filters.availableDate ? new Date(filters.availableDate) : undefined}
              onSelect={(date) => setFilter('availableDate', date ? format(date, 'yyyy-MM-dd') : '')}
            />
          </FilterSection>
        </div>
      </aside>

      {/* Main Content - Vendor Grid */}
      <main className="flex-1">
        {isLoading ? <LoadingSkeleton /> : <VendorGrid vendors={vendors} />}
      </main>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Redux for forms | React Hook Form | 2022+ | Simpler, less boilerplate |
| Local state for filters | URL search params | 2023+ | Shareable, bookmarkable |
| Custom modals | Radix primitives | 2023+ | Accessibility built-in |
| REST polling | TanStack Query | 2022+ | Caching, background refresh |

**Deprecated/outdated:**
- Custom form libraries: Use React Hook Form
- Redux for local UI state: Use URL params or component state
- Manual fetch in useEffect: Use TanStack Query

## Open Questions

Things that couldn't be fully resolved:

1. **Saved vendors storage location**
   - What we know: CONTEXT.md says "Claude's discretion" for saved vendors placement
   - What's unclear: Dedicated page vs dashboard section vs both
   - Recommendation: Start with dashboard section "Saved Vendors" tab, can extract to page later if needed

2. **Event edit flow**
   - What we know: EVENT-07 requires editing event details
   - What's unclear: Separate edit page vs inline editing vs modal
   - Recommendation: Reuse EventWizard component with pre-populated data, navigate to /events/:id/edit

3. **Guest user event persistence**
   - What we know: PlanEventPage has continueAsGuest flow
   - What's unclear: How guest events persist across sessions
   - Recommendation: Store in localStorage until auth, then migrate to Supabase

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: ProfileWizard, useVendors, useAvailability hooks
- [React Hook Form Advanced Usage](https://react-hook-form.com/advanced-usage)
- [Radix UI Dialog](https://www.radix-ui.com/primitives/docs/components/dialog)
- [Supabase Full Text Search](https://supabase.com/docs/guides/database/full-text-search)

### Secondary (MEDIUM confidence)
- [LogRocket: URL state with useSearchParams](https://blog.logrocket.com/url-state-usesearchparams/)
- [ClarityDev: Multi-step forms with React Hook Form](https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form)
- [DaisyUI Radial Progress](https://daisyui.com/components/radial-progress/)

### Tertiary (LOW confidence)
- Community discussions on Zustand + React Hook Form integration (GitHub discussions)

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - Already installed and used in codebase
- Architecture: HIGH - Extends existing proven patterns
- Pitfalls: HIGH - Based on common issues in similar implementations
- Database schema: MEDIUM - Follows existing migration patterns, needs validation

**Research date:** 2026-02-09
**Valid until:** 30 days (stable domain, established patterns)

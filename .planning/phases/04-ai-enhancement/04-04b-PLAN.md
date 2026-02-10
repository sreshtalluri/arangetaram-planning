---
phase: 04-ai-enhancement
plan: 04b
type: execute
wave: 3
depends_on: ["04-04a"]
files_modified:
  - frontend/src/components/ai/RecommendationsSection.tsx
  - frontend/src/pages/UserDashboard.jsx
autonomous: false

must_haves:
  truths:
    - "Dashboard shows AI recommendations section when user has an event"
    - "Recommendations grouped by category with top 3 vendors each"
    - "User can dismiss a recommendation and see next option"
    - "User can refresh recommendations with updated preferences"
  artifacts:
    - path: "frontend/src/components/ai/RecommendationsSection.tsx"
      provides: "Category-grouped recommendations with loading state"
      exports: ["RecommendationsSection"]
  key_links:
    - from: "frontend/src/components/ai/RecommendationsSection.tsx"
      to: "useRecommendations hook"
      via: "data fetching"
      pattern: "useRecommendations"
    - from: "frontend/src/pages/UserDashboard.jsx"
      to: "RecommendationsSection"
      via: "component render"
      pattern: "RecommendationsSection"
---

<objective>
Create RecommendationsSection and integrate into UserDashboard.

Purpose: Container component that groups recommendations by category and integrates into dashboard.
Output: RecommendationsSection.tsx with category grouping, loading states, and UserDashboard integration.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-04a-SUMMARY.md
@frontend/src/pages/UserDashboard.jsx
@frontend/src/hooks/useRecommendations.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RecommendationsSection component</name>
  <files>frontend/src/components/ai/RecommendationsSection.tsx</files>
  <action>
  Create **frontend/src/components/ai/RecommendationsSection.tsx:**

  ```typescript
  import { useState, useMemo } from 'react'
  import { useNavigate } from 'react-router-dom'
  import { Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
  import { useRecommendations } from '../../hooks/useRecommendations'
  import { CATEGORIES } from '../../lib/categories'
  import { RecommendationCard } from './RecommendationCard'
  import { Button } from '../ui/button'
  import type { Event } from '../../hooks/useEvents'

  interface RecommendationsSectionProps {
    event: Event
  }

  export function RecommendationsSection({ event }: RecommendationsSectionProps) {
    const navigate = useNavigate()
    const [dismissedIds, setDismissedIds] = useState<Set<string>>(new Set())

    const {
      recommendations,
      isLoading,
      isError,
      error,
      refreshRecommendations,
      isFetching,
    } = useRecommendations({ eventId: event.id })

    // Filter out dismissed vendors
    const filteredRecommendations = useMemo(() => {
      const result: typeof recommendations = {}
      for (const [category, data] of Object.entries(recommendations)) {
        const filteredVendors = data.vendors.filter(
          (v) => !dismissedIds.has(v.id)
        )
        if (filteredVendors.length > 0) {
          result[category] = { vendors: filteredVendors }
        }
      }
      return result
    }, [recommendations, dismissedIds])

    const handleDismiss = (vendorId: string) => {
      setDismissedIds((prev) => new Set([...prev, vendorId]))
    }

    const handleViewProfile = (vendorId: string) => {
      navigate(`/vendors/${vendorId}`)
    }

    // Loading state with contextual message
    if (isLoading) {
      const eventMonth = new Date(event.event_date).toLocaleDateString('en-US', {
        month: 'long',
      })
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C] mx-auto mb-3" />
          <p className="text-[#4A4A4A]">
            Finding vendors for your {eventMonth} Arangetram...
          </p>
        </div>
      )
    }

    // Error state with retry
    if (isError) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto mb-3" />
          <p className="text-[#4A4A4A] mb-4">
            {(error as Error)?.message || 'Failed to load recommendations'}
          </p>
          <Button onClick={refreshRecommendations} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      )
    }

    const categoryKeys = Object.keys(filteredRecommendations)

    // Empty state (no recommendations after filtering)
    if (categoryKeys.length === 0) {
      return (
        <div className="bg-white rounded-xl p-8 shadow-sm text-center">
          <Sparkles className="w-8 h-8 text-[#C5A059] mx-auto mb-3" />
          <p className="text-[#4A4A4A] mb-4">
            No more recommendations available. Try refreshing!
          </p>
          <Button onClick={refreshRecommendations} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh Recommendations
          </Button>
        </div>
      )
    }

    return (
      <div className="space-y-6">
        {/* Header with refresh button */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-[#C5A059]" />
            <h2 className="text-xl font-semibold text-[#1A1A1A]">
              Recommended for You
            </h2>
          </div>
          <Button
            onClick={refreshRecommendations}
            variant="ghost"
            size="sm"
            disabled={isFetching}
            className="text-[#0F4C5C]"
          >
            <RefreshCw
              className={`w-4 h-4 mr-1.5 ${isFetching ? 'animate-spin' : ''}`}
            />
            Refresh
          </Button>
        </div>

        {/* Categories */}
        {categoryKeys.map((category) => {
          const categoryInfo = CATEGORIES.find((c) => c.id === category)
          const vendors = filteredRecommendations[category]?.vendors || []

          return (
            <div key={category}>
              <h3 className="text-lg font-medium text-[#1A1A1A] mb-3">
                {categoryInfo?.name || category}
              </h3>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {vendors.slice(0, 3).map((vendor) => (
                  <RecommendationCard
                    key={vendor.id}
                    vendor={vendor}
                    onDismiss={handleDismiss}
                    onViewProfile={handleViewProfile}
                  />
                ))}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  export default RecommendationsSection
  ```

  Key features per CONTEXT.md:
  - Grouped by category needed
  - Top 3 vendors per category
  - Loading spinner with contextual message ("Finding vendors for your June Arangetram...")
  - Refresh button in header
  - Dismiss updates local state (session-based, not persisted)
  - Error state with "Try Again" button
  </action>
  <verify>
  ```bash
  grep -E "(export function|useRecommendations|refreshRecommendations|handleDismiss)" frontend/src/components/ai/RecommendationsSection.tsx
  ```
  </verify>
  <done>RecommendationsSection with category grouping, loading states, refresh, and dismiss functionality</done>
</task>

<task type="auto">
  <name>Task 2: Integrate recommendations into UserDashboard</name>
  <files>frontend/src/pages/UserDashboard.jsx</files>
  <action>
  Update UserDashboard.jsx to show recommendations:

  1. Add import at top:
     ```jsx
     import { RecommendationsSection } from '../components/ai/RecommendationsSection'
     ```

  2. Find the main content grid (should be `<div className="grid lg:grid-cols-3 gap-8">`)

  3. In the left column (lg:col-span-2), after the "My Events" section, add:
     ```jsx
     {/* AI Recommendations Section */}
     {events.length > 0 && (
       <section className="mt-8">
         <RecommendationsSection event={events[0]} />
       </section>
     )}
     ```

  4. Alternatively, if no events exist, the empty state already prompts to create an event (per CONTEXT.md: "When no event exists, show 'Create an event to get personalized recommendations' prompt")

  The existing EmptyEventsState already encourages creating events, so no change needed there.
  </action>
  <verify>
  ```bash
  grep -E "(RecommendationsSection|import.*RecommendationsSection)" frontend/src/pages/UserDashboard.jsx
  ```
  </verify>
  <done>UserDashboard shows RecommendationsSection when user has at least one event</done>
</task>

<task type="checkpoint:human-verify" gate="blocking">
  <what-built>AI recommendation UI on user dashboard with category grouping, explanations, dismiss, and refresh</what-built>
  <how-to-verify>
  1. Ensure frontend is running:
     ```bash
     cd frontend && yarn start
     ```

  2. Login to the app and navigate to User Dashboard

  3. If no events exist:
     - Verify "No events yet" prompt is shown
     - Create an event via the wizard

  4. With an event, verify recommendations:
     - "Recommended for You" section appears below My Events
     - Loading spinner shows with contextual message (e.g., "Finding vendors for your June Arangetram...")
     - Recommendations load grouped by category (e.g., Photographers, Caterers)
     - Each card shows vendor photo, name, location, price range
     - Each card has gold-highlighted AI explanation

  5. Test dismiss functionality:
     - Hover over a recommendation card
     - Click the X button
     - Card disappears, next vendor should show (if available)

  6. Test refresh:
     - Click "Refresh" button in header
     - Spinner animates
     - Recommendations reload

  7. Verify responsive layout:
     - On desktop: 3 cards per row
     - On mobile: 1-2 cards per row

  Expected: Full recommendation experience matching CONTEXT.md design decisions.
  </how-to-verify>
  <resume-signal>Type "approved" if recommendations work correctly, or describe any issues</resume-signal>
</task>

</tasks>

<verification>
- [ ] frontend/src/components/ai/RecommendationsSection.tsx exports RecommendationsSection
- [ ] RecommendationsSection uses useRecommendations hook
- [ ] RecommendationsSection groups by category
- [ ] RecommendationsSection has refresh button
- [ ] RecommendationsSection shows contextual loading message
- [ ] UserDashboard.jsx imports and renders RecommendationsSection
- [ ] Recommendations only shown when user has events
</verification>

<success_criteria>
Recommendation UI complete on dashboard:
- Categories from user's event shown with top 3 vendors each
- AI explanations visible on every card
- Dismiss button works (session-based)
- Refresh button reloads recommendations
- Loading/error states match CONTEXT.md design
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-04b-SUMMARY.md`
</output>

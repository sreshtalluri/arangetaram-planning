---
phase: 04-ai-enhancement
plan: 04a
type: execute
wave: 3
depends_on: ["04-02"]
files_modified:
  - frontend/src/components/ai/RecommendationCard.tsx
autonomous: true

must_haves:
  truths:
    - "RecommendationCard displays vendor info with AI explanation"
    - "Dismiss button (X) appears on hover"
    - "View Profile button navigates to vendor detail"
  artifacts:
    - path: "frontend/src/components/ai/RecommendationCard.tsx"
      provides: "Vendor card with AI explanation and dismiss button"
      exports: ["RecommendationCard"]
  key_links:
    - from: "frontend/src/components/ai/RecommendationCard.tsx"
      to: "useRecommendations types"
      via: "RecommendedVendor type import"
      pattern: "import.*useRecommendations"
---

<objective>
Create RecommendationCard component for displaying AI-powered vendor recommendations.

Purpose: Atomic card component showing vendor details plus AI explanation. Splitting allows focus on card design.
Output: RecommendationCard.tsx with vendor info, AI explanation, dismiss, and view profile.
</objective>

<execution_context>
@~/.claude/get-shit-done/workflows/execute-plan.md
@~/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@.planning/PROJECT.md
@.planning/phases/04-ai-enhancement/04-CONTEXT.md
@.planning/phases/04-ai-enhancement/04-02-SUMMARY.md
@frontend/src/hooks/useRecommendations.ts
@frontend/src/components/VendorCard.jsx
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create RecommendationCard component</name>
  <files>frontend/src/components/ai/RecommendationCard.tsx</files>
  <action>
  Create **frontend/src/components/ai/RecommendationCard.tsx:**

  ```typescript
  import { X, MapPin, Sparkles } from 'lucide-react'
  import { Button } from '../ui/button'
  import type { RecommendedVendor } from '../../hooks/useRecommendations'

  interface RecommendationCardProps {
    vendor: RecommendedVendor
    onDismiss: (vendorId: string) => void
    onViewProfile: (vendorId: string) => void
  }

  export function RecommendationCard({
    vendor,
    onDismiss,
    onViewProfile,
  }: RecommendationCardProps) {
    return (
      <div className="relative bg-white rounded-xl border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow group">
        {/* Dismiss button */}
        <button
          onClick={() => onDismiss(vendor.id)}
          className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
          aria-label="Dismiss recommendation"
        >
          <X className="w-4 h-4 text-[#888888]" />
        </button>

        {/* Vendor image */}
        <div className="aspect-[4/3] bg-[#F9F8F4] overflow-hidden">
          {vendor.profile_photo_url ? (
            <img
              src={vendor.profile_photo_url}
              alt={vendor.business_name}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[#888888]">
              <span className="text-4xl font-light">
                {vendor.business_name.charAt(0)}
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 space-y-3">
          {/* Header */}
          <div>
            <h4 className="font-semibold text-[#1A1A1A] line-clamp-1">
              {vendor.business_name}
            </h4>
            <div className="flex items-center gap-2 text-sm text-[#888888] mt-0.5">
              <MapPin className="w-3.5 h-3.5" />
              <span className="line-clamp-1">{vendor.location}</span>
              <span className="text-[#E5E5E5]">|</span>
              <span className="font-medium text-[#0F4C5C]">
                {vendor.price_range}
              </span>
            </div>
          </div>

          {/* AI Explanation */}
          <div className="flex gap-2 p-2.5 bg-[#FFF9E6] rounded-lg">
            <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
            <p className="text-sm text-[#4A4A4A] leading-relaxed">
              {vendor.aiExplanation}
            </p>
          </div>

          {/* Action */}
          <Button
            onClick={() => onViewProfile(vendor.id)}
            variant="outline"
            className="w-full text-sm"
          >
            View Profile
          </Button>
        </div>
      </div>
    )
  }

  export default RecommendationCard
  ```

  Key features per CONTEXT.md:
  - Full vendor card: photo, name, location, price range
  - Explanation inline, always visible (gold background with sparkle icon)
  - Dismiss button (X) appears on hover
  - View Profile button to navigate to vendor detail
  </action>
  <verify>
  ```bash
  grep -E "(export function|aiExplanation|onDismiss)" frontend/src/components/ai/RecommendationCard.tsx
  ```
  </verify>
  <done>RecommendationCard component with AI explanation, dismiss button, and view profile action</done>
</task>

</tasks>

<verification>
- [ ] frontend/src/components/ai/RecommendationCard.tsx exports RecommendationCard
- [ ] RecommendationCard shows AI explanation inline with gold background
- [ ] RecommendationCard has dismiss button (X) on hover
- [ ] RecommendationCard has View Profile button
- [ ] Card shows vendor photo, name, location, price range
</verification>

<success_criteria>
RecommendationCard ready for RecommendationsSection:
- Vendor info displayed clearly
- AI explanation highlighted with sparkle icon
- Dismiss and View Profile actions functional
</success_criteria>

<output>
After completion, create `.planning/phases/04-ai-enhancement/04-04a-SUMMARY.md`
</output>

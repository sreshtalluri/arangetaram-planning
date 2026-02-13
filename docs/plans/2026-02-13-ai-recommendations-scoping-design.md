# AI Recommendations Scoping & Profile Photos

**Date:** 2026-02-13
**Status:** Approved

## Problem

1. **Recommendations show all categories** — the edge function generates recommendations for every `categories_needed` entry, including categories the user has already booked vendors for (`categories_covered`). Users see irrelevant suggestions.
2. **Vendor profile photos missing** — seed vendors and many real vendors have no `profile_photo_url`, showing a bare initial letter. Portfolio images exist but aren't used as fallback.

## Design

### Backend: Scope to Pending Categories

**File:** `supabase/functions/ai-recommendations/index.ts`

Changes to the edge function:

1. Add `categories_covered` to the event select query
2. Add `categories_covered: string[]` to the `Event` interface
3. Compute pending categories: `categories_needed - categories_covered`
4. If no pending categories, return `{ categories: {}, allCovered: true }` — distinguishes "all booked" from "no vendors found"
5. Iterate over `pendingCategories` instead of `categories_needed`
6. Send `pendingCategories` in AI context instead of `categories_needed`

### Backend: Fetch Portfolio Images for Recommendations

**File:** `supabase/functions/ai-recommendations/index.ts`

For each candidate vendor batch, also query `vendor_portfolios` to get image URLs. Include the first portfolio image in the enriched response so the frontend can use it as a photo fallback.

- Add `portfolio_images?: string[]` to the `VendorProfile` interface
- After fetching candidates per category, batch-query `vendor_portfolios` for those vendor IDs
- Attach `portfolio_images` array to each candidate before enrichment

### Frontend: Celebratory "All Covered" State

**File:** `frontend/src/components/ai/RecommendationsSection.tsx`

When `allCovered: true` is returned:
- Gold checkmark icon (#C5A059)
- "All Vendors Booked!" heading (Playfair Display)
- Subtext: "You've found vendors for every category. Your Arangetram is coming together!"
- No refresh button

**File:** `frontend/src/hooks/useRecommendations.ts`

Expose `allCovered` boolean from the response data.

### Frontend: Photo Fallback Chain

**File:** `frontend/src/components/ai/RecommendationCard.tsx`

Image priority:
1. `vendor.profile_photo_url` — direct profile photo
2. `vendor.portfolio_images?.[0]` — first portfolio image
3. Category-themed placeholder — icon + colored background per category

Category placeholder mapping:
| Category | Icon | Background |
|----------|------|------------|
| venue | Building2 | warm stone |
| catering | UtensilsCrossed | warm gold |
| photography | Camera | cool slate |
| videography | Video | cool blue |
| stage_decoration | Palette | rose |
| musicians | Music | deep purple |
| nattuvanar | Music2 | burgundy |
| makeup | Sparkles | soft pink |
| invitations | Mail | amber |
| costumes | Shirt | teal |
| return_gifts | Gift | sage |

## Files Changed

- `supabase/functions/ai-recommendations/index.ts` — pending categories logic + portfolio query
- `frontend/src/hooks/useRecommendations.ts` — expose `allCovered`
- `frontend/src/components/ai/RecommendationsSection.tsx` — celebratory state
- `frontend/src/components/ai/RecommendationCard.tsx` — photo fallback chain

## Success Criteria

- Recommendations only appear for categories without booked vendors
- When all categories are covered, celebratory message displays
- Every recommendation card shows a meaningful image (profile photo, portfolio, or themed placeholder)
- No regressions to existing recommendation flow

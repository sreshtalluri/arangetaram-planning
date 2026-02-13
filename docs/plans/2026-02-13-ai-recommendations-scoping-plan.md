# AI Recommendations Scoping & Profile Photos — Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Only show AI vendor recommendations for categories the user hasn't booked yet, and display meaningful images on every recommendation card.

**Architecture:** Backend edge function filters to pending categories and fetches portfolio images. Frontend shows celebratory state when all categories covered, and uses a 3-tier image fallback (profile photo → portfolio image → category-themed placeholder).

**Tech Stack:** Supabase Edge Functions (Deno), React 19, TanStack React Query, Tailwind CSS, Lucide icons

---

### Task 1: Backend — Scope to Pending Categories

**Files:**
- Modify: `supabase/functions/ai-recommendations/index.ts`

**Step 1: Update the Event interface (line 5-11)**

Add `categories_covered` to the interface:

```typescript
interface Event {
  id: string;
  event_date: string;
  location?: string;
  budget?: number;
  categories_needed: string[];
  categories_covered: string[];
}
```

**Step 2: Update the event select query (line 81)**

Change:
```typescript
.select('id, event_date, location, budget, categories_needed')
```
To:
```typescript
.select('id, event_date, location, budget, categories_needed, categories_covered')
```

**Step 3: Compute pending categories and add allCovered early return (after line 95)**

After `const eventData = event as Event;` and before the existing empty-categories check, add:

```typescript
// Compute pending categories (needed but not yet covered)
const pendingCategories = (eventData.categories_needed || []).filter(
  cat => !(eventData.categories_covered || []).includes(cat)
);

// All categories covered — return success with allCovered flag
if (pendingCategories.length === 0) {
  return new Response(
    JSON.stringify({
      categories: {},
      allCovered: true,
    }),
    {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    }
  );
}
```

**Step 4: Change loop to iterate pendingCategories (line 113)**

Change:
```typescript
for (const category of eventData.categories_needed) {
```
To:
```typescript
for (const category of pendingCategories) {
```

**Step 5: Update AI context to send pending categories (line 198)**

Change:
```typescript
categories_needed: eventData.categories_needed,
```
To:
```typescript
categories_needed: pendingCategories,
```

**Step 6: Commit**

```bash
git add supabase/functions/ai-recommendations/index.ts
git commit -m "feat: scope AI recommendations to pending categories only"
```

---

### Task 2: Backend — Fetch Portfolio Images for Candidates

**Files:**
- Modify: `supabase/functions/ai-recommendations/index.ts`

**Step 1: Add portfolio_images to VendorProfile interface (line 13-22)**

```typescript
interface VendorProfile {
  id: string;
  business_name: string;
  description?: string;
  category: string;
  service_areas: string[];
  price_min?: number;
  price_max?: number;
  profile_photo_url?: string;
  portfolio_images?: string[];
}
```

**Step 2: Fetch portfolio images after building candidatesByCategory**

After the availability filtering loop (after line 169, before the `totalCandidates` check), add a batch query to get portfolio images for all candidate vendors and resolve their public URLs:

```typescript
// Fetch portfolio images for all candidates
const allCandidateIds = Object.values(candidatesByCategory)
  .flat()
  .map(v => v.id);

if (allCandidateIds.length > 0) {
  const { data: portfolioRows } = await supabase
    .from('portfolio_images')
    .select('vendor_id, storage_path')
    .in('vendor_id', allCandidateIds)
    .order('order_index', { ascending: true });

  // Group portfolio images by vendor and resolve public URLs
  const portfolioByVendor: { [vendorId: string]: string[] } = {};
  for (const row of portfolioRows || []) {
    if (!portfolioByVendor[row.vendor_id]) {
      portfolioByVendor[row.vendor_id] = [];
    }
    const { data } = supabase.storage
      .from('portfolio-images')
      .getPublicUrl(row.storage_path);
    portfolioByVendor[row.vendor_id].push(data.publicUrl);
  }

  // Attach portfolio images to candidates
  for (const vendors of Object.values(candidatesByCategory)) {
    for (const vendor of vendors) {
      vendor.portfolio_images = portfolioByVendor[vendor.id] || [];
    }
  }
}
```

**Step 3: Commit**

```bash
git add supabase/functions/ai-recommendations/index.ts
git commit -m "feat: include portfolio images in recommendation responses"
```

---

### Task 3: Frontend — Expose allCovered in useRecommendations Hook

**Files:**
- Modify: `frontend/src/hooks/useRecommendations.ts`

**Step 1: Update RecommendationsResponse interface (line 13-15)**

```typescript
export interface RecommendationsResponse {
  categories: Record<string, CategoryRecommendations>
  allCovered?: boolean
}
```

**Step 2: Expose allCovered in the hook return (line 47-51)**

Change:
```typescript
return {
  ...query,
  recommendations: query.data?.categories || {},
  refreshRecommendations,
}
```
To:
```typescript
return {
  ...query,
  recommendations: query.data?.categories || {},
  allCovered: query.data?.allCovered || false,
  refreshRecommendations,
}
```

**Step 3: Commit**

```bash
git add frontend/src/hooks/useRecommendations.ts
git commit -m "feat: expose allCovered flag from recommendations hook"
```

---

### Task 4: Frontend — Celebratory "All Covered" State

**Files:**
- Modify: `frontend/src/components/ai/RecommendationsSection.tsx`

**Step 1: Add CheckCircle2 to imports (line 3)**

Change:
```typescript
import { Sparkles, RefreshCw, Loader2, AlertCircle } from 'lucide-react'
```
To:
```typescript
import { Sparkles, RefreshCw, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'
```

**Step 2: Destructure allCovered from the hook (line 18-25)**

Add `allCovered` to the destructured values:

```typescript
const {
  recommendations,
  isLoading,
  isError,
  error,
  allCovered,
  refreshRecommendations,
  isFetching,
} = useRecommendations({ eventId: event.id })
```

**Step 3: Add celebratory state after error handling (after line 78, before line 80)**

Insert before `const categoryKeys = ...`:

```tsx
// All categories covered — celebratory state
if (allCovered) {
  return (
    <div className="bg-white rounded-xl p-8 shadow-sm text-center">
      <CheckCircle2 className="w-10 h-10 text-[#C5A059] mx-auto mb-3" />
      <h2
        className="text-xl font-semibold text-[#1A1A1A] mb-2"
        style={{ fontFamily: 'Playfair Display, serif' }}
      >
        All Vendors Booked!
      </h2>
      <p className="text-[#4A4A4A]">
        You've found vendors for every category. Your Arangetram is coming together!
      </p>
    </div>
  )
}
```

**Step 4: Commit**

```bash
git add frontend/src/components/ai/RecommendationsSection.tsx
git commit -m "feat: show celebratory message when all vendor categories covered"
```

---

### Task 5: Frontend — Photo Fallback Chain on RecommendationCard

**Files:**
- Modify: `frontend/src/components/ai/RecommendationCard.tsx`

**Step 1: Update imports (line 1)**

Change:
```typescript
import { X, MapPin, Sparkles } from 'lucide-react'
```
To:
```typescript
import {
  X, MapPin, Sparkles,
  Building2, UtensilsCrossed, Camera, Video, Palette,
  Music, Mic2, Mail, Crown, Gift,
} from 'lucide-react'
```

**Step 2: Add category placeholder config after the imports (before the interface)**

```typescript
const CATEGORY_PLACEHOLDERS: Record<string, { icon: React.ElementType; bg: string }> = {
  venue:            { icon: Building2,        bg: 'bg-[#D4C5A9]' },
  catering:         { icon: UtensilsCrossed,  bg: 'bg-[#C5A059]/20' },
  photography:      { icon: Camera,           bg: 'bg-slate-200' },
  videography:      { icon: Video,            bg: 'bg-sky-100' },
  stage_decoration: { icon: Palette,          bg: 'bg-rose-100' },
  musicians:        { icon: Music,            bg: 'bg-purple-100' },
  nattuvanar:       { icon: Mic2,             bg: 'bg-[#800020]/10' },
  makeup_artist:    { icon: Sparkles,         bg: 'bg-pink-100' },
  invitations:      { icon: Mail,             bg: 'bg-amber-100' },
  costumes:         { icon: Crown,            bg: 'bg-[#0F4C5C]/10' },
  return_gifts:     { icon: Gift,             bg: 'bg-emerald-100' },
}
```

**Step 3: Replace the vendor image section (lines 28-42)**

Replace the entire `{/* Vendor image */}` block with:

```tsx
{/* Vendor image */}
<div className="aspect-[4/3] bg-[#F9F8F4] overflow-hidden">
  {vendor.profile_photo_url ? (
    <img
      src={vendor.profile_photo_url}
      alt={vendor.business_name}
      className="w-full h-full object-cover"
    />
  ) : vendor.portfolio_images && vendor.portfolio_images.length > 0 ? (
    <img
      src={vendor.portfolio_images[0]}
      alt={vendor.business_name}
      className="w-full h-full object-cover"
    />
  ) : (
    (() => {
      const placeholder = CATEGORY_PLACEHOLDERS[vendor.category]
      const Icon = placeholder?.icon || Sparkles
      const bgClass = placeholder?.bg || 'bg-[#F9F8F4]'
      return (
        <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${bgClass}`}>
          <Icon className="w-10 h-10 text-[#888888]/60" />
          <span className="text-sm font-medium text-[#888888]/80">
            {vendor.business_name.charAt(0)}{vendor.business_name.split(' ')[1]?.charAt(0) || ''}
          </span>
        </div>
      )
    })()
  )}
</div>
```

**Step 4: Commit**

```bash
git add frontend/src/components/ai/RecommendationCard.tsx
git commit -m "feat: add portfolio fallback and category-themed placeholders for recommendation cards"
```

---

### Task 6: Verify and Push

**Step 1: Check for TypeScript errors**

Run: `cd frontend && npx tsc --noEmit 2>&1 | head -20`
Expected: No errors related to changed files

**Step 2: Verify the build compiles**

Run: `cd frontend && npx craco build 2>&1 | tail -10`
Expected: Build succeeds

**Step 3: Push all commits**

```bash
git push
```

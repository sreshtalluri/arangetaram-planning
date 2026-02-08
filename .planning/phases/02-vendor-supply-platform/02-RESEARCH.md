# Phase 2: Vendor Supply Platform - Research

**Researched:** 2026-02-07
**Domain:** Vendor profile creation, portfolio management, availability calendar, and dashboard
**Confidence:** HIGH

## Summary

This phase builds the vendor-facing functionality for the Arangetaram marketplace. Vendors need to create complete profiles with business information, upload portfolio images, manage availability calendars, and access a dashboard to monitor their listings. The existing codebase provides a strong foundation with Supabase authentication, React Query for data fetching, and shadcn/ui components (including react-day-picker Calendar).

The implementation strategy centers on three key patterns: (1) multi-step form wizard with auto-save using react-hook-form and React Context for state persistence, (2) Supabase Storage for portfolio image uploads with RLS policies, and (3) the existing react-day-picker component extended with multiple selection mode for availability management. The current `VendorDashboard.jsx` already demonstrates the tab-based layout and profile form pattern, which will be expanded to support the full feature set.

**Primary recommendation:** Extend the existing Supabase database with `vendor_profiles`, `portfolio_images`, and `vendor_availability` tables, use Supabase Storage with folder-per-vendor RLS policies for images, and build a multi-step wizard using react-hook-form with localStorage auto-save.

## Standard Stack

The established libraries/tools for this domain:

### Core (Already in Project)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95.3 | Database, storage, auth | Already integrated, handles RLS natively |
| react-hook-form | ^7.56.2 | Form state management | Already in project, excellent multi-step support |
| @hookform/resolvers | ^5.0.1 | Zod integration | Already in project for form validation |
| zod | ^3.24.4 | Schema validation | Already in project, type-safe validation |
| @tanstack/react-query | ^5.90.20 | Data fetching & caching | Already integrated with useProfile pattern |
| react-day-picker | 8.10.1 | Calendar component | Already in project as shadcn Calendar |
| date-fns | ^4.1.0 | Date manipulation | Already in project, pairs with react-day-picker |
| sonner | ^2.0.3 | Toast notifications | Already in project |

### Supporting (Already in Project)
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| lucide-react | ^0.507.0 | Icons | UI icons throughout vendor portal |
| class-variance-authority | ^0.7.1 | Component variants | Button/card variants |
| tailwind-merge | ^3.2.0 | Class merging | Conditional styling |

### New Addition Needed
| Library | Version | Purpose | Why Needed |
|---------|---------|---------|------------|
| @dnd-kit/core | ^6.x | Drag and drop | Image reordering in portfolio |
| @dnd-kit/sortable | ^8.x | Sortable lists | Portfolio image ordering |
| @dnd-kit/utilities | ^3.x | DnD utilities | Transform helpers |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| dnd-kit | react-beautiful-dnd | dnd-kit is actively maintained, hooks-based, lighter weight |
| react-day-picker | react-multi-date-picker | Already have react-day-picker in shadcn, supports multiple mode |
| localStorage auto-save | Zustand persist | localStorage is simpler for single-form use case |

**Installation:**
```bash
cd frontend && yarn add @dnd-kit/core @dnd-kit/sortable @dnd-kit/utilities
```

## Architecture Patterns

### Recommended Project Structure
```
src/
├── components/
│   ├── vendor/                    # Vendor-specific components
│   │   ├── ProfileWizard/         # Multi-step wizard container
│   │   │   ├── index.tsx
│   │   │   ├── StepBasics.tsx     # Step 1: name, description
│   │   │   ├── StepCategory.tsx   # Step 2: category selection
│   │   │   ├── StepServices.tsx   # Step 3: areas, pricing
│   │   │   ├── StepPortfolio.tsx  # Step 4: image uploads
│   │   │   └── StepProgress.tsx   # Progress indicator
│   │   ├── AvailabilityCalendar.tsx
│   │   ├── PortfolioGallery.tsx
│   │   └── PortfolioUploader.tsx
│   └── ui/                        # Existing shadcn components
├── hooks/
│   ├── useVendorProfile.ts        # Vendor profile CRUD
│   ├── usePortfolio.ts            # Portfolio image management
│   └── useAvailability.ts         # Availability calendar
├── lib/
│   ├── supabase.ts                # Existing client
│   ├── storage.ts                 # Storage upload helpers
│   └── vendor-categories.ts       # Category definitions
└── pages/
    └── vendor/
        ├── ProfileWizardPage.tsx  # Multi-step profile creation
        └── DashboardPage.tsx      # Refactored vendor dashboard
```

### Pattern 1: Multi-Step Form Wizard with Auto-Save
**What:** Split profile creation into steps with automatic localStorage persistence
**When to use:** Complex forms with 4+ sections requiring user to complete over time
**Example:**
```typescript
// Source: https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form

import { useForm, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useEffect } from 'react';

const STORAGE_KEY = 'vendor-profile-draft';

export function ProfileWizard() {
  const [step, setStep] = useState(1);

  // Load saved draft on mount
  const savedData = localStorage.getItem(STORAGE_KEY);
  const defaultValues = savedData ? JSON.parse(savedData) : {};

  const methods = useForm({
    resolver: zodResolver(profileSchema),
    defaultValues,
    mode: 'onChange',
  });

  // Auto-save on change
  useEffect(() => {
    const subscription = methods.watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    });
    return () => subscription.unsubscribe();
  }, [methods]);

  const handleComplete = async (data) => {
    await createVendorProfile(data);
    localStorage.removeItem(STORAGE_KEY); // Clear draft
  };

  return (
    <FormProvider {...methods}>
      <StepProgress currentStep={step} />
      {step === 1 && <StepBasics onNext={() => setStep(2)} />}
      {step === 2 && <StepCategory onNext={() => setStep(3)} onBack={() => setStep(1)} />}
      {step === 3 && <StepServices onNext={() => setStep(4)} onBack={() => setStep(2)} />}
      {step === 4 && <StepPortfolio onSubmit={handleComplete} onBack={() => setStep(3)} />}
    </FormProvider>
  );
}
```

### Pattern 2: Supabase Storage with Folder-Per-Vendor
**What:** Organize portfolio images in vendor-specific folders with RLS
**When to use:** User-uploaded files requiring access control
**Example:**
```typescript
// Source: https://supabase.com/docs/guides/storage/security/access-control

export async function uploadPortfolioImage(
  vendorId: string,
  file: File,
  orderIndex: number
): Promise<string> {
  const fileExt = file.name.split('.').pop();
  const fileName = `${orderIndex}-${Date.now()}.${fileExt}`;
  const filePath = `${vendorId}/${fileName}`;

  const { data, error } = await supabase.storage
    .from('portfolio-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL with optional transformation
  const { data: urlData } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(filePath, {
      transform: {
        width: 800,
        height: 600,
        resize: 'cover',
      },
    });

  return urlData.publicUrl;
}
```

### Pattern 3: Multiple Date Selection with react-day-picker
**What:** Calendar with multiple date selection for blocking availability
**When to use:** Availability management where vendor blocks multiple dates
**Example:**
```typescript
// Source: https://daypicker.dev/docs/selection-modes

import { DayPicker } from 'react-day-picker';
import { useState } from 'react';

export function AvailabilityCalendar({
  blockedDates,
  onBlockDates
}: {
  blockedDates: Date[];
  onBlockDates: (dates: Date[]) => void;
}) {
  const [selected, setSelected] = useState<Date[]>(blockedDates);

  const handleSelect = (dates: Date[] | undefined) => {
    if (dates) {
      setSelected(dates);
      onBlockDates(dates);
    }
  };

  return (
    <DayPicker
      mode="multiple"
      selected={selected}
      onSelect={handleSelect}
      disabled={{ before: new Date() }} // Can't block past dates
      modifiers={{
        booked: selected,
      }}
      modifiersClassNames={{
        booked: 'bg-red-100 text-red-800',
      }}
    />
  );
}
```

### Pattern 4: Image Preview Before Upload
**What:** Show image preview using URL.createObjectURL before uploading
**When to use:** File upload UIs where user needs to verify selection
**Example:**
```typescript
// Source: https://www.kindacode.com/article/react-show-image-preview-before-uploading

export function ImageUploader({ onUpload }: { onUpload: (file: File) => void }) {
  const [preview, setPreview] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (!selected) return;

    // Create preview URL
    const objectUrl = URL.createObjectURL(selected);
    setPreview(objectUrl);
    setFile(selected);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (preview) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  const handleConfirm = () => {
    if (file) onUpload(file);
  };

  return (
    <div>
      <input type="file" accept="image/*" onChange={handleFileSelect} />
      {preview && <img src={preview} alt="Preview" className="w-48 h-48 object-cover" />}
      {file && <Button onClick={handleConfirm}>Upload</Button>}
    </div>
  );
}
```

### Anti-Patterns to Avoid
- **Storing images as base64 in database:** Use Supabase Storage with URLs stored in database
- **Single-form profile creation:** Use multi-step wizard for better UX with complex data
- **Polling for availability updates:** Use React Query's staleTime and invalidation
- **Client-side only validation:** Always validate on backend with RLS policies
- **Storing draft in component state:** Use localStorage for persistence across sessions

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upload progress | Custom XHR tracking | Supabase Storage + UI feedback | Built-in, handles errors |
| Image resizing | Canvas manipulation | Supabase Image Transforms | CDN-based, automatic WebP |
| Drag-to-reorder images | Custom drag handlers | @dnd-kit/sortable | Accessible, performant |
| Form state persistence | Manual localStorage sync | react-hook-form watch + localStorage | Automatic, type-safe |
| Date range selection | Custom date logic | react-day-picker range mode | Tested edge cases |
| Calendar styling | Custom CSS | shadcn Calendar classNames prop | Consistent with design system |

**Key insight:** This phase heavily uses CRUD operations with file uploads. Supabase provides everything needed (database, storage, RLS). The complexity is in the UX patterns (wizard, drag-drop, calendar), which have battle-tested libraries.

## Common Pitfalls

### Pitfall 1: Supabase Storage RLS Not Configured
**What goes wrong:** Images upload but can't be viewed, or anyone can upload to any folder
**Why it happens:** Storage buckets are private by default, RLS policies required for access
**How to avoid:** Set up RLS policies before implementing upload UI:
```sql
-- Allow vendors to upload to their own folder
CREATE POLICY "Vendors can upload own images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'portfolio-images' AND
  (storage.foldername(name))[1] = (SELECT auth.uid())::text
);

-- Allow public read for portfolio images
CREATE POLICY "Public can view portfolio images"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio-images');
```
**Warning signs:** 403 errors on upload, images not displaying on public profile

### Pitfall 2: Form Data Lost on Browser Refresh
**What goes wrong:** User fills out multiple steps, refreshes browser, loses all progress
**Why it happens:** React state doesn't persist across page reloads
**How to avoid:** Implement auto-save to localStorage using react-hook-form's watch method
**Warning signs:** User complaints about lost progress, high wizard abandonment rate

### Pitfall 3: Calendar Doesn't Handle Timezone Correctly
**What goes wrong:** Vendor blocks March 15, but users in different timezone see March 14 blocked
**Why it happens:** JavaScript Date objects store UTC, display in local timezone
**How to avoid:** Store dates as date strings (YYYY-MM-DD) not timestamps, use date-fns for parsing
```typescript
// Store as date string
const blockedDate = format(selectedDate, 'yyyy-MM-dd');

// Parse consistently
const displayDate = parseISO(blockedDate);
```
**Warning signs:** Off-by-one day errors, timezone-related bug reports

### Pitfall 4: Portfolio Image Order Not Preserved
**What goes wrong:** Vendor carefully orders images, order randomizes on reload
**Why it happens:** Images stored without order metadata, relying on array index
**How to avoid:** Store explicit `order_index` column in portfolio_images table, update all indices on reorder
**Warning signs:** Images appear in different order each time, drag-drop changes don't persist

### Pitfall 5: Large Image Uploads Timeout or Fail
**What goes wrong:** Users with large camera photos get upload errors
**Why it happens:** Standard upload method limited to ~6MB, no retry logic
**How to avoid:** Validate file size client-side (< 5MB), show user-friendly error with compression hint
```typescript
const MAX_SIZE = 5 * 1024 * 1024; // 5MB
if (file.size > MAX_SIZE) {
  toast.error('Image too large. Please use an image under 5MB.');
  return;
}
```
**Warning signs:** Upload failures with large files, user frustration

### Pitfall 6: Incomplete Profile Still Shows in Listings
**What goes wrong:** Vendor creates partial profile, appears in search with missing data
**Why it happens:** No `is_complete` flag or minimum-fields check
**How to avoid:** Add `is_published` boolean, only show vendors where `is_published = true`
**Warning signs:** Empty vendor cards in listings, bad user experience for families

## Code Examples

Verified patterns from official sources:

### Supabase Storage Upload with RLS
```typescript
// Source: https://supabase.com/docs/guides/storage/uploads/standard-uploads

import { supabase } from '@/lib/supabase';

export async function uploadPortfolioImage(
  vendorId: string,
  file: File,
  orderIndex: number
): Promise<{ path: string; url: string }> {
  // Validate file
  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File size must be under 5MB');
  }

  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!allowedTypes.includes(file.type)) {
    throw new Error('File must be JPEG, PNG, or WebP');
  }

  // Generate unique filename
  const ext = file.name.split('.').pop();
  const fileName = `${orderIndex}-${Date.now()}.${ext}`;
  const filePath = `${vendorId}/${fileName}`;

  // Upload to storage
  const { error } = await supabase.storage
    .from('portfolio-images')
    .upload(filePath, file, {
      cacheControl: '3600',
      upsert: false,
    });

  if (error) throw error;

  // Get public URL with transformation
  const { data } = supabase.storage
    .from('portfolio-images')
    .getPublicUrl(filePath, {
      transform: {
        width: 800,
        height: 600,
        resize: 'cover',
        quality: 80,
      },
    });

  return { path: filePath, url: data.publicUrl };
}
```

### Database Schema for Vendor Profiles
```sql
-- Source: Supabase PostgreSQL best practices

-- Vendor profiles table (extends auth profiles)
CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'venue', 'catering', 'photography', 'videography',
    'stage_decoration', 'musicians', 'nattuvanar',
    'makeup_artist', 'invitations', 'costumes', 'return_gifts'
  )),
  service_areas TEXT[] DEFAULT '{}',
  price_min INTEGER,
  price_max INTEGER,
  profile_photo_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio images table
CREATE TABLE public.portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vendor availability table
CREATE TABLE public.vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, blocked_date)
);

-- Enable RLS
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- RLS Policies for vendor_profiles
CREATE POLICY "Public can view published vendors"
ON public.vendor_profiles FOR SELECT
USING (is_published = true);

CREATE POLICY "Vendors can view own profile"
ON public.vendor_profiles FOR SELECT
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Vendors can update own profile"
ON public.vendor_profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

CREATE POLICY "Vendors can insert own profile"
ON public.vendor_profiles FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

-- RLS Policies for portfolio_images
CREATE POLICY "Public can view portfolio images"
ON public.portfolio_images FOR SELECT
USING (true);

CREATE POLICY "Vendors can manage own portfolio"
ON public.portfolio_images FOR ALL
USING (vendor_id = (SELECT auth.uid()));

-- RLS Policies for vendor_availability
CREATE POLICY "Public can view availability"
ON public.vendor_availability FOR SELECT
USING (true);

CREATE POLICY "Vendors can manage own availability"
ON public.vendor_availability FOR ALL
USING (vendor_id = (SELECT auth.uid()));
```

### React Query Hook for Vendor Profile
```typescript
// Source: TanStack Query patterns + existing useProfile.ts

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface VendorProfile {
  id: string;
  business_name: string;
  description: string | null;
  category: string;
  service_areas: string[];
  price_min: number | null;
  price_max: number | null;
  profile_photo_url: string | null;
  is_published: boolean;
}

export function useVendorProfile(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['vendor-profile', vendorId],
    queryFn: async (): Promise<VendorProfile | null> => {
      if (!vendorId) return null;

      const { data, error } = await supabase
        .from('vendor_profiles')
        .select('*')
        .eq('id', vendorId)
        .single();

      if (error && error.code !== 'PGRST116') throw error;
      return data;
    },
    enabled: !!vendorId,
    staleTime: 60 * 1000,
  });
}

export function useUpdateVendorProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      vendorId,
      updates
    }: {
      vendorId: string;
      updates: Partial<VendorProfile>
    }) => {
      const { data, error } = await supabase
        .from('vendor_profiles')
        .upsert({ id: vendorId, ...updates })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['vendor-profile', data.id] });
    },
  });
}
```

### Vendor Categories with Cultural Context
```typescript
// Source: Phase requirements + design context

export const VENDOR_CATEGORIES = [
  {
    value: 'venue',
    label: 'Venue',
    description: 'Temples, cultural centers, banquet halls for the ceremony',
    icon: 'Building2',
  },
  {
    value: 'catering',
    label: 'Catering',
    description: 'South Indian cuisine and traditional feast preparation',
    icon: 'UtensilsCrossed',
  },
  {
    value: 'photography',
    label: 'Photography',
    description: 'Professional photography for the dance debut',
    icon: 'Camera',
  },
  {
    value: 'videography',
    label: 'Videography',
    description: 'Video recording and highlights of the performance',
    icon: 'Video',
  },
  {
    value: 'stage_decoration',
    label: 'Stage Decoration',
    description: 'Traditional stage setup with flowers and drapery',
    icon: 'Palette',
  },
  {
    value: 'musicians',
    label: 'Musicians',
    description: 'Carnatic music accompaniment for the performance',
    icon: 'Music',
  },
  {
    value: 'nattuvanar',
    label: 'Nattuvanar',
    description: 'Dance conductor providing rhythmic recitation',
    icon: 'Mic2',
  },
  {
    value: 'makeup_artist',
    label: 'Makeup Artist',
    description: 'Traditional Bharatanatyam makeup and styling',
    icon: 'Sparkles',
  },
  {
    value: 'invitations',
    label: 'Invitations & Printing',
    description: 'Traditional invitation cards and event programs',
    icon: 'Mail',
  },
  {
    value: 'costumes',
    label: 'Costumes & Jewelry',
    description: 'Bharatanatyam costumes and temple jewelry rental',
    icon: 'Crown',
  },
  {
    value: 'return_gifts',
    label: 'Return Gifts',
    description: 'Traditional return gifts for guests',
    icon: 'Gift',
  },
] as const;

export type VendorCategory = typeof VENDOR_CATEGORIES[number]['value'];
```

### dnd-kit Sortable Portfolio Grid
```typescript
// Source: https://dndkit.com/ patterns

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface PortfolioImage {
  id: string;
  url: string;
  caption?: string;
}

function SortableImage({ image }: { image: PortfolioImage }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: image.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <img src={image.url} alt={image.caption || ''} className="w-full h-48 object-cover rounded-lg" />
    </div>
  );
}

export function SortablePortfolio({
  images,
  onReorder,
}: {
  images: PortfolioImage[];
  onReorder: (images: PortfolioImage[]) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = images.findIndex((img) => img.id === active.id);
      const newIndex = images.findIndex((img) => img.id === over.id);
      const newOrder = arrayMove(images, oldIndex, newIndex);
      onReorder(newOrder);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={images.map(i => i.id)} strategy={rectSortingStrategy}>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {images.map((image) => (
            <SortableImage key={image.id} image={image} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Store images as base64 blobs | Object storage with CDN URLs | 2024+ | Better performance, lower costs |
| Single-page long forms | Multi-step wizards with progress | 2023+ | Higher completion rates |
| react-beautiful-dnd | dnd-kit | 2023+ | Active maintenance, hooks-based |
| Manual date handling | date-fns with ISO strings | Ongoing | Timezone safety |
| Separate forms per step | react-hook-form FormProvider | 2024+ | Unified validation, simpler state |

**Deprecated/outdated:**
- react-beautiful-dnd: No longer actively maintained, use dnd-kit instead
- Storing file metadata in localStorage: Use database for persistence
- Inline base64 images: Poor performance, use Storage URLs

## Open Questions

Things that couldn't be fully resolved:

1. **Supabase Image Transforms availability**
   - What we know: Image transforms require Pro plan or above
   - What's unclear: Whether the project has Pro plan access
   - Recommendation: Check plan, fall back to client-side resizing if Free tier

2. **Drag-select for date ranges in availability calendar**
   - What we know: react-day-picker supports range mode and multiple mode separately
   - What's unclear: Whether both drag-select AND individual click can work together
   - Recommendation: Start with multiple mode + Shift-click for ranges, iterate based on feedback

3. **Metro area list for service areas**
   - What we know: Decision says "major US cities with South Asian community presence"
   - What's unclear: Exact list needed
   - Recommendation: Research and provide curated list (Houston, Dallas, Bay Area, Chicago, etc.)

## Sources

### Primary (HIGH confidence)
- [Supabase Storage Standard Uploads](https://supabase.com/docs/guides/storage/uploads/standard-uploads) - Upload API, options
- [Supabase Storage Access Control](https://supabase.com/docs/guides/storage/security/access-control) - RLS policies for storage
- [Supabase Image Transformations](https://supabase.com/docs/guides/storage/serving/image-transformations) - Resize, format, quality options
- [Supabase Arrays Documentation](https://supabase.com/docs/guides/database/arrays) - TEXT[] column patterns
- [Supabase JSON Documentation](https://supabase.com/docs/guides/database/json) - JSONB column patterns
- [React DayPicker Selection Modes](https://daypicker.dev/docs/selection-modes) - Multiple date selection API
- [dnd-kit Official Documentation](https://dndkit.com/) - Sortable implementation

### Secondary (MEDIUM confidence)
- [ClarityDev Multi-Step Forms](https://claritydev.net/blog/build-a-multistep-form-with-react-hook-form) - Wizard pattern with react-hook-form
- [BuildWithMatija Multi-Step Tutorial](https://www.buildwithmatija.com/blog/master-multi-step-forms-build-a-dynamic-react-form-in-6-simple-steps) - Zustand + localStorage persistence
- [KindaCode Image Preview](https://www.kindacode.com/article/react-show-image-preview-before-uploading) - URL.createObjectURL pattern

### Tertiary (LOW confidence)
- WebSearch results for React portfolio gallery libraries - Recommend validation with actual implementation

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All core libraries already in project, well-documented
- Architecture: HIGH - Patterns verified from official docs and established tutorials
- Database schema: HIGH - Based on Supabase PostgreSQL best practices
- Pitfalls: HIGH - Common issues documented across multiple sources
- Image transforms: MEDIUM - Requires Pro plan verification

**Research date:** 2026-02-07
**Valid until:** 2026-03-07 (30 days - stable domain, mature libraries)

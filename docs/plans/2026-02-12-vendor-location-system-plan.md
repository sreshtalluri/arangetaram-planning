# Vendor Location System Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Replace the hardcoded metro-area location system with real addresses, Mapbox geocoding, PostGIS distance queries, and interactive maps.

**Architecture:** New `vendor_locations` table with PostGIS geography column. Mapbox Geocoding API for address autocomplete + coordinate lookup. Mapbox GL JS for map rendering. Supabase RPC function for distance-based vendor search. Frontend components updated to use addresses instead of metro area codes.

**Tech Stack:** Mapbox GL JS, react-map-gl, @mapbox/search-js-react, PostGIS, Supabase RPC

---

## Task 1: Database Migration — vendor_locations table + PostGIS + RPC

**Files:**
- Create: `supabase/migrations/00008_vendor_locations.sql`

**Step 1: Write the migration**

```sql
-- Migration: 00008_vendor_locations
-- Add vendor_locations table with PostGIS support for distance-based queries

-- Enable PostGIS extension
CREATE EXTENSION IF NOT EXISTS postgis;

-- Create vendor_locations table
CREATE TABLE public.vendor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  label TEXT,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  zip_code TEXT NOT NULL,
  formatted_address TEXT NOT NULL,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  location GEOGRAPHY(POINT, 4326) NOT NULL,
  is_primary BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Spatial index for fast distance queries
CREATE INDEX idx_vendor_locations_geo ON public.vendor_locations USING GIST (location);

-- Index for vendor lookups
CREATE INDEX idx_vendor_locations_vendor_id ON public.vendor_locations (vendor_id);

-- Trigger to auto-populate geography column from lat/lng
CREATE OR REPLACE FUNCTION public.set_vendor_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_location_geo
  BEFORE INSERT OR UPDATE ON public.vendor_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vendor_location_geography();

-- Ensure only one primary location per vendor
CREATE OR REPLACE FUNCTION public.ensure_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.vendor_locations
    SET is_primary = false
    WHERE vendor_id = NEW.vendor_id AND id != NEW.id AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ensure_single_primary
  BEFORE INSERT OR UPDATE ON public.vendor_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.ensure_single_primary_location();

-- RLS policies
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- Anyone can read vendor locations (for discovery)
CREATE POLICY "Anyone can view vendor locations"
  ON public.vendor_locations FOR SELECT
  USING (true);

-- Vendors can insert their own locations
CREATE POLICY "Vendors can insert own locations"
  ON public.vendor_locations FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM public.vendor_profiles WHERE id = auth.uid()
    )
  );

-- Vendors can update their own locations
CREATE POLICY "Vendors can update own locations"
  ON public.vendor_locations FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendor_profiles WHERE id = auth.uid()
    )
  );

-- Vendors can delete their own locations
CREATE POLICY "Vendors can delete own locations"
  ON public.vendor_locations FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM public.vendor_profiles WHERE id = auth.uid()
    )
  );

-- RPC function: search vendors within radius, ordered by distance
CREATE OR REPLACE FUNCTION public.search_vendors_by_location(
  search_lat DOUBLE PRECISION,
  search_lng DOUBLE PRECISION,
  radius_miles DOUBLE PRECISION DEFAULT 25,
  category_filter TEXT DEFAULT NULL,
  search_query TEXT DEFAULT NULL,
  price_range_filter TEXT DEFAULT NULL,
  available_date_filter DATE DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  business_name TEXT,
  description TEXT,
  category TEXT,
  service_areas TEXT[],
  price_min NUMERIC,
  price_max NUMERIC,
  profile_photo_url TEXT,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  contact_phone TEXT,
  contact_email TEXT,
  distance_miles DOUBLE PRECISION,
  nearest_city TEXT,
  nearest_state TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT DISTINCT ON (vp.id)
    vp.id,
    vp.business_name,
    vp.description,
    vp.category,
    vp.service_areas,
    vp.price_min,
    vp.price_max,
    vp.profile_photo_url,
    vp.is_published,
    vp.created_at,
    vp.updated_at,
    vp.contact_phone,
    vp.contact_email,
    (ST_Distance(
      vl.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
    ) / 1609.344) AS distance_miles,
    vl.city AS nearest_city,
    vl.state AS nearest_state
  FROM public.vendor_profiles vp
  INNER JOIN public.vendor_locations vl ON vl.vendor_id = vp.id
  WHERE vp.is_published = true
    AND ST_DWithin(
      vl.location,
      ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography,
      radius_miles * 1609.344  -- Convert miles to meters
    )
    AND (category_filter IS NULL OR vp.category = category_filter)
    AND (search_query IS NULL OR (
      vp.business_name ILIKE '%' || search_query || '%'
      OR vp.description ILIKE '%' || search_query || '%'
    ))
    AND (price_range_filter IS NULL OR (
      CASE price_range_filter
        WHEN 'budget' THEN vp.price_min < 500
        WHEN 'mid' THEN vp.price_min >= 500 AND vp.price_min < 2000
        WHEN 'premium' THEN vp.price_min >= 2000
        ELSE true
      END
    ))
    AND (available_date_filter IS NULL OR NOT EXISTS (
      SELECT 1 FROM public.vendor_availability va
      WHERE va.vendor_id = vp.id
        AND va.blocked_date = available_date_filter
    ))
  ORDER BY vp.id, ST_Distance(
    vl.location,
    ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography
  ) ASC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

**Step 2: Run the migration**

Run: `cd /Users/sreshtalluri/Documents/Github/arangetaram-planning && npx supabase db push` (or apply via Supabase dashboard)

**Step 3: Commit**

```bash
git add supabase/migrations/00008_vendor_locations.sql
git commit -m "feat(db): add vendor_locations table with PostGIS and distance search RPC"
```

---

## Task 2: Update TypeScript types for vendor_locations

**Files:**
- Modify: `frontend/src/lib/database.types.ts`

**Step 1: Add vendor_locations type to Database interface**

After the `vendor_profiles` table definition (around line 166), add:

```typescript
vendor_locations: {
  Row: {
    id: string
    vendor_id: string
    label: string | null
    address_line1: string
    address_line2: string | null
    city: string
    state: string
    zip_code: string
    formatted_address: string
    latitude: number
    longitude: number
    is_primary: boolean | null
    created_at: string | null
    updated_at: string | null
  }
  Insert: {
    id?: string
    vendor_id: string
    label?: string | null
    address_line1: string
    address_line2?: string | null
    city: string
    state: string
    zip_code: string
    formatted_address: string
    latitude: number
    longitude: number
    is_primary?: boolean | null
    created_at?: string | null
    updated_at?: string | null
  }
  Update: {
    id?: string
    vendor_id?: string
    label?: string | null
    address_line1?: string
    address_line2?: string | null
    city?: string
    state?: string
    zip_code?: string
    formatted_address?: string
    latitude?: number
    longitude?: number
    is_primary?: boolean | null
    created_at?: string | null
    updated_at?: string | null
  }
  Relationships: [
    {
      foreignKeyName: "vendor_locations_vendor_id_fkey"
      columns: ["vendor_id"]
      referencedRelation: "vendor_profiles"
      referencedColumns: ["id"]
    }
  ]
}
```

**Step 2: Commit**

```bash
git add frontend/src/lib/database.types.ts
git commit -m "feat(types): add vendor_locations table types"
```

---

## Task 3: Install Mapbox dependencies

**Files:**
- Modify: `frontend/package.json`

**Step 1: Install packages**

Run:
```bash
cd /Users/sreshtalluri/Documents/Github/arangetaram-planning/frontend && npm install mapbox-gl react-map-gl @mapbox/search-js-react
```

**Step 2: Add Mapbox CSS import**

Modify: `frontend/src/index.js` — add at the top with other imports:

```javascript
import 'mapbox-gl/dist/mapbox-gl.css'
```

**Step 3: Add Mapbox token to environment**

Modify: `.env.example` — add:
```
REACT_APP_MAPBOX_TOKEN=your_mapbox_public_token_here
```

The vendor should create a Mapbox account and add their public token to `.env`:
```
REACT_APP_MAPBOX_TOKEN=pk.xxxxx
```

**Step 4: Commit**

```bash
git add frontend/package.json frontend/package-lock.json frontend/src/index.js .env.example
git commit -m "feat: install Mapbox GL, react-map-gl, and search-js-react"
```

---

## Task 4: Create useVendorLocations hook

**Files:**
- Create: `frontend/src/hooks/useVendorLocations.ts`

**Step 1: Write the hook**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'
import type { Database } from '../lib/database.types'

type VendorLocation = Database['public']['Tables']['vendor_locations']['Row']
type VendorLocationInsert = Database['public']['Tables']['vendor_locations']['Insert']

export function useVendorLocations(vendorId: string | undefined) {
  const queryClient = useQueryClient()

  const locations = useQuery({
    queryKey: ['vendor-locations', vendorId],
    queryFn: async () => {
      if (!vendorId) return []
      const { data, error } = await supabase
        .from('vendor_locations')
        .select('*')
        .eq('vendor_id', vendorId)
        .order('is_primary', { ascending: false })
      if (error) throw error
      return data as VendorLocation[]
    },
    enabled: !!vendorId,
  })

  const addLocation = useMutation({
    mutationFn: async (location: VendorLocationInsert) => {
      const { data, error } = await supabase
        .from('vendor_locations')
        .insert(location)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  const removeLocation = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('vendor_locations')
        .delete()
        .eq('id', locationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  const setPrimary = useMutation({
    mutationFn: async (locationId: string) => {
      const { error } = await supabase
        .from('vendor_locations')
        .update({ is_primary: true })
        .eq('id', locationId)
      if (error) throw error
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vendor-locations', vendorId] })
    },
  })

  return {
    locations: locations.data || [],
    isLoading: locations.isLoading,
    addLocation,
    removeLocation,
    setPrimary,
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useVendorLocations.ts
git commit -m "feat: add useVendorLocations hook for CRUD operations"
```

---

## Task 5: Update useVendors hook for distance-based search

**Files:**
- Modify: `frontend/src/hooks/useVendors.ts`

**Step 1: Update the filter params interface**

Replace the current `UseVendorsParams` interface (lines 28-34) with:

```typescript
interface UseVendorsParams {
  category?: string
  search?: string
  price_range?: string
  location?: string        // DEPRECATED: metro area code, kept for fallback
  availableDate?: string
  // New location-based params
  searchLat?: number
  searchLng?: number
  radiusMiles?: number     // default 25
}
```

**Step 2: Update the query function**

Replace the vendor fetch logic. When `searchLat`/`searchLng` are provided, use the RPC function. Otherwise, fall back to the existing query (for when no location filter is active):

Inside the `queryFn`, replace the location filter block (lines 72-75):

```typescript
// If coordinate-based search, use RPC function
if (params.searchLat && params.searchLng) {
  const { data, error } = await supabase.rpc('search_vendors_by_location', {
    search_lat: params.searchLat,
    search_lng: params.searchLng,
    radius_miles: params.radiusMiles || 25,
    category_filter: params.category || null,
    search_query: params.search || null,
    price_range_filter: params.price_range || null,
    available_date_filter: params.availableDate || null,
  })
  if (error) throw error
  return (data || []).map((vendor: any) => ({
    ...vendor,
    price_range: vendor.price_min && vendor.price_max
      ? `$${vendor.price_min} - $${vendor.price_max}`
      : vendor.price_min
      ? `From $${vendor.price_min}`
      : 'Contact for pricing',
    price_estimate: vendor.price_min
      ? `$${vendor.price_min}`
      : 'Contact for pricing',
    location: vendor.nearest_city && vendor.nearest_state
      ? `${vendor.nearest_city}, ${vendor.nearest_state}`
      : 'Location not set',
    distance_miles: vendor.distance_miles
      ? Math.round(vendor.distance_miles * 10) / 10
      : null,
    rating: 4.5 + Math.random() * 0.5,
    review_count: Math.floor(Math.random() * 50) + 5,
    portfolio_images: [],
    services: [],
  }))
}
```

Keep the existing non-location query as the else branch. Update the location display mapping (line 88) in the existing branch:

```typescript
location: vendor.service_areas?.[0] || 'Location not set',
```

**Step 3: Update the query key to include new params**

```typescript
queryKey: ['vendors', params.category, params.search, params.price_range,
  params.searchLat, params.searchLng, params.radiusMiles, params.availableDate],
```

**Step 4: Commit**

```bash
git add frontend/src/hooks/useVendors.ts
git commit -m "feat: add distance-based vendor search via PostGIS RPC"
```

---

## Task 6: Update useDiscoveryFilters for location coordinates

**Files:**
- Modify: `frontend/src/hooks/useDiscoveryFilters.ts`

**Step 1: Add lat/lng/radius to Filters interface and state**

```typescript
import { useSearchParams } from 'react-router-dom'
import { useMemo, useCallback } from 'react'

export interface Filters {
  category: string
  location: string        // display text (city name or zip)
  locationLat: string     // latitude as string in URL params
  locationLng: string     // longitude as string in URL params
  radius: string          // radius in miles as string
  priceRange: string
  availableDate: string
  search: string
}

export function useDiscoveryFilters() {
  const [searchParams, setSearchParams] = useSearchParams()

  const filters = useMemo<Filters>(() => ({
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    locationLat: searchParams.get('lat') || '',
    locationLng: searchParams.get('lng') || '',
    radius: searchParams.get('radius') || '25',
    priceRange: searchParams.get('price') || '',
    availableDate: searchParams.get('date') || '',
    search: searchParams.get('q') || '',
  }), [searchParams])

  const setFilter = useCallback((key: keyof Filters, value: string) => {
    const newParams = new URLSearchParams(searchParams)
    const paramKey = key === 'search' ? 'q' :
                     key === 'priceRange' ? 'price' :
                     key === 'availableDate' ? 'date' :
                     key === 'locationLat' ? 'lat' :
                     key === 'locationLng' ? 'lng' : key
    if (value) {
      newParams.set(paramKey, value)
    } else {
      newParams.delete(paramKey)
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const setLocationFilter = useCallback((
    displayName: string,
    lat: number,
    lng: number
  ) => {
    const newParams = new URLSearchParams(searchParams)
    newParams.set('location', displayName)
    newParams.set('lat', lat.toString())
    newParams.set('lng', lng.toString())
    if (!newParams.has('radius')) {
      newParams.set('radius', '25')
    }
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearLocationFilter = useCallback(() => {
    const newParams = new URLSearchParams(searchParams)
    newParams.delete('location')
    newParams.delete('lat')
    newParams.delete('lng')
    newParams.delete('radius')
    setSearchParams(newParams)
  }, [searchParams, setSearchParams])

  const clearFilters = useCallback(() => {
    setSearchParams({})
  }, [setSearchParams])

  const hasActiveFilters = Object.values(filters).some((v, i) =>
    // radius has a default of '25', so don't count it as active by itself
    v !== '' && v !== '25'
  )

  return {
    filters,
    setFilter,
    setLocationFilter,
    clearLocationFilter,
    clearFilters,
    hasActiveFilters,
  }
}
```

**Step 2: Commit**

```bash
git add frontend/src/hooks/useDiscoveryFilters.ts
git commit -m "feat: add lat/lng/radius to discovery filter state"
```

---

## Task 7: Update FilterSidebar with Mapbox address search + radius slider

**Files:**
- Modify: `frontend/src/components/discovery/FilterSidebar.jsx`

**Step 1: Replace the location filter section**

Replace the imports at the top — remove `METRO_AREAS` import, add Mapbox:

```javascript
// Remove this line:
// import { METRO_AREAS } from '../../lib/metro-areas'

// Add these:
import { AddressAutofill } from '@mapbox/search-js-react'
import { Slider } from '../ui/slider'
```

Update the component props to receive new location handlers:

```javascript
export function FilterSidebar({ filters, setFilter, setLocationFilter, clearLocationFilter, clearFilters, hasActiveFilters }) {
```

Replace the Location FilterSection (lines 74-92) with:

```jsx
{/* Location Filter */}
<FilterSection title="Location">
  <div className="space-y-3">
    {filters.locationLat ? (
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#1A1A1A] truncate flex-1">
          {filters.location}
        </span>
        <Button
          variant="ghost"
          size="sm"
          onClick={clearLocationFilter}
          className="h-6 w-6 p-0"
        >
          <X className="w-3 h-3" />
        </Button>
      </div>
    ) : (
      <AddressAutofill
        accessToken={process.env.REACT_APP_MAPBOX_TOKEN}
        onRetrieve={(res) => {
          const feature = res.features[0]
          if (feature) {
            const [lng, lat] = feature.geometry.coordinates
            const city = feature.properties.place_name || feature.properties.address_line1
            setLocationFilter(city, lat, lng)
          }
        }}
      >
        <input
          type="text"
          placeholder="Search city or zip code..."
          autoComplete="street-address"
          className="w-full input-styled px-3 py-2 text-sm rounded-md border"
        />
      </AddressAutofill>
    )}
    {filters.locationLat && (
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-[#888888]">
          <span>Radius</span>
          <span>{filters.radius} miles</span>
        </div>
        <Slider
          value={[parseInt(filters.radius) || 25]}
          onValueChange={([value]) => setFilter('radius', value.toString())}
          min={5}
          max={100}
          step={5}
          className="w-full"
        />
      </div>
    )}
  </div>
</FilterSection>
```

**Step 2: Commit**

```bash
git add frontend/src/components/discovery/FilterSidebar.jsx
git commit -m "feat: replace metro dropdown with Mapbox address search and radius slider"
```

---

## Task 8: Wire up VendorsPage to pass new location params

**Files:**
- Modify: `frontend/src/pages/VendorsPage.jsx`

**Step 1: Update vendorParams mapping**

In VendorsPage.jsx, update the filter mapping (lines 32-40) to include the new coordinate params:

```javascript
const vendorParams = {
  category: filters.category || undefined,
  search: filters.search || undefined,
  price_range: filters.priceRange || undefined,
  availableDate: filters.availableDate || undefined,
  // New location-based params
  searchLat: filters.locationLat ? parseFloat(filters.locationLat) : undefined,
  searchLng: filters.locationLng ? parseFloat(filters.locationLng) : undefined,
  radiusMiles: filters.radius ? parseInt(filters.radius) : 25,
};
```

Remove `location: filters.location || undefined` from the params.

**Step 2: Update FilterSidebar props**

Update the props passed to FilterSidebar (lines 80-86):

```jsx
<FilterSidebar
  filters={filters}
  setFilter={setFilter}
  setLocationFilter={setLocationFilter}
  clearLocationFilter={clearLocationFilter}
  clearFilters={clearFilters}
  hasActiveFilters={hasActiveFilters}
/>
```

And destructure the new functions from the hook:

```javascript
const { filters, setFilter, setLocationFilter, clearLocationFilter, clearFilters, hasActiveFilters } = useDiscoveryFilters();
```

**Step 3: Commit**

```bash
git add frontend/src/pages/VendorsPage.jsx
git commit -m "feat: wire distance-based search params to VendorsPage"
```

---

## Task 9: Update VendorCard to show city/state and distance

**Files:**
- Modify: `frontend/src/components/VendorCard.jsx`

**Step 1: Update location display**

Replace the location display section (lines 57-60) with:

```jsx
<div className="flex items-center gap-1 text-[#888888] text-sm mb-2">
  <MapPin className="w-3 h-3" />
  <span>{vendor.location || 'Location not set'}</span>
  {vendor.distance_miles != null && (
    <span className="ml-1 text-xs bg-[#0F4C5C]/10 text-[#0F4C5C] px-1.5 py-0.5 rounded-full">
      {vendor.distance_miles} mi
    </span>
  )}
</div>
```

**Step 2: Commit**

```bash
git add frontend/src/components/VendorCard.jsx
git commit -m "feat: show city/state and distance badge on VendorCard"
```

---

## Task 10: Update ProfileWizard StepServices — replace metro checkboxes with address entry

**Files:**
- Modify: `frontend/src/components/vendor/ProfileWizard/StepServices.tsx`
- Modify: `frontend/src/components/vendor/ProfileWizard/index.tsx`

**Step 1: Update ProfileFormData interface in index.tsx**

Replace the `service_areas` field in `ProfileFormData` (line 20 in index.tsx):

```typescript
interface ProfileFormData {
  business_name: string
  description: string
  category: string
  locations: Array<{
    label: string
    address_line1: string
    city: string
    state: string
    zip_code: string
    formatted_address: string
    latitude: number
    longitude: number
  }>
  price_min: number | null
  price_max: number | null
  profile_photo_url?: string | null
}
```

Update default values (line 59):

```typescript
locations: [],
```

Update the submit handler to save locations to `vendor_locations` table instead of `service_areas` on `vendor_profiles`. After the vendor profile upsert, add:

```typescript
// Save locations
if (data.locations.length > 0) {
  const locationInserts = data.locations.map((loc, idx) => ({
    vendor_id: user.id,
    label: loc.label || `Location ${idx + 1}`,
    address_line1: loc.address_line1,
    city: loc.city,
    state: loc.state,
    zip_code: loc.zip_code,
    formatted_address: loc.formatted_address,
    latitude: loc.latitude,
    longitude: loc.longitude,
    is_primary: idx === 0,
  }))

  const { error: locError } = await supabase
    .from('vendor_locations')
    .upsert(locationInserts, { onConflict: 'id' })

  if (locError) throw locError
}
```

**Step 2: Rewrite StepServices.tsx location section**

Replace the metro area checkbox grid (lines 25-52 in StepServices.tsx) with Mapbox address entry:

```tsx
import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { AddressAutofill } from '@mapbox/search-js-react'
import { Label } from '../../ui/label'
import { Input } from '../../ui/input'
import { Button } from '../../ui/button'
import { Card } from '../../ui/card'
import { MapPin, Plus, Trash2 } from 'lucide-react'

export function StepServices() {
  const { control, setValue, watch } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'locations',
  })

  return (
    <div className="space-y-6">
      {/* Locations */}
      <div className="space-y-3">
        <Label>Business Locations</Label>
        <p className="text-sm text-gray-500">
          Add the addresses where you provide services
        </p>

        {fields.map((field, index) => (
          <Card key={field.id} className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-4 h-4 text-[#0F4C5C]" />
                <span className="text-sm font-medium">
                  {watch(`locations.${index}.formatted_address`) || `Location ${index + 1}`}
                </span>
                {index === 0 && (
                  <span className="text-xs bg-[#C5A059]/20 text-[#C5A059] px-2 py-0.5 rounded-full">
                    Primary
                  </span>
                )}
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => remove(index)}
                className="h-8 w-8 p-0 text-red-500"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            <Input
              placeholder="Label (e.g. Main Studio)"
              {...control.register(`locations.${index}.label`)}
              className="input-styled"
            />
          </Card>
        ))}

        <AddressAutofill
          accessToken={process.env.REACT_APP_MAPBOX_TOKEN}
          onRetrieve={(res) => {
            const feature = res.features[0]
            if (feature) {
              const [lng, lat] = feature.geometry.coordinates
              const props = feature.properties
              append({
                label: '',
                address_line1: props.address_line1 || '',
                city: props.place || props.locality || '',
                state: props.region || '',
                zip_code: props.postcode || '',
                formatted_address: props.full_address || props.place_name || '',
                latitude: lat,
                longitude: lng,
              })
            }
          }}
        >
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search for an address to add..."
              autoComplete="street-address"
              className="flex-1 input-styled px-3 py-2 text-sm rounded-md border"
            />
          </div>
        </AddressAutofill>

        {fields.length === 0 && (
          <p className="text-sm text-red-500">
            Add at least one location to continue
          </p>
        )}
      </div>

      {/* Pricing section stays the same — keep existing price_min/price_max fields */}
    </div>
  )
}
```

**Step 3: Commit**

```bash
git add frontend/src/components/vendor/ProfileWizard/StepServices.tsx frontend/src/components/vendor/ProfileWizard/index.tsx
git commit -m "feat: replace metro area selection with Mapbox address entry in ProfileWizard"
```

---

## Task 11: Create VendorMap component

**Files:**
- Create: `frontend/src/components/vendor/VendorMap.tsx`

**Step 1: Write the map component**

```tsx
import { useMemo } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import { MapPin } from 'lucide-react'
import { useState } from 'react'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

interface VendorLocation {
  id: string
  label: string | null
  city: string
  state: string
  latitude: number
  longitude: number
  is_primary: boolean | null
}

interface VendorMapProps {
  locations: VendorLocation[]
  className?: string
}

export function VendorMap({ locations, className = '' }: VendorMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const bounds = useMemo(() => {
    if (locations.length === 0) return null
    if (locations.length === 1) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        zoom: 12,
      }
    }
    // Fit all points
    const lats = locations.map(l => l.latitude)
    const lngs = locations.map(l => l.longitude)
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      zoom: 10,
    }
  }, [locations])

  if (!bounds || !MAPBOX_TOKEN) return null

  const selected = locations.find(l => l.id === selectedId)

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <Map
        initialViewState={bounds}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            latitude={loc.latitude}
            longitude={loc.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedId(loc.id)
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
                loc.is_primary
                  ? 'bg-[#800020] border-[#C5A059]'
                  : 'bg-[#0F4C5C] border-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            onClose={() => setSelectedId(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="p-1">
              <p className="font-medium text-sm">{selected.label || 'Location'}</p>
              <p className="text-xs text-gray-500">{selected.city}, {selected.state}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}
```

**Step 2: Commit**

```bash
git add frontend/src/components/vendor/VendorMap.tsx
git commit -m "feat: add VendorMap component with Mapbox GL pins and popups"
```

---

## Task 12: Add map to VendorDetailPage

**Files:**
- Modify: `frontend/src/pages/VendorDetailPage.jsx`

**Step 1: Import the hook and map component**

Add imports:

```javascript
import { useVendorLocations } from '../hooks/useVendorLocations'
import { VendorMap } from '../components/vendor/VendorMap'
```

**Step 2: Fetch locations in the component**

After the existing vendor fetch, add:

```javascript
const { locations } = useVendorLocations(vendor?.id)
```

**Step 3: Replace the Service Areas section (lines 149-161) with map + locations**

```jsx
{/* Locations & Map */}
{locations.length > 0 && (
  <div className="bg-white rounded-xl p-6 shadow-sm space-y-4">
    <h2 className="text-xl font-semibold text-[#1A1A1A]">Locations</h2>
    <div className="flex flex-wrap gap-2">
      {locations.map((loc) => (
        <div key={loc.id} className="flex items-center gap-1.5 text-sm text-[#4A4A4A]">
          <MapPin className="w-3 h-3 text-[#0F4C5C]" />
          <span>{loc.label ? `${loc.label} — ` : ''}{loc.city}, {loc.state}</span>
          {loc.is_primary && (
            <span className="text-xs bg-[#C5A059]/20 text-[#C5A059] px-1.5 py-0.5 rounded-full">
              Primary
            </span>
          )}
        </div>
      ))}
    </div>
    <VendorMap locations={locations} className="h-64" />
  </div>
)}
```

**Step 4: Update the Quick Facts location display (lines 247-255)**

```jsx
<div className="flex items-center gap-3">
  <div className="w-10 h-10 rounded-lg bg-[#F9F8F4] flex items-center justify-center">
    <MapPin className="w-5 h-5 text-[#0F4C5C]" />
  </div>
  <div>
    <p className="text-sm text-[#888888]">Location</p>
    <p className="font-medium text-[#1A1A1A]">
      {locations.length > 0
        ? `${locations.find(l => l.is_primary)?.city || locations[0].city}, ${locations.find(l => l.is_primary)?.state || locations[0].state}`
        : vendor.location || 'Not set'}
    </p>
  </div>
</div>
```

**Step 5: Commit**

```bash
git add frontend/src/pages/VendorDetailPage.jsx
git commit -m "feat: add location list and map to VendorDetailPage"
```

---

## Task 13: Add map toggle to VendorsPage (discovery browse)

**Files:**
- Modify: `frontend/src/pages/VendorsPage.jsx`
- Create: `frontend/src/components/discovery/VendorMapView.tsx`

**Step 1: Create VendorMapView component**

```tsx
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl'
import { MapPin } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

interface VendorPin {
  id: string
  business_name: string
  category: string
  price_range: string
  location: string
  latitude?: number
  longitude?: number
}

interface VendorMapViewProps {
  vendors: VendorPin[]
  centerLat?: number
  centerLng?: number
}

export function VendorMapView({ vendors, centerLat, centerLng }: VendorMapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  const mappableVendors = vendors.filter(v => v.latitude && v.longitude)
  const selected = mappableVendors.find(v => v.id === selectedId)

  if (!MAPBOX_TOKEN || mappableVendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F9F8F4] rounded-xl">
        <p className="text-[#888888] text-sm">No vendors with locations to display</p>
      </div>
    )
  }

  return (
    <Map
      initialViewState={{
        latitude: centerLat || mappableVendors[0].latitude!,
        longitude: centerLng || mappableVendors[0].longitude!,
        zoom: 10,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      <NavigationControl position="top-right" />
      {mappableVendors.map((vendor) => (
        <Marker
          key={vendor.id}
          latitude={vendor.latitude!}
          longitude={vendor.longitude!}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedId(vendor.id)
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#800020] border-2 border-[#C5A059] flex items-center justify-center cursor-pointer">
            <MapPin className="w-4 h-4 text-white" />
          </div>
        </Marker>
      ))}
      {selected && (
        <Popup
          latitude={selected.latitude!}
          longitude={selected.longitude!}
          onClose={() => setSelectedId(null)}
          closeButton
          closeOnClick={false}
        >
          <div
            className="p-2 cursor-pointer"
            onClick={() => navigate(`/vendors/${selected.id}`)}
          >
            <p className="font-medium text-sm">{selected.business_name}</p>
            <p className="text-xs text-gray-500">{selected.category}</p>
            <p className="text-xs text-[#0F4C5C]">{selected.price_range}</p>
          </div>
        </Popup>
      )}
    </Map>
  )
}
```

**Step 2: Add map toggle to VendorsPage**

Add a map view state and toggle button. Import the new component:

```javascript
import { VendorMapView } from '../components/discovery/VendorMapView'
import { Map as MapIcon, Grid } from 'lucide-react'
```

Add state:

```javascript
const [showMap, setShowMap] = useState(false)
```

Add toggle button near the existing toolbar/header area:

```jsx
<Button
  variant="outline"
  size="sm"
  onClick={() => setShowMap(!showMap)}
  className="flex items-center gap-2"
>
  {showMap ? <Grid className="w-4 h-4" /> : <MapIcon className="w-4 h-4" />}
  {showMap ? 'Grid View' : 'Map View'}
</Button>
```

Wrap the main content area to conditionally show split layout:

```jsx
{showMap ? (
  <div className="flex gap-4 h-[calc(100vh-200px)]">
    <div className="w-2/5 overflow-y-auto">
      <VendorGrid vendors={vendors} loading={vendorsLoading} />
    </div>
    <div className="w-3/5 rounded-xl overflow-hidden">
      <VendorMapView
        vendors={vendors}
        centerLat={filters.locationLat ? parseFloat(filters.locationLat) : undefined}
        centerLng={filters.locationLng ? parseFloat(filters.locationLng) : undefined}
      />
    </div>
  </div>
) : (
  <VendorGrid vendors={vendors} loading={vendorsLoading} />
)}
```

**Step 3: Commit**

```bash
git add frontend/src/components/discovery/VendorMapView.tsx frontend/src/pages/VendorsPage.jsx
git commit -m "feat: add toggleable map view to vendor browse page"
```

---

## Task 14: Update AI recommendations to use distance-based filtering

**Files:**
- Modify: `supabase/functions/ai-recommendations/index.ts`

**Step 1: Replace service_areas filter with RPC call**

Replace the location filter block (lines 121-124) with:

```typescript
// Filter by location using PostGIS distance if coordinates available
if (eventData.location) {
  // Try to geocode the event location using Mapbox
  const geocodeRes = await fetch(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(eventData.location)}.json?access_token=${Deno.env.get('MAPBOX_TOKEN')}&limit=1`
  )
  const geocodeData = await geocodeRes.json()

  if (geocodeData.features?.length > 0) {
    const [lng, lat] = geocodeData.features[0].center
    // Use RPC for distance-based search
    const { data: nearbyVendors, error: rpcError } = await supabaseClient
      .rpc('search_vendors_by_location', {
        search_lat: lat,
        search_lng: lng,
        radius_miles: 50,
        category_filter: null,
      })

    if (!rpcError && nearbyVendors) {
      // Use nearby vendors instead of service_areas filter
      const nearbyIds = nearbyVendors.map((v: any) => v.id)
      if (nearbyIds.length > 0) {
        query = query.in('id', nearbyIds)
      }
    }
  }
}
```

Update the candidate summary to include distance instead of service_areas:

```typescript
candidateSummary[category] = vendors.map(v => ({
  id: v.id,
  business_name: v.business_name,
  description: v.description || '',
  location: v.nearest_city ? `${v.nearest_city}, ${v.nearest_state}` : 'Unknown',
  distance_miles: v.distance_miles || null,
  price_range: v.price_min && v.price_max
    ? `$${v.price_min} - $${v.price_max}`
    : v.price_min
    ? `Starting at $${v.price_min}`
    : 'Contact for pricing',
}));
```

**Step 2: Add MAPBOX_TOKEN to edge function secrets**

Run: `npx supabase secrets set MAPBOX_TOKEN=pk.xxxxx`

**Step 3: Commit**

```bash
git add supabase/functions/ai-recommendations/index.ts
git commit -m "feat: update AI recommendations to use distance-based vendor filtering"
```

---

## Task 15: Add vendor dashboard banner for location migration

**Files:**
- Modify: `frontend/src/pages/VendorDashboard.jsx`

**Step 1: Add migration banner**

Import the hook:

```javascript
import { useVendorLocations } from '../hooks/useVendorLocations'
```

Inside the component, after the auth check:

```javascript
const { locations } = useVendorLocations(user?.id)
```

Add at the top of the dashboard content:

```jsx
{locations.length === 0 && (
  <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-4 flex items-center justify-between">
    <div>
      <p className="font-medium text-[#1A1A1A]">Add your business address</p>
      <p className="text-sm text-[#888888]">
        Update your profile with a physical address so clients can find you by location.
      </p>
    </div>
    <Button
      onClick={() => navigate('/vendor/profile/create')}
      className="bg-[#800020] text-white hover:bg-[#600018]"
    >
      Update Profile
    </Button>
  </div>
)}
```

**Step 2: Commit**

```bash
git add frontend/src/pages/VendorDashboard.jsx
git commit -m "feat: add location migration banner to vendor dashboard"
```

---

## Summary

| Task | What | Key Files |
|------|------|-----------|
| 1 | Database migration + PostGIS + RPC | `00008_vendor_locations.sql` |
| 2 | TypeScript types | `database.types.ts` |
| 3 | Install Mapbox deps | `package.json`, `index.js` |
| 4 | useVendorLocations hook | `useVendorLocations.ts` |
| 5 | Update useVendors for distance search | `useVendors.ts` |
| 6 | Update discovery filters | `useDiscoveryFilters.ts` |
| 7 | FilterSidebar address + radius | `FilterSidebar.jsx` |
| 8 | Wire VendorsPage | `VendorsPage.jsx` |
| 9 | VendorCard distance badge | `VendorCard.jsx` |
| 10 | ProfileWizard address entry | `StepServices.tsx`, `index.tsx` |
| 11 | VendorMap component | `VendorMap.tsx` |
| 12 | VendorDetailPage map | `VendorDetailPage.jsx` |
| 13 | Browse page map toggle | `VendorMapView.tsx`, `VendorsPage.jsx` |
| 14 | AI recommendations update | `ai-recommendations/index.ts` |
| 15 | Vendor dashboard banner | `VendorDashboard.jsx` |

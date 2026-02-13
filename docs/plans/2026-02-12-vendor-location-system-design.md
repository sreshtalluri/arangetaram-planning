# Vendor Location System Design

**Date:** 2026-02-12
**Approach:** Full Address Replacement (replaces metro-area system)
**Maps/Geocoding:** Mapbox (Mapbox GL JS + Geocoding API)

## Overview

Replace the hardcoded metro-area system with real addresses, geocoded coordinates, and distance-based filtering. Vendors enter full addresses via Mapbox autocomplete. Users search by zip/city with a radius slider. Results display on an interactive map.

## Database Schema

### New table: `vendor_locations`

```sql
CREATE TABLE vendor_locations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES vendor_profiles(id) ON DELETE CASCADE,
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
```

- Separate table since vendors can have multiple locations
- PostGIS `GEOGRAPHY(POINT, 4326)` for accurate spherical distance queries
- `is_primary` flag for the main displayed location
- `formatted_address` stores Mapbox-returned string for consistent display
- Spatial GIST index on `location` for fast queries
- Old `service_areas` column deprecated (kept temporarily, unused in app)

### RLS policies

Same pattern as existing tables: vendors CRUD their own locations, authenticated users read all.

### RPC function for distance queries

```sql
SELECT DISTINCT ON (vp.id) vp.*,
  ST_Distance(vl.location, ST_MakePoint($lng, $lat)::geography) AS distance_meters
FROM vendor_profiles vp
JOIN vendor_locations vl ON vl.vendor_id = vp.id
WHERE ST_DWithin(vl.location, ST_MakePoint($lng, $lat)::geography, $radius_meters)
ORDER BY vp.id, distance_meters ASC;
```

- `DISTINCT ON` ensures vendors with multiple locations in range appear once (closest location used)
- Called via Supabase RPC

## Filtering & Distance Queries

### User-facing filter (replaces metro dropdown)

- Text input with Mapbox address autocomplete (zip code, city, or address)
- Radius slider: 10 / 25 / 50 / 100 miles (default 25)
- Results filtered to vendors with at least one location within radius
- Sorted by distance (closest first) with distance shown on cards
- Lat/long extracted from Mapbox autocomplete response (no extra API call)
- Stored in React state, passed as query params to vendor fetch
- No location filter = unfiltered results, no distance sorting

## Vendor Profile Flow

### ProfileWizard Step 3 changes

- Remove multi-select metro area checkboxes
- Replace with Mapbox Address Autocomplete input
- On selection: address fields auto-populate (city, state, zip, lat/long)
- Optional label field (e.g. "Main Studio")
- "Add another location" button for multiple locations
- Each location shows as a card with address + small map preview + remove button
- First location = `is_primary`
- At least one location required to proceed

### Existing vendor migration

- Dashboard banner: "Update your profile with your address to appear in search results"
- No automatic geocoding of metro areas
- Vendors without locations still appear in unfiltered results

## Map Display

### Vendor Detail Page (always visible)

- Mapbox GL map below vendor info, showing pin(s) for all locations
- Primary location pin highlighted
- Click pin for popup with label and address
- Map auto-fits all pins
- Pin placed at zip centroid / slightly randomized for privacy (full address via inquiry only)

### Browse/Discovery Page (toggleable)

- "Map View" toggle button near filter controls
- Split layout: vendor list (~40%) + map (~60%)
- Pins for all vendors in current filtered results
- Click pin: highlights vendor card, shows mini popup (name, category, price range)
- Click popup: opens vendor detail page
- Map bounds update on pan/zoom
- Toggle off: full-width grid (current behavior)

### Map styling

- Custom Mapbox style: warm parchment base, teal water, gold accents
- Pin color: Deep Crimson (#800020) with gold outline

## VendorCard & Display

- Primary location city + state replaces metro area code (e.g. "Houston, TX")
- Distance badge when filtering active: "3.2 mi"
- No distance filter: just city/state
- No locations set: "Location not set" in muted text

### VendorDetailPage

- Location section lists all locations with labels
- City + state public; full address hidden behind inquiry
- Map renders below location list

## AI Recommendations

- Replace `service_areas.contains()` with PostGIS distance query (50 mile default radius)
- Geocode event location, filter vendors within radius via same RPC function
- AI context: `location: "Houston, TX"` with distance info per vendor
- No other AI/prompt changes needed

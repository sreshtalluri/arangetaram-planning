-- Migration: 00008_vendor_locations
-- Create vendor_locations table with PostGIS spatial support,
-- geography triggers, RLS policies, and search RPC function.
-- Part of Vendor Location System: replaces service_areas TEXT[] with geo-based discovery.

-- =============================================================================
-- EXTENSION: PostGIS
-- Required for spatial data types (GEOGRAPHY) and functions (ST_DWithin, etc.)
-- =============================================================================

CREATE EXTENSION IF NOT EXISTS postgis;

-- =============================================================================
-- TABLE: vendor_locations
-- Physical service locations for vendors, with spatial geography column
-- =============================================================================

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

-- Enable Row Level Security
ALTER TABLE public.vendor_locations ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- INDEXES
-- =============================================================================

-- Spatial index for geography queries (ST_DWithin, distance calculations)
CREATE INDEX idx_vendor_locations_location_gist
  ON public.vendor_locations USING GIST (location);

-- B-tree index for vendor_id lookups
CREATE INDEX idx_vendor_locations_vendor_id
  ON public.vendor_locations (vendor_id);

-- =============================================================================
-- TRIGGER FUNCTION: Auto-populate geography column from lat/lng
-- Fires on INSERT and UPDATE so callers only need to provide lat/lng
-- =============================================================================

CREATE OR REPLACE FUNCTION public.set_vendor_location_geography()
RETURNS TRIGGER AS $$
BEGIN
  NEW.location = ST_SetSRID(ST_MakePoint(NEW.longitude, NEW.latitude), 4326)::geography;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_set_vendor_location_geography
  BEFORE INSERT OR UPDATE ON public.vendor_locations
  FOR EACH ROW
  EXECUTE FUNCTION public.set_vendor_location_geography();

-- =============================================================================
-- TRIGGER FUNCTION: Ensure only one primary location per vendor
-- When is_primary is set to true, all other locations for that vendor
-- are set to false.
-- =============================================================================

CREATE OR REPLACE FUNCTION public.enforce_single_primary_location()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.is_primary = true THEN
    UPDATE public.vendor_locations
    SET is_primary = false
    WHERE vendor_id = NEW.vendor_id
      AND id != NEW.id
      AND is_primary = true;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_enforce_single_primary_location
  AFTER INSERT OR UPDATE OF is_primary ON public.vendor_locations
  FOR EACH ROW
  WHEN (NEW.is_primary = true)
  EXECUTE FUNCTION public.enforce_single_primary_location();

-- =============================================================================
-- TRIGGER: updated_at
-- Uses existing handle_updated_at function from 00001_profiles.sql
-- =============================================================================

CREATE TRIGGER set_vendor_locations_updated_at
  BEFORE UPDATE ON public.vendor_locations
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- RLS POLICIES: vendor_locations
-- =============================================================================

-- Anyone can view vendor locations (for marketplace discovery)
CREATE POLICY "Public can view vendor locations"
  ON public.vendor_locations FOR SELECT
  USING (true);

-- Vendors can insert locations for their own profile
CREATE POLICY "Vendors can insert own locations"
  ON public.vendor_locations FOR INSERT
  WITH CHECK (
    vendor_id = (SELECT auth.uid())
  );

-- Vendors can update their own locations
CREATE POLICY "Vendors can update own locations"
  ON public.vendor_locations FOR UPDATE
  USING (
    vendor_id = (SELECT auth.uid())
  );

-- Vendors can delete their own locations
CREATE POLICY "Vendors can delete own locations"
  ON public.vendor_locations FOR DELETE
  USING (
    vendor_id = (SELECT auth.uid())
  );

-- =============================================================================
-- RPC FUNCTION: search_vendors_by_location
-- Spatial search for vendors near a given lat/lng with optional filters.
-- Returns vendor profile fields + distance + nearest location city/state.
-- Uses DISTINCT ON to deduplicate vendors with multiple locations (closest kept).
-- SECURITY DEFINER so it can bypass RLS internally for the join.
-- =============================================================================

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
  price_min INTEGER,
  price_max INTEGER,
  profile_photo_url TEXT,
  is_published BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ,
  distance_miles DOUBLE PRECISION,
  nearest_city TEXT,
  nearest_state TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  search_point GEOGRAPHY;
  radius_meters DOUBLE PRECISION;
BEGIN
  -- Build the search point and convert miles to meters
  search_point := ST_SetSRID(ST_MakePoint(search_lng, search_lat), 4326)::geography;
  radius_meters := radius_miles * 1609.344;

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
    (ST_Distance(vl.location, search_point) / 1609.344) AS distance_miles,
    vl.city AS nearest_city,
    vl.state AS nearest_state
  FROM public.vendor_profiles vp
  INNER JOIN public.vendor_locations vl ON vl.vendor_id = vp.id
  WHERE
    -- Only published vendors
    vp.is_published = true
    -- Spatial filter: within radius
    AND ST_DWithin(vl.location, search_point, radius_meters)
    -- Optional: category filter
    AND (category_filter IS NULL OR vp.category = category_filter)
    -- Optional: text search on business name or description
    AND (
      search_query IS NULL
      OR vp.business_name ILIKE '%' || search_query || '%'
      OR vp.description ILIKE '%' || search_query || '%'
    )
    -- Optional: price range filter (e.g. '1000-5000')
    AND (
      price_range_filter IS NULL
      OR (
        vp.price_min <= split_part(price_range_filter, '-', 2)::INTEGER
        AND vp.price_max >= split_part(price_range_filter, '-', 1)::INTEGER
      )
    )
    -- Optional: date availability filter (exclude vendors blocked on that date)
    AND (
      available_date_filter IS NULL
      OR NOT EXISTS (
        SELECT 1
        FROM public.vendor_availability va
        WHERE va.vendor_id = vp.id
          AND va.blocked_date = available_date_filter
      )
    )
  ORDER BY vp.id, ST_Distance(vl.location, search_point) ASC;
END;
$$;

-- Migration: 00002_vendor_tables
-- Create vendor platform tables: vendor_profiles, portfolio_images, vendor_availability
-- Part of Phase 2: Vendor Supply Platform

-- =============================================================================
-- TABLE: vendor_profiles
-- Extended profile for vendor-specific data, linked 1:1 with profiles table
-- =============================================================================

CREATE TABLE public.vendor_profiles (
  id UUID PRIMARY KEY REFERENCES public.profiles(id) ON DELETE CASCADE,
  business_name TEXT NOT NULL,
  description TEXT,
  category TEXT NOT NULL CHECK (category IN (
    'venue',
    'catering',
    'photography',
    'videography',
    'stage_decoration',
    'musicians',
    'nattuvanar',
    'makeup_artist',
    'invitations',
    'costumes',
    'return_gifts'
  )),
  service_areas TEXT[] DEFAULT '{}',
  price_min INTEGER,
  price_max INTEGER,
  profile_photo_url TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vendor_profiles ENABLE ROW LEVEL SECURITY;

-- Create index for category filtering
CREATE INDEX idx_vendor_profiles_category ON public.vendor_profiles(category);

-- Create index for published vendors (marketplace browsing)
CREATE INDEX idx_vendor_profiles_published ON public.vendor_profiles(is_published) WHERE is_published = true;

-- =============================================================================
-- TABLE: portfolio_images
-- Vendor portfolio images with ordering support
-- =============================================================================

CREATE TABLE public.portfolio_images (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  caption TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_images ENABLE ROW LEVEL SECURITY;

-- Create index for vendor lookup
CREATE INDEX idx_portfolio_images_vendor_id ON public.portfolio_images(vendor_id);

-- =============================================================================
-- TABLE: vendor_availability
-- Blocked dates for vendors (when they're unavailable)
-- =============================================================================

CREATE TABLE public.vendor_availability (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(vendor_id, blocked_date)
);

-- Enable Row Level Security
ALTER TABLE public.vendor_availability ENABLE ROW LEVEL SECURITY;

-- Create index for date range queries
CREATE INDEX idx_vendor_availability_vendor_date ON public.vendor_availability(vendor_id, blocked_date);

-- =============================================================================
-- RLS POLICIES: vendor_profiles
-- =============================================================================

-- Public can view published vendor profiles (marketplace browsing)
CREATE POLICY "Public can view published vendors"
ON public.vendor_profiles FOR SELECT
USING (is_published = true);

-- Vendors can view their own profile (even if unpublished)
CREATE POLICY "Vendors can view own profile"
ON public.vendor_profiles FOR SELECT
USING ((SELECT auth.uid()) = id);

-- Vendors can insert their own profile
CREATE POLICY "Vendors can insert own profile"
ON public.vendor_profiles FOR INSERT
WITH CHECK ((SELECT auth.uid()) = id);

-- Vendors can update their own profile
CREATE POLICY "Vendors can update own profile"
ON public.vendor_profiles FOR UPDATE
USING ((SELECT auth.uid()) = id);

-- Vendors can delete their own profile
CREATE POLICY "Vendors can delete own profile"
ON public.vendor_profiles FOR DELETE
USING ((SELECT auth.uid()) = id);

-- =============================================================================
-- RLS POLICIES: portfolio_images
-- =============================================================================

-- Public can view all portfolio images (for viewing vendor portfolios)
CREATE POLICY "Public can view portfolio images"
ON public.portfolio_images FOR SELECT
USING (true);

-- Vendors can insert their own portfolio images
CREATE POLICY "Vendors can insert own portfolio images"
ON public.portfolio_images FOR INSERT
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- Vendors can update their own portfolio images
CREATE POLICY "Vendors can update own portfolio images"
ON public.portfolio_images FOR UPDATE
USING ((SELECT auth.uid()) = vendor_id);

-- Vendors can delete their own portfolio images
CREATE POLICY "Vendors can delete own portfolio images"
ON public.portfolio_images FOR DELETE
USING ((SELECT auth.uid()) = vendor_id);

-- =============================================================================
-- RLS POLICIES: vendor_availability
-- =============================================================================

-- Public can view all vendor availability (for booking flow)
CREATE POLICY "Public can view vendor availability"
ON public.vendor_availability FOR SELECT
USING (true);

-- Vendors can insert their own availability blocks
CREATE POLICY "Vendors can insert own availability"
ON public.vendor_availability FOR INSERT
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- Vendors can update their own availability blocks
CREATE POLICY "Vendors can update own availability"
ON public.vendor_availability FOR UPDATE
USING ((SELECT auth.uid()) = vendor_id);

-- Vendors can delete their own availability blocks
CREATE POLICY "Vendors can delete own availability"
ON public.vendor_availability FOR DELETE
USING ((SELECT auth.uid()) = vendor_id);

-- =============================================================================
-- TRIGGER: updated_at for vendor_profiles
-- Uses existing handle_updated_at function from 00001_profiles.sql
-- =============================================================================

CREATE TRIGGER set_vendor_profiles_updated_at
  BEFORE UPDATE ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- STORAGE BUCKET: portfolio-images
-- NOTE: Storage bucket must be created via Supabase Dashboard or CLI
--
-- To create via CLI:
--   npx supabase storage create portfolio-images --public
--
-- To create via Dashboard:
--   1. Go to Storage in Supabase Dashboard
--   2. Create new bucket named "portfolio-images"
--   3. Set as public bucket (for public URL access)
--
-- Recommended Storage RLS Policies (create in Dashboard > Storage > Policies):
--
-- SELECT (download):
--   USING (true)  -- Public can view all images
--
-- INSERT (upload):
--   WITH CHECK (
--     bucket_id = 'portfolio-images'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   )  -- Vendors can upload to their own folder
--
-- UPDATE:
--   USING (
--     bucket_id = 'portfolio-images'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   )  -- Vendors can update their own files
--
-- DELETE:
--   USING (
--     bucket_id = 'portfolio-images'
--     AND (storage.foldername(name))[1] = auth.uid()::text
--   )  -- Vendors can delete their own files
-- =============================================================================

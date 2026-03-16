-- Migration: 00010_vendor_booking_settings
-- Create vendor_booking_settings table for per-vendor booking configuration
-- Part of Vendor Availability feature

-- =============================================================================
-- TABLE: vendor_booking_settings
-- Per-vendor booking configuration (exclusive vs multi, max per day, buffer days)
-- =============================================================================

CREATE TABLE public.vendor_booking_settings (
  vendor_id UUID PRIMARY KEY REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  booking_type TEXT NOT NULL DEFAULT 'exclusive' CHECK (booking_type IN ('exclusive', 'multi')),
  max_per_day INTEGER NOT NULL DEFAULT 1 CHECK (max_per_day >= 1),
  buffer_days_before INTEGER NOT NULL DEFAULT 0 CHECK (buffer_days_before >= 0),
  buffer_days_after INTEGER NOT NULL DEFAULT 0 CHECK (buffer_days_after >= 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vendor_booking_settings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- RLS POLICIES: vendor_booking_settings
-- =============================================================================

-- Public can view booking settings (needed for availability checks during browse)
CREATE POLICY "Public can view vendor booking settings"
ON public.vendor_booking_settings FOR SELECT
USING (true);

-- Vendors can insert their own booking settings
CREATE POLICY "Vendors can insert own booking settings"
ON public.vendor_booking_settings FOR INSERT
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- Vendors can update their own booking settings
CREATE POLICY "Vendors can update own booking settings"
ON public.vendor_booking_settings FOR UPDATE
USING ((SELECT auth.uid()) = vendor_id);

-- =============================================================================
-- TRIGGER: updated_at for vendor_booking_settings
-- Uses existing handle_updated_at function from 00001_profiles.sql
-- =============================================================================

CREATE TRIGGER set_vendor_booking_settings_updated_at
  BEFORE UPDATE ON public.vendor_booking_settings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- =============================================================================
-- FUNCTION: auto_create_vendor_booking_settings
-- When a vendor_profile is inserted, auto-create booking settings with
-- category-appropriate defaults
-- =============================================================================

CREATE OR REPLACE FUNCTION public.auto_create_vendor_booking_settings()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_booking_type TEXT;
  v_max_per_day INTEGER;
  v_buffer_before INTEGER;
  v_buffer_after INTEGER;
BEGIN
  -- Set category-appropriate defaults
  CASE NEW.category
    WHEN 'venue' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 1;
      v_buffer_after := 1;
    WHEN 'musicians' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 5;
      v_buffer_after := 0;
    WHEN 'nattuvanar' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 5;
      v_buffer_after := 0;
    WHEN 'photography' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'videography' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'makeup_artist' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'stage_decoration' THEN
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 1;
      v_buffer_after := 0;
    WHEN 'catering' THEN
      v_booking_type := 'multi';
      v_max_per_day := 2;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'invitations' THEN
      v_booking_type := 'multi';
      v_max_per_day := 3;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'costumes' THEN
      v_booking_type := 'multi';
      v_max_per_day := 3;
      v_buffer_before := 0;
      v_buffer_after := 0;
    WHEN 'return_gifts' THEN
      v_booking_type := 'multi';
      v_max_per_day := 3;
      v_buffer_before := 0;
      v_buffer_after := 0;
    ELSE
      -- Fallback defaults
      v_booking_type := 'exclusive';
      v_max_per_day := 1;
      v_buffer_before := 0;
      v_buffer_after := 0;
  END CASE;

  INSERT INTO public.vendor_booking_settings (
    vendor_id, booking_type, max_per_day, buffer_days_before, buffer_days_after
  ) VALUES (
    NEW.id, v_booking_type, v_max_per_day, v_buffer_before, v_buffer_after
  );

  RETURN NEW;
END;
$$;

-- Create trigger on vendor_profiles to auto-create booking settings
CREATE TRIGGER on_vendor_profile_created_create_booking_settings
  AFTER INSERT ON public.vendor_profiles
  FOR EACH ROW EXECUTE FUNCTION public.auto_create_vendor_booking_settings();

-- =============================================================================
-- BACKFILL: Create booking settings for existing vendor profiles
-- =============================================================================

INSERT INTO public.vendor_booking_settings (vendor_id, booking_type, max_per_day, buffer_days_before, buffer_days_after)
SELECT
  vp.id,
  CASE
    WHEN vp.category IN ('catering') THEN 'multi'
    WHEN vp.category IN ('invitations', 'costumes', 'return_gifts') THEN 'multi'
    ELSE 'exclusive'
  END,
  CASE
    WHEN vp.category IN ('catering') THEN 2
    WHEN vp.category IN ('invitations', 'costumes', 'return_gifts') THEN 3
    ELSE 1
  END,
  CASE
    WHEN vp.category IN ('venue') THEN 1
    WHEN vp.category IN ('musicians', 'nattuvanar') THEN 5
    WHEN vp.category IN ('stage_decoration') THEN 1
    ELSE 0
  END,
  CASE
    WHEN vp.category IN ('venue') THEN 1
    ELSE 0
  END
FROM public.vendor_profiles vp
WHERE NOT EXISTS (
  SELECT 1 FROM public.vendor_booking_settings vbs WHERE vbs.vendor_id = vp.id
);

-- Migration: 00011_vendor_bookings
-- Create vendor_bookings table for tracking vendor booking dates
-- Part of Vendor Availability feature

-- =============================================================================
-- TABLE: vendor_bookings
-- Tracks vendor bookings per date, linked to events/inquiries or manual
-- =============================================================================

CREATE TABLE public.vendor_bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  event_id UUID REFERENCES public.events(id) ON DELETE SET NULL,
  inquiry_id UUID REFERENCES public.inquiries(id) ON DELETE SET NULL,
  booked_date DATE NOT NULL,
  blocked_dates DATE[] NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('confirmed', 'cancelled')),
  source TEXT NOT NULL DEFAULT 'inquiry' CHECK (source IN ('inquiry', 'manual')),
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.vendor_bookings ENABLE ROW LEVEL SECURITY;

-- =============================================================================
-- INDEXES
-- =============================================================================

CREATE INDEX idx_vendor_bookings_vendor_status ON public.vendor_bookings(vendor_id, status);
CREATE INDEX idx_vendor_bookings_vendor_date ON public.vendor_bookings(vendor_id, booked_date);
CREATE INDEX idx_vendor_bookings_inquiry ON public.vendor_bookings(inquiry_id);
CREATE INDEX idx_vendor_bookings_date_status ON public.vendor_bookings(vendor_id, booked_date, status) WHERE status = 'confirmed';

-- =============================================================================
-- RLS POLICIES: vendor_bookings
-- =============================================================================

-- Public can view confirmed bookings (for availability checks)
CREATE POLICY "Public can view confirmed bookings"
ON public.vendor_bookings FOR SELECT
USING (status = 'confirmed');

-- Vendors can view all their own bookings (including cancelled)
CREATE POLICY "Vendors can view own bookings"
ON public.vendor_bookings FOR SELECT
USING ((SELECT auth.uid()) = vendor_id);

-- Vendors can insert their own bookings
CREATE POLICY "Vendors can insert own bookings"
ON public.vendor_bookings FOR INSERT
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- Vendors can update their own bookings
CREATE POLICY "Vendors can update own bookings"
ON public.vendor_bookings FOR UPDATE
USING ((SELECT auth.uid()) = vendor_id);

-- =============================================================================
-- FUNCTION: validate_vendor_booking
-- Before INSERT or UPDATE, check that the vendor has not exceeded max_per_day
-- =============================================================================

CREATE OR REPLACE FUNCTION public.validate_vendor_booking()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_max_per_day INTEGER;
  v_current_count INTEGER;
BEGIN
  -- Only validate when booking is being confirmed
  -- (on INSERT with default 'confirmed', or UPDATE changing status to 'confirmed')
  IF NEW.status != 'confirmed' THEN
    RETURN NEW;
  END IF;

  -- Get the vendor's max_per_day setting
  SELECT max_per_day INTO v_max_per_day
  FROM public.vendor_booking_settings
  WHERE vendor_id = NEW.vendor_id;

  -- If no settings found, default to 1
  IF v_max_per_day IS NULL THEN
    v_max_per_day := 1;
  END IF;

  -- Count existing confirmed bookings for this vendor on this date
  -- Exclude the current row if this is an UPDATE
  SELECT COUNT(*) INTO v_current_count
  FROM public.vendor_bookings
  WHERE vendor_id = NEW.vendor_id
    AND booked_date = NEW.booked_date
    AND status = 'confirmed'
    AND id IS DISTINCT FROM NEW.id;

  IF v_current_count >= v_max_per_day THEN
    RAISE EXCEPTION 'Vendor has reached maximum bookings (%) for date %', v_max_per_day, NEW.booked_date;
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger for booking validation
CREATE TRIGGER validate_vendor_booking_trigger
  BEFORE INSERT OR UPDATE ON public.vendor_bookings
  FOR EACH ROW EXECUTE FUNCTION public.validate_vendor_booking();

-- Migration: 00004_inquiry_tables
-- Create inquiries table for user-vendor communication
-- Part of Phase 5: Inquiry & Connection

-- =============================================================================
-- ALTER TABLE: vendor_profiles
-- Add contact fields for vendor contact information
-- =============================================================================

ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;

-- =============================================================================
-- TABLE: inquiries
-- User inquiries to vendors for specific events
-- =============================================================================

CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  message TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  response_message TEXT,
  responded_at TIMESTAMPTZ,
  user_read_at TIMESTAMPTZ,
  vendor_read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id, event_id)
);

-- Enable Row Level Security
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Create indexes for efficient queries
CREATE INDEX idx_inquiries_user_id ON public.inquiries(user_id);
CREATE INDEX idx_inquiries_vendor_id ON public.inquiries(vendor_id);
CREATE INDEX idx_inquiries_status ON public.inquiries(status);
CREATE INDEX idx_inquiries_created_at ON public.inquiries(created_at DESC);

-- =============================================================================
-- RLS POLICIES: inquiries
-- =============================================================================

-- Users can view their own sent inquiries
CREATE POLICY "Users can view own inquiries"
ON public.inquiries FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Vendors can view inquiries sent to them
CREATE POLICY "Vendors can view received inquiries"
ON public.inquiries FOR SELECT
USING ((SELECT auth.uid()) = vendor_id);

-- Users can send inquiries (insert)
CREATE POLICY "Users can send inquiries"
ON public.inquiries FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can mark their inquiries as read (update user_read_at only)
CREATE POLICY "Users can mark inquiries read"
ON public.inquiries FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
  (SELECT auth.uid()) = user_id
  AND status = (SELECT status FROM public.inquiries WHERE id = inquiries.id)
  AND response_message IS NOT DISTINCT FROM (SELECT response_message FROM public.inquiries WHERE id = inquiries.id)
  AND responded_at IS NOT DISTINCT FROM (SELECT responded_at FROM public.inquiries WHERE id = inquiries.id)
  AND vendor_read_at IS NOT DISTINCT FROM (SELECT vendor_read_at FROM public.inquiries WHERE id = inquiries.id)
);

-- Vendors can respond to pending inquiries (update status, response_message, responded_at, vendor_read_at)
CREATE POLICY "Vendors can respond to inquiries"
ON public.inquiries FOR UPDATE
USING (
  (SELECT auth.uid()) = vendor_id
  AND status = 'pending'
)
WITH CHECK (
  (SELECT auth.uid()) = vendor_id
  AND status IN ('accepted', 'declined')
);

-- =============================================================================
-- TRIGGER: updated_at for inquiries
-- Uses existing handle_updated_at function from 00001_profiles.sql
-- =============================================================================

CREATE TRIGGER set_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

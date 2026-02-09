-- Migration: 00003_event_tables
-- Create events and saved_vendors tables for event planning
-- Part of Phase 3: Event Planning & Discovery

-- =============================================================================
-- TABLE: events
-- User events with vendor category tracking
-- =============================================================================

CREATE TABLE public.events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_date DATE NOT NULL,
  location TEXT,
  guest_count INTEGER,
  budget INTEGER,
  categories_needed TEXT[] DEFAULT '{}',
  categories_covered TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Create index for user lookup
CREATE INDEX idx_events_user_id ON public.events(user_id);

-- Create index for event date queries
CREATE INDEX idx_events_event_date ON public.events(event_date);

-- =============================================================================
-- TABLE: saved_vendors
-- User's saved/favorited vendors for quick access
-- =============================================================================

CREATE TABLE public.saved_vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, vendor_id)
);

-- Enable Row Level Security
ALTER TABLE public.saved_vendors ENABLE ROW LEVEL SECURITY;

-- Create index for user lookup
CREATE INDEX idx_saved_vendors_user_id ON public.saved_vendors(user_id);

-- Create index for vendor lookup
CREATE INDEX idx_saved_vendors_vendor_id ON public.saved_vendors(vendor_id);

-- =============================================================================
-- RLS POLICIES: events
-- =============================================================================

-- Users can view their own events
CREATE POLICY "Users can view own events"
ON public.events FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Users can insert their own events
CREATE POLICY "Users can insert own events"
ON public.events FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update their own events
CREATE POLICY "Users can update own events"
ON public.events FOR UPDATE
USING ((SELECT auth.uid()) = user_id);

-- Users can delete their own events
CREATE POLICY "Users can delete own events"
ON public.events FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- RLS POLICIES: saved_vendors
-- =============================================================================

-- Users can view their own saved vendors
CREATE POLICY "Users can view own saved vendors"
ON public.saved_vendors FOR SELECT
USING ((SELECT auth.uid()) = user_id);

-- Users can save vendors to their list
CREATE POLICY "Users can insert own saved vendors"
ON public.saved_vendors FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can remove vendors from their saved list
CREATE POLICY "Users can delete own saved vendors"
ON public.saved_vendors FOR DELETE
USING ((SELECT auth.uid()) = user_id);

-- =============================================================================
-- TRIGGER: updated_at for events
-- Uses existing handle_updated_at function from 00001_profiles.sql
-- =============================================================================

CREATE TRIGGER set_events_updated_at
  BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

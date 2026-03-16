-- Create event_budget_items table
CREATE TABLE public.event_budget_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  category TEXT NOT NULL,
  vendor_id UUID REFERENCES public.vendor_profiles(id),
  inquiry_id UUID REFERENCES public.inquiries(id),
  label TEXT,
  agreed_price INTEGER,
  price_notes TEXT,
  status TEXT NOT NULL DEFAULT 'estimated'
    CHECK (status IN ('estimated', 'agreed', 'paid', 'cancelled')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes
CREATE INDEX idx_budget_items_event_id ON public.event_budget_items(event_id);
CREATE INDEX idx_budget_items_vendor_id ON public.event_budget_items(vendor_id);

-- Updated_at trigger (consistent with all other tables - handle_updated_at() defined in 00001_profiles.sql)
CREATE TRIGGER handle_updated_at
  BEFORE UPDATE ON public.event_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- RLS
ALTER TABLE public.event_budget_items ENABLE ROW LEVEL SECURITY;

-- Event owner: full access
CREATE POLICY "Event owners can manage their budget items"
  ON public.event_budget_items
  FOR ALL
  USING (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    event_id IN (
      SELECT id FROM public.events WHERE user_id = auth.uid()
    )
  );

-- Vendor: read own items
CREATE POLICY "Vendors can view their own budget items"
  ON public.event_budget_items
  FOR SELECT
  USING (vendor_id = auth.uid());

-- Vendor: update own items (restricted fields enforced by trigger below)
CREATE POLICY "Vendors can update their own budget items"
  ON public.event_budget_items
  FOR UPDATE
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());

-- Restrict vendor updates to allowed fields only
CREATE OR REPLACE FUNCTION public.restrict_budget_item_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is not the event owner, restrict fields
  IF NOT EXISTS (
    SELECT 1 FROM public.events
    WHERE id = NEW.event_id AND user_id = auth.uid()
  ) THEN
    -- Vendor can only update agreed_price, price_notes, status
    IF NEW.event_id != OLD.event_id
       OR NEW.category != OLD.category
       OR NEW.vendor_id IS DISTINCT FROM OLD.vendor_id
       OR NEW.inquiry_id IS DISTINCT FROM OLD.inquiry_id
       OR NEW.label IS DISTINCT FROM OLD.label THEN
      RAISE EXCEPTION 'Vendors can only update price, notes, and status';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER restrict_budget_item_updates
  BEFORE UPDATE ON public.event_budget_items
  FOR EACH ROW
  EXECUTE FUNCTION public.restrict_budget_item_updates();

-- Add quoted_price columns to inquiries table
ALTER TABLE public.inquiries
  ADD COLUMN quoted_price INTEGER,
  ADD COLUMN quoted_price_notes TEXT;

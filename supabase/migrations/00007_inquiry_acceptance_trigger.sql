-- Migration: 00007_inquiry_acceptance_trigger
-- Automatically update event categories_covered when vendor accepts inquiry

-- Function to update event categories when inquiry is accepted
CREATE OR REPLACE FUNCTION public.handle_inquiry_accepted()
RETURNS TRIGGER AS $$
DECLARE
  vendor_category TEXT;
BEGIN
  -- Only run when status changes TO 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Get the vendor's category
    SELECT category INTO vendor_category
    FROM public.vendor_profiles
    WHERE id = NEW.vendor_id;

    -- Add category to event's categories_covered if not already present
    IF vendor_category IS NOT NULL THEN
      UPDATE public.events
      SET categories_covered = array_append(categories_covered, vendor_category)
      WHERE id = NEW.event_id
      AND NOT (vendor_category = ANY(categories_covered));
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger for inquiry acceptance
DROP TRIGGER IF EXISTS on_inquiry_accepted ON public.inquiries;
CREATE TRIGGER on_inquiry_accepted
  AFTER UPDATE ON public.inquiries
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_inquiry_accepted();

-- Migration: 00012_booking_cancellation_cascade
-- Cancel vendor bookings and budget items when linked inquiry status changes from 'accepted'
-- Part of Vendor Availability feature

-- =============================================================================
-- FUNCTION: handle_booking_on_inquiry_change
-- When inquiry status changes FROM 'accepted' to something else,
-- cancel the linked vendor_bookings row and budget item
-- =============================================================================

CREATE OR REPLACE FUNCTION public.handle_booking_on_inquiry_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  -- Only act when status changes FROM 'accepted' to something else
  IF OLD.status = 'accepted' AND NEW.status != 'accepted' THEN
    -- Cancel the linked booking
    UPDATE public.vendor_bookings
    SET status = 'cancelled'
    WHERE inquiry_id = NEW.id
      AND status = 'confirmed';

    -- Cancel the linked budget item (from budget-breakdown feature, migration 00008-00009)
    UPDATE public.event_budget_items
    SET status = 'cancelled'
    WHERE inquiry_id = NEW.id
      AND status != 'cancelled';
  END IF;

  RETURN NEW;
END;
$$;

-- Create trigger on inquiries for status changes
CREATE TRIGGER on_inquiry_status_change_update_booking
  AFTER UPDATE OF status ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_booking_on_inquiry_change();

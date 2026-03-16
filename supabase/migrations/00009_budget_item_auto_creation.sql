-- Replace the inquiry acceptance trigger to also create budget items
CREATE OR REPLACE FUNCTION public.handle_inquiry_accepted()
RETURNS TRIGGER AS $$
BEGIN
  -- Only proceed if status changed to 'accepted'
  IF NEW.status = 'accepted' AND (OLD.status IS NULL OR OLD.status != 'accepted') THEN
    -- Existing logic: update categories_covered on the event
    UPDATE public.events
    SET categories_covered = array_append(
      COALESCE(categories_covered, '{}'),
      (SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id)
    )
    WHERE id = NEW.event_id
    AND NOT (
      COALESCE(categories_covered, '{}') @>
      ARRAY[(SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id)]
    );

    -- New logic: create budget item
    INSERT INTO public.event_budget_items (
      event_id, category, vendor_id, inquiry_id, label, agreed_price, price_notes, status
    )
    VALUES (
      NEW.event_id,
      (SELECT category FROM public.vendor_profiles WHERE id = NEW.vendor_id),
      NEW.vendor_id,
      NEW.id,
      (SELECT business_name FROM public.vendor_profiles WHERE id = NEW.vendor_id),
      NEW.quoted_price,
      NEW.quoted_price_notes,
      CASE WHEN NEW.quoted_price IS NOT NULL THEN 'agreed' ELSE 'estimated' END
    );
  END IF;

  -- Handle declined: cancel linked budget item
  IF NEW.status = 'declined' AND (OLD.status IS NULL OR OLD.status != 'declined') THEN
    UPDATE public.event_budget_items
    SET status = 'cancelled'
    WHERE inquiry_id = NEW.id;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

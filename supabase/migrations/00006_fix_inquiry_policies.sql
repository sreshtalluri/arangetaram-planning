-- Migration: 00006_fix_inquiry_policies
-- Fix infinite recursion in inquiry RLS policies
-- The original policy had self-referential subqueries that caused recursion

-- Drop the problematic policies
DROP POLICY IF EXISTS "Users can mark inquiries read" ON public.inquiries;
DROP POLICY IF EXISTS "Vendors can respond to inquiries" ON public.inquiries;

-- Recreate vendor response policy (simplified, no recursion)
CREATE POLICY "Vendors can respond to inquiries"
ON public.inquiries FOR UPDATE
USING ((SELECT auth.uid()) = vendor_id)
WITH CHECK ((SELECT auth.uid()) = vendor_id);

-- Recreate user read policy (simplified, no recursion)
CREATE POLICY "Users can mark inquiries read"
ON public.inquiries FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Use a trigger instead of RLS to enforce column-level restrictions
CREATE OR REPLACE FUNCTION public.restrict_inquiry_updates()
RETURNS TRIGGER AS $$
BEGIN
  -- If the updater is the user (sender)
  IF OLD.user_id = auth.uid() THEN
    -- Users can only update user_read_at
    IF OLD.status IS DISTINCT FROM NEW.status OR
       OLD.response_message IS DISTINCT FROM NEW.response_message OR
       OLD.responded_at IS DISTINCT FROM NEW.responded_at OR
       OLD.vendor_read_at IS DISTINCT FROM NEW.vendor_read_at OR
       OLD.message IS DISTINCT FROM NEW.message THEN
      RAISE EXCEPTION 'Users can only update user_read_at';
    END IF;
  END IF;

  -- If the updater is the vendor (recipient)
  IF OLD.vendor_id = auth.uid() THEN
    -- Vendors can only respond to pending inquiries
    IF OLD.status != 'pending' AND OLD.status IS DISTINCT FROM NEW.status THEN
      RAISE EXCEPTION 'Cannot change status of already-responded inquiry';
    END IF;
    -- Vendors cannot change user_id, event_id, or user fields
    IF OLD.user_id IS DISTINCT FROM NEW.user_id OR
       OLD.event_id IS DISTINCT FROM NEW.event_id OR
       OLD.message IS DISTINCT FROM NEW.message OR
       OLD.user_read_at IS DISTINCT FROM NEW.user_read_at THEN
      RAISE EXCEPTION 'Vendors cannot modify user fields';
    END IF;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger
DROP TRIGGER IF EXISTS restrict_inquiry_updates_trigger ON public.inquiries;
CREATE TRIGGER restrict_inquiry_updates_trigger
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.restrict_inquiry_updates();

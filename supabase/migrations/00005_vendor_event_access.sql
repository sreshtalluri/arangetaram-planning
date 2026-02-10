-- Migration: 00005_vendor_event_access
-- Allow vendors to view events that are part of inquiries sent to them
-- Fixes: Vendor inquiry view showing "Event" and "Date not set" defaults

-- Vendors can view events that are linked to inquiries sent to them
CREATE POLICY "Vendors can view events from inquiries"
ON public.events FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE inquiries.event_id = events.id
    AND inquiries.vendor_id = (SELECT auth.uid())
  )
);

-- Also allow vendors to view user profiles for inquiries sent to them
-- (needed for displaying user name/email in inquiry cards)
CREATE POLICY "Vendors can view profiles from inquiries"
ON public.profiles FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.inquiries
    WHERE inquiries.user_id = profiles.id
    AND inquiries.vendor_id = (SELECT auth.uid())
  )
);

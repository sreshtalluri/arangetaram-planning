# Phase 5: Inquiry & Connection - Research

**Researched:** 2026-02-10
**Domain:** Inquiry system (user-vendor messaging), status tracking, dashboard UI patterns, Supabase RLS
**Confidence:** HIGH

## Summary

Phase 5 implements a user-vendor inquiry system where users can send inquiries from vendor profile pages (with event context auto-included), track status on their dashboard, and vendors can receive, view, and respond (accept/decline) on their dashboard. This is a single-response model: after vendor accepts, contact info is revealed and conversation continues externally.

The codebase has established patterns: React Query for data fetching, Supabase for backend, existing hooks (useEvents, useSavedVendors, useVendors), dashboard sidebar patterns (VendorDashboard), and UI components (Card, Button, Dialog, Badge). The inquiry system follows these patterns: new `inquiries` table, `useInquiries` hook for CRUD, dashboard sections for users and vendors.

**Primary recommendation:** Extend existing dashboard patterns. Add "My Inquiries" section to UserDashboard and "Inquiries" section to VendorDashboard. Create reusable InquiryCard and InquiryList components. Use existing Dialog for inquiry forms and response modals.

## Standard Stack

The established libraries/tools for this phase (already in package.json):

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | ^2.95.3 | Database + RLS | Already used for all data |
| @tanstack/react-query | ^5.90.20 | Server state management | All hooks use this pattern |
| react-hook-form | ^7.56.2 | Form management | Used in existing forms |
| zod | ^3.24.4 | Schema validation | Paired with react-hook-form |
| react-router-dom | ^7.5.1 | Navigation | Existing routing |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @radix-ui/react-dialog | ^1.1.11 | Modal dialogs | Inquiry form, response modal |
| @radix-ui/react-tabs | ^1.1.9 | Tab navigation | Dashboard tab sections (optional) |
| sonner | ^2.0.3 | Toast notifications | Success/error feedback |
| lucide-react | ^0.507.0 | Icons | UI icons (Send, Check, X, Clock, Mail, Phone) |
| date-fns | ^4.1.0 | Date formatting | Inquiry timestamps |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| New inquiries table | Extend saved_vendors | Inquiries have different lifecycle (status, response), separate table is cleaner |
| Dashboard tabs | Separate pages | Tabs keep context, match VendorDashboard pattern |
| Simple accept/decline | Chat system | CONTEXT.md specifies single-response model, chat is out of scope |

**Installation:**
No new packages needed. All required libraries are already installed.

## Architecture Patterns

### Recommended Project Structure
```
src/
|-- components/
|   |-- inquiry/                     # Inquiry-specific components
|   |   |-- InquiryCard.tsx          # Single inquiry display
|   |   |-- InquiryList.tsx          # List of inquiries with filters
|   |   |-- InquiryBadge.tsx         # Status badge (Pending/Accepted/Declined)
|   |   |-- SendInquiryDialog.tsx    # Modal for sending inquiry
|   |   |-- RespondInquiryDialog.tsx # Modal for vendor response
|   |   |-- InquiryStatsCard.tsx     # Stats for vendor dashboard
|   |   |-- ContactReveal.tsx        # Shows vendor contact after accept
|   |-- dashboard/
|   |   |-- MyInquiriesList.tsx      # User's sent inquiries section
|   |   |-- VendorInquiriesList.tsx  # Vendor's received inquiries
|-- hooks/
|   |-- useInquiries.ts              # CRUD for inquiries
|   |-- useInquiryStats.ts           # Aggregated stats for vendor
|-- pages/
|   |-- UserDashboard.jsx            # Add "My Inquiries" section
|   |-- VendorDashboard.jsx          # Add "Inquiries" section
|   |-- VendorDetailPage.jsx         # Update inquiry dialog
```

### Pattern 1: Inquiry Data Model
**What:** Single inquiries table with status tracking and relationships
**When to use:** Core data model for the inquiry system
**Example:**
```sql
-- Source: Pattern from existing migrations (00002_vendor_tables.sql, 00003_event_tables.sql)

CREATE TABLE public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Participants
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  vendor_id UUID NOT NULL REFERENCES public.vendor_profiles(id) ON DELETE CASCADE,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,

  -- Inquiry content
  message TEXT,  -- Optional user message (event details auto-included)

  -- Status tracking
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),

  -- Vendor response
  response_message TEXT,  -- Vendor's message with accept/decline
  responded_at TIMESTAMPTZ,

  -- Read tracking for badges
  user_read_at TIMESTAMPTZ,     -- When user last viewed (for "new response" badge)
  vendor_read_at TIMESTAMPTZ,   -- When vendor last viewed (for "new inquiry" badge)

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate inquiries for same event-vendor pair
  UNIQUE(user_id, vendor_id, event_id)
);
```

### Pattern 2: useInquiries Hook (React Query Pattern)
**What:** CRUD hook following existing useEvents/useSavedVendors patterns
**When to use:** All inquiry data operations
**Example:**
```typescript
// Source: Existing hooks/useEvents.ts, hooks/useSavedVendors.ts patterns

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { supabase } from '../lib/supabase'

export interface Inquiry {
  id: string
  user_id: string
  vendor_id: string
  event_id: string
  message: string | null
  status: 'pending' | 'accepted' | 'declined'
  response_message: string | null
  responded_at: string | null
  user_read_at: string | null
  vendor_read_at: string | null
  created_at: string
  updated_at: string
}

// Extended with joined data
export interface InquiryWithDetails extends Inquiry {
  event: {
    id: string
    event_name: string
    event_date: string
    location: string | null
    guest_count: number | null
    budget: number | null
  }
  vendor_profile: {
    id: string
    business_name: string
    category: string
    profile_photo_url: string | null
  }
  user_profile: {
    id: string
    full_name: string | null
    email: string
  }
}

// Fetch user's sent inquiries
export function useUserInquiries(userId: string | undefined) {
  return useQuery({
    queryKey: ['inquiries', 'user', userId],
    queryFn: async (): Promise<InquiryWithDetails[]> => {
      if (!userId) return []
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          event:events(id, event_name, event_date, location, guest_count, budget),
          vendor_profile:vendor_profiles(id, business_name, category, profile_photo_url)
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!userId,
    staleTime: 30 * 1000,
  })
}

// Fetch vendor's received inquiries
export function useVendorInquiries(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['inquiries', 'vendor', vendorId],
    queryFn: async (): Promise<InquiryWithDetails[]> => {
      if (!vendorId) return []
      const { data, error } = await supabase
        .from('inquiries')
        .select(`
          *,
          event:events(id, event_name, event_date, location, guest_count, budget),
          user_profile:profiles(id, full_name, email)
        `)
        .eq('vendor_id', vendorId)
        .order('created_at', { ascending: false })
      if (error) throw error
      return data || []
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

// Send inquiry mutation
export function useSendInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ userId, vendorId, eventId, message }: {
      userId: string
      vendorId: string
      eventId: string
      message?: string
    }) => {
      const { data, error } = await supabase
        .from('inquiries')
        .insert({
          user_id: userId,
          vendor_id: vendorId,
          event_id: eventId,
          message: message || null,
          status: 'pending',
        })
        .select()
        .single()
      // Handle duplicate inquiry gracefully
      if (error && error.code === '23505') {
        throw new Error('You have already sent an inquiry for this event')
      }
      if (error) throw error
      return data
    },
    onSuccess: (_, { userId, vendorId }) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'user', userId] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-stats', vendorId] })
    },
  })
}

// Vendor response mutation
export function useRespondToInquiry() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({ inquiryId, status, responseMessage }: {
      inquiryId: string
      status: 'accepted' | 'declined'
      responseMessage?: string
    }) => {
      const { data, error } = await supabase
        .from('inquiries')
        .update({
          status,
          response_message: responseMessage || null,
          responded_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', inquiryId)
        .select()
        .single()
      if (error) throw error
      return data
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'vendor', data.vendor_id] })
      queryClient.invalidateQueries({ queryKey: ['inquiries', 'user', data.user_id] })
      queryClient.invalidateQueries({ queryKey: ['inquiry-stats', data.vendor_id] })
    },
  })
}
```

### Pattern 3: Inquiry Status Badge
**What:** Reusable badge component for inquiry status
**When to use:** InquiryCard, InquiryList
**Example:**
```typescript
// Source: Existing Badge component patterns, priceColors in VendorDetailPage

import { Badge } from '../ui/badge'
import { Clock, Check, X } from 'lucide-react'

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: Check,
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: X,
  },
}

interface InquiryBadgeProps {
  status: 'pending' | 'accepted' | 'declined'
  showIcon?: boolean
}

export function InquiryBadge({ status, showIcon = true }: InquiryBadgeProps) {
  const config = statusConfig[status]
  const Icon = config.icon

  return (
    <Badge className={`${config.className} border`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}
```

### Pattern 4: Contact Reveal After Accept
**What:** Component that shows vendor contact info only after inquiry accepted
**When to use:** User's inquiry card when status is 'accepted'
**Example:**
```typescript
// Source: VendorDetailPage contact info pattern

interface ContactRevealProps {
  vendorId: string
  status: 'pending' | 'accepted' | 'declined'
}

export function ContactReveal({ vendorId, status }: ContactRevealProps) {
  // Only show for accepted inquiries
  if (status !== 'accepted') {
    return (
      <p className="text-sm text-[#888888]">
        Contact info will be revealed after vendor accepts
      </p>
    )
  }

  // Fetch vendor contact info (requires additional select in RLS)
  const { data: vendor } = useVendorContact(vendorId)

  return (
    <div className="bg-green-50 border border-green-200 rounded-lg p-4">
      <h4 className="font-medium text-green-800 mb-2">Contact Information</h4>
      <div className="space-y-2 text-sm">
        {vendor?.contact_phone && (
          <a href={`tel:${vendor.contact_phone}`} className="flex items-center gap-2 text-green-700 hover:underline">
            <Phone className="w-4 h-4" />
            {vendor.contact_phone}
          </a>
        )}
        {vendor?.contact_email && (
          <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-2 text-green-700 hover:underline">
            <Mail className="w-4 h-4" />
            {vendor.contact_email}
          </a>
        )}
      </div>
    </div>
  )
}
```

### Pattern 5: Unread Badge Counter
**What:** Badge showing count of unread inquiries/responses
**When to use:** Dashboard sidebar navigation, navbar
**Example:**
```typescript
// Source: CONTEXT.md - "Badge shows count of new unread inquiries (for vendors)"

// Hook to count unread
export function useUnreadCount(userId: string | undefined, role: 'user' | 'vendor') {
  return useQuery({
    queryKey: ['unread-count', userId, role],
    queryFn: async () => {
      if (!userId) return 0

      if (role === 'vendor') {
        // Count inquiries where vendor hasn't read yet
        const { count, error } = await supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('vendor_id', userId)
          .is('vendor_read_at', null)
        if (error) throw error
        return count || 0
      } else {
        // Count responses user hasn't read yet
        const { count, error } = await supabase
          .from('inquiries')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', userId)
          .neq('status', 'pending')
          .is('user_read_at', null)
        if (error) throw error
        return count || 0
      }
    },
    enabled: !!userId,
    staleTime: 10 * 1000, // Refresh frequently for live feel
    refetchInterval: 30 * 1000, // Poll for updates
  })
}

// Badge component
function UnreadBadge({ count }: { count: number }) {
  if (count === 0) return null

  return (
    <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-red-500 text-white text-xs flex items-center justify-center font-medium">
      {count > 9 ? '9+' : count}
    </span>
  )
}
```

### Anti-Patterns to Avoid
- **Storing contact info in inquiry:** Don't duplicate vendor contact in inquiry record. Keep in vendor_profiles, fetch when status is accepted.
- **Complex messaging thread:** CONTEXT.md specifies single-response model. Don't build chat functionality.
- **Client-side status validation:** Status transitions should be enforced in database (RLS or check constraints).
- **Polling without caching:** Use React Query's staleTime and refetchInterval, not manual setInterval.

## Don't Hand-Roll

Problems that look simple but have existing solutions:

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Modal dialogs | Custom portal | @radix-ui/react-dialog | Focus trap, escape key, accessibility |
| Status badges | Custom styled span | Badge component with variants | Consistent styling, theme support |
| Date formatting | Manual string formatting | date-fns formatDistance, format | Handles timezones, i18n-ready |
| Toast notifications | Custom toast system | sonner | Already in codebase, handles queue |
| Data fetching | useEffect + fetch | React Query useQuery/useMutation | Caching, error handling, invalidation |
| Form validation | Manual validation | zod + react-hook-form | Consistent with existing forms |

**Key insight:** The inquiry system is a CRUD feature that follows exact patterns already established. Every hook pattern exists (useEvents for queries, useSaveVendor for mutations), every UI pattern exists (EventCard for list items, Dialog for modals, Badge for status). No new abstractions needed.

## Common Pitfalls

### Pitfall 1: Duplicate Inquiries
**What goes wrong:** User sends multiple inquiries to same vendor for same event
**Why it happens:** No uniqueness constraint
**How to avoid:** UNIQUE(user_id, vendor_id, event_id) constraint in database; handle 23505 error gracefully in mutation
**Warning signs:** Vendor sees duplicate entries

### Pitfall 2: Contact Info Leakage
**What goes wrong:** User can see vendor contact before inquiry accepted
**Why it happens:** RLS policy too permissive on vendor_profiles
**How to avoid:** Either:
  - Add contact_email/contact_phone to vendor_profiles with separate RLS
  - Or create accepted_inquiry_contacts view that joins with inquiry status
**Warning signs:** Unpaid access to premium info

### Pitfall 3: Stale Read Counts
**What goes wrong:** Badge shows wrong number of unread items
**Why it happens:** Not invalidating count after marking read
**How to avoid:** Invalidate unread-count query when marking read; use React Query's onSuccess
**Warning signs:** Badge persists after viewing

### Pitfall 4: Missing Event Context
**What goes wrong:** Vendor receives inquiry but can't see event details
**Why it happens:** Forgot to join events table in vendor inquiry query
**How to avoid:** Include event in select: `event:events(event_name, event_date, location, guest_count, budget)`
**Warning signs:** Vendor sees blank inquiry

### Pitfall 5: Status Transition Bugs
**What goes wrong:** Inquiry status changes from declined to pending
**Why it happens:** No server-side validation of status transitions
**How to avoid:** RLS policy that only allows transitions from pending to accepted/declined
**Warning signs:** Inconsistent state

### Pitfall 6: Event Selector Confusion
**What goes wrong:** User has multiple events, inquiry goes to wrong event
**Why it happens:** Auto-selecting first event without user confirmation
**How to avoid:** If user has multiple events, show selector in SendInquiryDialog; if only one event, auto-select but show which
**Warning signs:** User complains inquiry has wrong event details

## Code Examples

Verified patterns from official sources and existing codebase:

### Database Migration for Inquiries
```sql
-- Migration: 00004_inquiry_tables.sql
-- Source: Pattern from existing 00002_vendor_tables.sql, 00003_event_tables.sql

-- =============================================================================
-- TABLE: inquiries
-- User inquiries to vendors with status tracking
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

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

-- Indexes for common queries
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

-- Users can create inquiries (with their user_id)
CREATE POLICY "Users can send inquiries"
ON public.inquiries FOR INSERT
WITH CHECK ((SELECT auth.uid()) = user_id);

-- Users can update only their read_at (for marking read)
CREATE POLICY "Users can mark own inquiries read"
ON public.inquiries FOR UPDATE
USING ((SELECT auth.uid()) = user_id)
WITH CHECK (
  -- Only allow updating user_read_at
  user_id = (SELECT user_id FROM public.inquiries WHERE id = inquiries.id)
  AND vendor_id = (SELECT vendor_id FROM public.inquiries WHERE id = inquiries.id)
  AND event_id = (SELECT event_id FROM public.inquiries WHERE id = inquiries.id)
  AND message = (SELECT message FROM public.inquiries WHERE id = inquiries.id)
  AND status = (SELECT status FROM public.inquiries WHERE id = inquiries.id)
);

-- Vendors can update status and response (only from pending)
CREATE POLICY "Vendors can respond to inquiries"
ON public.inquiries FOR UPDATE
USING (
  (SELECT auth.uid()) = vendor_id
  AND status = 'pending'  -- Can only respond to pending inquiries
)
WITH CHECK (
  (SELECT auth.uid()) = vendor_id
  AND status IN ('accepted', 'declined')  -- Can only transition to these states
);

-- Trigger for updated_at
CREATE TRIGGER set_inquiries_updated_at
  BEFORE UPDATE ON public.inquiries
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
```

### Add Contact Fields to Vendor Profiles (if not present)
```sql
-- Add contact fields if they don't exist
-- Note: These may already exist, check vendor_profiles schema

ALTER TABLE public.vendor_profiles
ADD COLUMN IF NOT EXISTS contact_email TEXT,
ADD COLUMN IF NOT EXISTS contact_phone TEXT;
```

### InquiryCard Component
```typescript
// Source: Existing EventCard pattern from components/dashboard/EventCard.tsx

import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Calendar, MapPin, Users, DollarSign, MessageSquare } from 'lucide-react'
import { InquiryBadge } from './InquiryBadge'
import { ContactReveal } from './ContactReveal'
import type { InquiryWithDetails } from '../../hooks/useInquiries'

interface InquiryCardProps {
  inquiry: InquiryWithDetails
  view: 'user' | 'vendor'
  onRespond?: () => void
}

export function InquiryCard({ inquiry, view, onRespond }: InquiryCardProps) {
  const timeAgo = formatDistanceToNow(parseISO(inquiry.created_at), { addSuffix: true })
  const eventDate = inquiry.event?.event_date
    ? format(parseISO(inquiry.event.event_date), 'MMMM d, yyyy')
    : 'Date not set'

  return (
    <div className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 mb-4">
        <div>
          {view === 'user' ? (
            <h3 className="font-semibold text-[#1A1A1A]">
              {inquiry.vendor_profile?.business_name}
            </h3>
          ) : (
            <h3 className="font-semibold text-[#1A1A1A]">
              {inquiry.user_profile?.full_name || inquiry.user_profile?.email}
            </h3>
          )}
          <p className="text-sm text-[#888888]">{timeAgo}</p>
        </div>
        <InquiryBadge status={inquiry.status} />
      </div>

      {/* Event Details */}
      <div className="bg-[#F9F8F4] rounded-lg p-4 mb-4">
        <h4 className="font-medium text-[#1A1A1A] mb-2">
          {inquiry.event?.event_name || 'Event'}
        </h4>
        <div className="grid grid-cols-2 gap-2 text-sm text-[#4A4A4A]">
          <div className="flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {eventDate}
          </div>
          {inquiry.event?.location && (
            <div className="flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {inquiry.event.location}
            </div>
          )}
          {inquiry.event?.guest_count && (
            <div className="flex items-center gap-1">
              <Users className="w-4 h-4" />
              {inquiry.event.guest_count} guests
            </div>
          )}
          {inquiry.event?.budget && (
            <div className="flex items-center gap-1">
              <DollarSign className="w-4 h-4" />
              ${inquiry.event.budget.toLocaleString()}
            </div>
          )}
        </div>
      </div>

      {/* User Message */}
      {inquiry.message && (
        <div className="mb-4">
          <p className="text-sm text-[#4A4A4A]">{inquiry.message}</p>
        </div>
      )}

      {/* Vendor Response */}
      {inquiry.status !== 'pending' && inquiry.response_message && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm font-medium text-[#1A1A1A] mb-1">Vendor Response:</p>
          <p className="text-sm text-[#4A4A4A]">{inquiry.response_message}</p>
        </div>
      )}

      {/* Contact Reveal (for users with accepted inquiries) */}
      {view === 'user' && inquiry.status === 'accepted' && (
        <div className="border-t pt-4 mt-4">
          <ContactReveal vendorId={inquiry.vendor_id} status={inquiry.status} />
        </div>
      )}

      {/* Respond Button (for vendors with pending inquiries) */}
      {view === 'vendor' && inquiry.status === 'pending' && onRespond && (
        <div className="border-t pt-4 mt-4">
          <Button onClick={onRespond} className="btn-primary w-full">
            <MessageSquare className="w-4 h-4 mr-2" />
            Respond
          </Button>
        </div>
      )}
    </div>
  )
}
```

### SendInquiryDialog Component
```typescript
// Source: VendorDetailPage booking dialog pattern

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select'
import { useSendInquiry } from '../../hooks/useInquiries'
import { useEvents } from '../../hooks/useEvents'
import { toast } from 'sonner'
import { format, parseISO } from 'date-fns'
import { Loader2 } from 'lucide-react'

const schema = z.object({
  eventId: z.string().min(1, 'Please select an event'),
  message: z.string().optional(),
})

type FormData = z.infer<typeof schema>

interface SendInquiryDialogProps {
  vendorId: string
  vendorName: string
  userId: string
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SendInquiryDialog({ vendorId, vendorName, userId, open, onOpenChange }: SendInquiryDialogProps) {
  const { data: events = [], isLoading: eventsLoading } = useEvents(userId)
  const sendInquiry = useSendInquiry()

  const { register, handleSubmit, formState: { errors }, setValue, watch, reset } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      eventId: events.length === 1 ? events[0].id : '',
      message: '',
    },
  })

  const selectedEventId = watch('eventId')
  const selectedEvent = events.find(e => e.id === selectedEventId)

  const onSubmit = async (data: FormData) => {
    try {
      await sendInquiry.mutateAsync({
        userId,
        vendorId,
        eventId: data.eventId,
        message: data.message,
      })
      toast.success('Inquiry sent successfully!')
      onOpenChange(false)
      reset()
    } catch (error: any) {
      toast.error(error.message || 'Failed to send inquiry')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Inquiry to {vendorName}</DialogTitle>
          <DialogDescription>
            Your event details will be shared automatically.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          {/* Event Selector */}
          {events.length > 1 ? (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Event</label>
              <Select
                value={selectedEventId}
                onValueChange={(value) => setValue('eventId', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.event_name} - {format(parseISO(event.event_date), 'MMM d, yyyy')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.eventId && (
                <p className="text-sm text-red-500">{errors.eventId.message}</p>
              )}
            </div>
          ) : events.length === 1 ? (
            <div className="bg-[#F9F8F4] rounded-lg p-3 text-sm">
              <p className="font-medium">{events[0].event_name}</p>
              <p className="text-[#888888]">
                {format(parseISO(events[0].event_date), 'MMMM d, yyyy')}
              </p>
            </div>
          ) : (
            <p className="text-sm text-amber-600">
              Please create an event first to send an inquiry.
            </p>
          )}

          {/* Event Details Preview */}
          {selectedEvent && (
            <div className="bg-[#F9F8F4] rounded-lg p-3 text-sm space-y-1">
              <p className="font-medium text-[#1A1A1A]">Event details that will be shared:</p>
              <ul className="text-[#4A4A4A] space-y-1">
                <li>Date: {format(parseISO(selectedEvent.event_date), 'MMMM d, yyyy')}</li>
                {selectedEvent.location && <li>Location: {selectedEvent.location}</li>}
                {selectedEvent.guest_count && <li>Guests: {selectedEvent.guest_count}</li>}
                {selectedEvent.budget && <li>Budget: ${selectedEvent.budget.toLocaleString()}</li>}
              </ul>
            </div>
          )}

          {/* Optional Message */}
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Message <span className="text-[#888888] font-normal">(optional)</span>
            </label>
            <Textarea
              {...register('message')}
              placeholder="Add any specific requirements or questions..."
              className="input-styled resize-none"
              rows={3}
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              className="btn-primary"
              disabled={sendInquiry.isPending || events.length === 0}
            >
              {sendInquiry.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                'Send Inquiry'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
```

### Vendor Inquiry Stats Card
```typescript
// Source: VendorDashboard Quick Stats pattern

import { useQuery } from '@tanstack/react-query'
import { supabase } from '../../lib/supabase'
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

export function useInquiryStats(vendorId: string | undefined) {
  return useQuery({
    queryKey: ['inquiry-stats', vendorId],
    queryFn: async () => {
      if (!vendorId) return { total: 0, pending: 0, accepted: 0, declined: 0 }

      const { data, error } = await supabase
        .from('inquiries')
        .select('status')
        .eq('vendor_id', vendorId)

      if (error) throw error

      const stats = {
        total: data?.length || 0,
        pending: data?.filter(i => i.status === 'pending').length || 0,
        accepted: data?.filter(i => i.status === 'accepted').length || 0,
        declined: data?.filter(i => i.status === 'declined').length || 0,
      }

      return stats
    },
    enabled: !!vendorId,
    staleTime: 30 * 1000,
  })
}

export function InquiryStatsCards({ vendorId }: { vendorId: string }) {
  const { data: stats } = useInquiryStats(vendorId)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard
        icon={MessageSquare}
        iconBg="bg-[#0F4C5C]/10"
        iconColor="text-[#0F4C5C]"
        value={stats?.total || 0}
        label="Total"
      />
      <StatCard
        icon={Clock}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        value={stats?.pending || 0}
        label="Pending"
      />
      <StatCard
        icon={CheckCircle}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        value={stats?.accepted || 0}
        label="Accepted"
      />
      <StatCard
        icon={XCircle}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        value={stats?.declined || 0}
        label="Declined"
      />
    </div>
  )
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Full messaging systems | Single-response inquiry | Context decision | Simpler, external conversation |
| Email-only contact | In-app inquiry + contact reveal | Modern marketplaces | Better tracking, value exchange |
| Polling for updates | React Query with staleTime | 2022+ | Efficient caching, less server load |

**Deprecated/outdated:**
- WebSocket for inquiry updates: Overkill for this use case; polling with React Query is sufficient
- Redux for inquiry state: React Query handles server state better
- Custom form validation: Use zod + react-hook-form

## Open Questions

Things that couldn't be fully resolved:

1. **Multi-vendor inquiry (bulk send)**
   - What we know: CONTEXT.md says "Claude picks simpler approach for MVP"
   - What's unclear: Should user be able to send same inquiry to multiple vendors at once?
   - Recommendation: Start with single-vendor per inquiry. Bulk send adds complexity (selecting multiple vendors, tracking individual responses). User can manually send to multiple vendors. Can add bulk feature later if requested.

2. **Decline reason field**
   - What we know: CONTEXT.md says "Claude's discretion on whether optional or required"
   - Recommendation: Make decline reason OPTIONAL. Required reasons feel punitive. Optional allows vendors to explain if they want. Store in same response_message field.

3. **Contact info storage**
   - What we know: VendorDetailPage already shows contact_phone/contact_email
   - What's unclear: These fields may not be in vendor_profiles yet
   - Recommendation: Add contact_email and contact_phone columns to vendor_profiles if not present. Collect during profile wizard or let vendor add later.

4. **Badge placement**
   - What we know: CONTEXT.md says "Badge styling and placement based on existing UI patterns"
   - Recommendation: Add badge to sidebar navigation in VendorDashboard (on "Inquiries" item) and to UserDashboard navbar (if using tabs, on tab; otherwise near header). Follow Radix UI badge patterns.

## Sources

### Primary (HIGH confidence)
- Existing codebase patterns: useEvents.ts, useSavedVendors.ts, VendorDashboard.jsx, UserDashboard.jsx
- Existing migrations: 00001_profiles.sql, 00002_vendor_tables.sql, 00003_event_tables.sql
- Supabase RLS documentation (verified against existing migration patterns)

### Secondary (MEDIUM confidence)
- React Query patterns (verified against existing hooks)
- Radix UI Dialog (already used in VendorDetailPage)

### Tertiary (LOW confidence)
- None - all patterns verified against existing codebase

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - All libraries already installed and in use
- Architecture: HIGH - Extends existing proven patterns (useEvents, EventCard, VendorDashboard)
- Database schema: HIGH - Follows exact patterns from existing migrations
- Pitfalls: HIGH - Common issues in similar CRUD systems
- UI components: HIGH - Reuses existing component patterns

**Research date:** 2026-02-10
**Valid until:** 30 days (stable domain, established patterns)

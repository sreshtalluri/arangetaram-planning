import { useState, useEffect } from 'react'
import { useEvents } from '../../hooks/useEvents'
import { useSendInquiry } from '../../hooks/useInquiries'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { toast } from 'sonner'
import { Loader2, Calendar, MapPin, Users, DollarSign, AlertTriangle } from 'lucide-react'
import { format, parseISO } from 'date-fns'

/**
 * SendInquiryDialog - Modal for sending inquiries to vendors
 *
 * Features:
 * - Fetches user's events and allows selection
 * - Auto-selects if user has only one event
 * - Shows event details preview before sending
 * - Handles duplicate inquiry error gracefully
 */
export function SendInquiryDialog({ vendorId, vendorName, userId, open, onOpenChange }) {
  const { data: events = [], isLoading: eventsLoading } = useEvents(userId)
  const sendInquiry = useSendInquiry()
  const [selectedEventId, setSelectedEventId] = useState('')
  const [message, setMessage] = useState('')

  // Auto-select if single event
  useEffect(() => {
    if (events.length === 1) {
      setSelectedEventId(events[0].id)
    }
  }, [events])

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEventId(events.length === 1 ? events[0]?.id || '' : '')
      setMessage('')
    }
  }, [open, events])

  const selectedEvent = events.find(e => e.id === selectedEventId)

  const handleSubmit = async () => {
    if (!selectedEventId) {
      toast.error('Please select an event')
      return
    }

    try {
      await sendInquiry.mutateAsync({
        userId,
        vendorId,
        eventId: selectedEventId,
        message: message || undefined,
      })
      toast.success('Inquiry sent successfully!')
      onOpenChange(false)
      setMessage('')
    } catch (error) {
      toast.error(error.message || 'Failed to send inquiry')
    }
  }

  const formatBudget = (budget) => {
    if (!budget) return 'Not specified'
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0,
    }).format(budget)
  }

  const hasNoEvents = !eventsLoading && events.length === 0
  const hasMultipleEvents = events.length > 1

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Send Inquiry</DialogTitle>
          <DialogDescription>
            Send an inquiry to {vendorName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Loading state */}
          {eventsLoading && (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-[#0F4C5C]" />
            </div>
          )}

          {/* No events warning */}
          {hasNoEvents && (
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-amber-800">
                  Please create an event first to send an inquiry
                </p>
                <p className="text-sm text-amber-700 mt-1">
                  You need to have at least one event to inquire with vendors about.
                </p>
              </div>
            </div>
          )}

          {/* Event selector (multiple events) */}
          {!eventsLoading && hasMultipleEvents && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Event</label>
              <Select value={selectedEventId} onValueChange={setSelectedEventId}>
                <SelectTrigger className="w-full">
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
            </div>
          )}

          {/* Event details preview */}
          {selectedEvent && (
            <div className="bg-[#F9F8F4] rounded-lg p-4 space-y-3">
              <h4 className="font-medium text-[#1A1A1A]">{selectedEvent.event_name}</h4>
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="flex items-center gap-2 text-[#4A4A4A]">
                  <Calendar className="w-4 h-4 text-[#0F4C5C]" />
                  <span>{format(parseISO(selectedEvent.event_date), 'MMMM d, yyyy')}</span>
                </div>
                {selectedEvent.location && (
                  <div className="flex items-center gap-2 text-[#4A4A4A]">
                    <MapPin className="w-4 h-4 text-[#0F4C5C]" />
                    <span>{selectedEvent.location}</span>
                  </div>
                )}
                {selectedEvent.guest_count && (
                  <div className="flex items-center gap-2 text-[#4A4A4A]">
                    <Users className="w-4 h-4 text-[#0F4C5C]" />
                    <span>{selectedEvent.guest_count} guests</span>
                  </div>
                )}
                {selectedEvent.budget && (
                  <div className="flex items-center gap-2 text-[#4A4A4A]">
                    <DollarSign className="w-4 h-4 text-[#0F4C5C]" />
                    <span>{formatBudget(selectedEvent.budget)}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Message field (only show if events exist) */}
          {!eventsLoading && events.length > 0 && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any specific requirements or questions..."
                className="input-styled resize-none"
                rows={4}
                data-testid="inquiry-message"
              />
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="btn-primary"
            disabled={hasNoEvents || !selectedEventId || sendInquiry.isPending}
            data-testid="submit-inquiry-btn"
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
      </DialogContent>
    </Dialog>
  )
}

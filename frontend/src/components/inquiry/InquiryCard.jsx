import { format, formatDistanceToNow, parseISO } from 'date-fns'
import { Calendar, MapPin, Users, DollarSign, MessageSquare } from 'lucide-react'
import { InquiryBadge } from './InquiryBadge'
import { ContactReveal } from './ContactReveal'
import { Button } from '../ui/button'

/**
 * InquiryCard displays an inquiry with event details, status, and actions
 *
 * @param {Object} props
 * @param {Object} props.inquiry - InquiryWithDetails object
 * @param {'user' | 'vendor'} props.view - Determines what to show
 * @param {Function} [props.onRespond] - Callback for vendor respond action
 */
export function InquiryCard({ inquiry, view, onRespond }) {
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

      {/* Contact Reveal (user view, accepted) */}
      {view === 'user' && inquiry.status === 'accepted' && (
        <div className="border-t pt-4 mt-4">
          <ContactReveal vendorProfile={inquiry.vendor_profile} />
        </div>
      )}

      {/* Respond Button (vendor view, pending) */}
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

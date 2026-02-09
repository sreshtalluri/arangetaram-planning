import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Calendar, MapPin, Users, DollarSign, Pencil, Search } from 'lucide-react'
import { Button } from '../ui/button'
import { CategoryProgress } from './CategoryProgress'
import type { Event } from '../../hooks/useEvents'

interface EventCardProps {
  event: Event
  onEdit?: () => void
  onBrowseVendors?: () => void
}

/**
 * Event summary card displaying event details and category progress
 * Used in UserDashboard to show user's events
 */
export function EventCard({ event, onEdit, onBrowseVendors }: EventCardProps) {
  // Format date nicely (e.g., "March 15, 2026")
  const formattedDate = event.event_date
    ? format(parseISO(event.event_date), 'MMMM d, yyyy')
    : 'Date not set'

  // Format budget with dollar sign and commas
  const formattedBudget = event.budget
    ? `$${event.budget.toLocaleString()}`
    : null

  // Calculate pending categories for browse link
  const pendingCategories = event.categories_needed.filter(
    (cat) => !event.categories_covered.includes(cat)
  )

  // Build browse URL with first pending category pre-selected
  const browseUrl =
    pendingCategories.length > 0
      ? `/vendors?category=${pendingCategories[0]}&date=${event.event_date}`
      : `/vendors?date=${event.event_date}`

  return (
    <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow p-6">
      {/* Header: Event Name + Actions */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-4">
        <div>
          <h3
            className="text-xl font-semibold text-[#1A1A1A]"
            style={{ fontFamily: 'Playfair Display, serif' }}
          >
            {event.event_name}
          </h3>
          <div className="flex items-center gap-1 text-[#0F4C5C] mt-1">
            <Calendar className="w-4 h-4" />
            <span className="font-medium">{formattedDate}</span>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onEdit}
            className="btn-ghost"
          >
            <Pencil className="w-4 h-4 mr-1" />
            Edit
          </Button>
          <Button
            size="sm"
            onClick={onBrowseVendors}
            className="btn-primary"
          >
            <Search className="w-4 h-4 mr-1" />
            Browse Vendors
          </Button>
        </div>
      </div>

      {/* Metadata Row: Location, Guest Count, Budget */}
      <div className="flex flex-wrap items-center gap-4 text-sm text-[#4A4A4A] mb-6">
        {event.location && (
          <div className="flex items-center gap-1">
            <MapPin className="w-4 h-4 text-[#888888]" />
            <span>{event.location}</span>
          </div>
        )}
        {event.guest_count && (
          <div className="flex items-center gap-1">
            <Users className="w-4 h-4 text-[#888888]" />
            <span>{event.guest_count} guests</span>
          </div>
        )}
        {formattedBudget && (
          <div className="flex items-center gap-1">
            <DollarSign className="w-4 h-4 text-[#888888]" />
            <span>{formattedBudget}</span>
          </div>
        )}
      </div>

      {/* Category Progress Section */}
      {event.categories_needed.length > 0 ? (
        <div className="pt-4 border-t border-[#E5E5E5]">
          <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">
            Category Coverage
          </h4>
          <CategoryProgress
            needed={event.categories_needed}
            covered={event.categories_covered}
            eventDate={event.event_date}
          />
        </div>
      ) : (
        <div className="pt-4 border-t border-[#E5E5E5] text-sm text-[#888888]">
          No vendor categories selected yet.{' '}
          <Link
            to={`/events/create?edit=${event.id}`}
            className="text-[#0F4C5C] hover:underline"
          >
            Add categories
          </Link>
        </div>
      )}
    </div>
  )
}

export default EventCard

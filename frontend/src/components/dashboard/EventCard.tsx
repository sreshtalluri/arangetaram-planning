import { useState } from 'react'
import { Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { Calendar, MapPin, Users, DollarSign, Pencil, Search, Trash2 } from 'lucide-react'
import { Button } from '../ui/button'
import { CategoryProgress } from './CategoryProgress'
import { AddBudgetItemDialog } from '../budget/AddBudgetItemDialog'
import type { Event } from '../../hooks/useEvents'
import { useEventBudgetItems, useAddBudgetItem } from '../../hooks/useEventBudgetItems'

interface EventCardProps {
  event: Event
  onEdit?: () => void
  onBrowseVendors?: () => void
  onDelete?: () => void
}

/**
 * Event summary card displaying event details and category progress
 * Used in UserDashboard to show user's events
 */
export function EventCard({ event, onEdit, onBrowseVendors, onDelete }: EventCardProps) {
  const { data: budgetItems = [] } = useEventBudgetItems(event.id)
  const addBudgetItem = useAddBudgetItem()

  const [assignDialogOpen, setAssignDialogOpen] = useState(false)
  const [assignCategory, setAssignCategory] = useState<string | undefined>()
  // Format date nicely (e.g., "March 15, 2026")
  const formattedDate = event.event_date
    ? format(parseISO(event.event_date), 'MMMM d, yyyy')
    : 'Date not set'

  // Format budget with dollar sign and commas
  const formattedBudget = event.budget
    ? `$${event.budget.toLocaleString()}`
    : null

  // Compute committed amount from non-cancelled budget items
  const committedAmount = budgetItems
    .filter((item) => item.status !== 'cancelled')
    .reduce((sum, item) => sum + (item.agreed_price ?? 0), 0)

  // Budget progress: show committed vs total when there are committed amounts
  const budgetPercentage =
    event.budget && committedAmount > 0
      ? Math.min(100, (committedAmount / event.budget) * 100)
      : 0

  // Safely access categories arrays (may be null from DB)
  const categoriesNeeded = event.categories_needed || []
  const categoriesCovered = event.categories_covered || []

  // Calculate pending categories for browse link
  const pendingCategories = categoriesNeeded.filter(
    (cat) => !categoriesCovered.includes(cat)
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
          {onDelete && (
            <Button
              variant="outline"
              size="sm"
              onClick={onDelete}
              aria-label="Delete event"
              className="text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
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
            {committedAmount > 0 ? (
              <div className="flex flex-col gap-0.5">
                <span>
                  <span className="font-medium text-blue-700">
                    ${committedAmount.toLocaleString()}
                  </span>
                  {' / '}
                  {formattedBudget}
                </span>
                <div className="w-24 h-1.5 bg-[#E5E5E5] rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full bg-blue-500 transition-all"
                    style={{ width: `${budgetPercentage}%` }}
                  />
                </div>
              </div>
            ) : (
              <span>{formattedBudget}</span>
            )}
          </div>
        )}
      </div>

      {/* Category Progress Section */}
      {categoriesNeeded.length > 0 ? (
        <div className="pt-4 border-t border-[#E5E5E5]">
          <h4 className="text-sm font-medium text-[#1A1A1A] mb-3">
            Category Coverage
          </h4>
          <CategoryProgress
            needed={categoriesNeeded}
            covered={categoriesCovered}
            eventDate={event.event_date}
            budgetItems={budgetItems}
            onAssignCategory={(cat) => {
              setAssignCategory(cat)
              setAssignDialogOpen(true)
            }}
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

      <AddBudgetItemDialog
        open={assignDialogOpen}
        onOpenChange={setAssignDialogOpen}
        categoriesNeeded={categoriesNeeded}
        defaultCategory={assignCategory}
        onSubmit={(item) => {
          addBudgetItem.mutate({
            event_id: event.id,
            ...item,
          })
        }}
      />
    </div>
  )
}

export default EventCard

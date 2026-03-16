import { useState } from 'react'
import { useParams, Link } from 'react-router-dom'
import { format, parseISO } from 'date-fns'
import { ArrowLeft, Calendar, MapPin, Users, Pencil } from 'lucide-react'
import { Button } from '../components/ui/button'
import { useEvent } from '../hooks/useEvents'
import {
  useEventBudgetItems,
  useAddBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
} from '../hooks/useEventBudgetItems'
import { BudgetSummaryBar } from '../components/budget/BudgetSummaryBar'
import { BudgetBreakdownTable } from '../components/budget/BudgetBreakdownTable'
import { AddBudgetItemDialog } from '../components/budget/AddBudgetItemDialog'
import type { BudgetItemUpdate } from '../hooks/useEventBudgetItems'

export default function EventDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [addDialogOpen, setAddDialogOpen] = useState(false)

  const { data: event, isLoading: eventLoading, error: eventError } = useEvent(id)
  const { data: budgetItems = [], isLoading: itemsLoading } = useEventBudgetItems(id)

  const addBudgetItem = useAddBudgetItem()
  const updateBudgetItem = useUpdateBudgetItem()
  const deleteBudgetItem = useDeleteBudgetItem()

  if (eventLoading || itemsLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center">
        <p className="text-[#4A4A4A] text-sm">Loading event…</p>
      </div>
    )
  }

  if (eventError || !event) {
    return (
      <div className="min-h-screen bg-[#F9F8F4] flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-[#1A1A1A] font-medium">Event not found</p>
          <Link to="/dashboard" className="text-sm text-[#0F4C5C] hover:underline">
            Back to dashboard
          </Link>
        </div>
      </div>
    )
  }

  // Computed budget values
  const committedAmount = budgetItems
    .filter((item) => item.status !== 'cancelled')
    .reduce((sum, item) => sum + (item.agreed_price ?? 0), 0)

  const bookedCount = new Set(
    budgetItems
      .filter((item) => item.status !== 'cancelled')
      .map((item) => item.category)
  ).size

  const formattedDate = event.event_date
    ? format(parseISO(event.event_date), 'MMMM d, yyyy')
    : 'Date not set'

  // Handlers wired to mutations
  const handleUpdateItem = (itemId: string, updates: BudgetItemUpdate) => {
    updateBudgetItem.mutate({ id: itemId, eventId: event.id, updates })
  }

  const handleDeleteItem = (itemId: string) => {
    deleteBudgetItem.mutate({ id: itemId, eventId: event.id })
  }

  const handleAddItem = (item: {
    category: string
    label: string
    agreed_price?: number
    price_notes?: string
  }) => {
    addBudgetItem.mutate({
      event_id: event.id,
      category: item.category,
      label: item.label,
      agreed_price: item.agreed_price,
      price_notes: item.price_notes,
      status: 'estimated',
    })
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8">

        {/* Back link */}
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#0F4C5C] hover:text-[#0F4C5C]/80 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to dashboard
        </Link>

        {/* Event Header */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
          <div className="space-y-1">
            <h1
              className="text-3xl font-bold text-[#1A1A1A]"
              style={{ fontFamily: 'Playfair Display, serif' }}
            >
              {event.event_name}
            </h1>
            <div className="flex flex-wrap items-center gap-4 text-sm text-[#4A4A4A] mt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-[#888888]" />
                <span>{formattedDate}</span>
              </div>
              {event.location && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-[#888888]" />
                  <span>{event.location}</span>
                </div>
              )}
              {event.guest_count && (
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4 text-[#888888]" />
                  <span>{event.guest_count} guests</span>
                </div>
              )}
            </div>
          </div>

          <Button
            variant="outline"
            size="sm"
            className="btn-ghost self-start"
            asChild
          >
            <Link to={`/events/create?edit=${event.id}`}>
              <Pencil className="w-4 h-4 mr-1.5" />
              Edit Event
            </Link>
          </Button>
        </div>

        {/* Budget Summary */}
        <BudgetSummaryBar
          totalBudget={event.budget}
          committedAmount={committedAmount}
          bookedCount={bookedCount}
          totalCategories={event.categories_needed.length}
        />

        {/* Budget Breakdown Table */}
        <BudgetBreakdownTable
          budgetItems={budgetItems}
          categoriesNeeded={event.categories_needed}
          onUpdateItem={handleUpdateItem}
          onDeleteItem={handleDeleteItem}
          onAddItem={() => setAddDialogOpen(true)}
        />

        {/* Add Budget Item Dialog */}
        <AddBudgetItemDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          categoriesNeeded={event.categories_needed}
          onSubmit={handleAddItem}
        />
      </div>
    </div>
  )
}

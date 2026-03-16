import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Navbar from '../components/Navbar';
import { BudgetSummaryBar } from '../components/budget/BudgetSummaryBar';
import { BudgetBreakdownTable } from '../components/budget/BudgetBreakdownTable';
import { AddBudgetItemDialog } from '../components/budget/AddBudgetItemDialog';
import { useAuth } from '../hooks/useAuth';
import { useEvents, type Event } from '../hooks/useEvents';
import {
  useEventBudgetItems,
  useAddBudgetItem,
  useUpdateBudgetItem,
  useDeleteBudgetItem,
  type BudgetItemUpdate,
} from '../hooks/useEventBudgetItems';

// ─── EventBudgetSection ────────────────────────────────────────────────────────

interface EventBudgetSectionProps {
  event: Event;
}

function EventBudgetSection({ event }: EventBudgetSectionProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);

  const { data: budgetItems = [] } = useEventBudgetItems(event.id);
  const addBudgetItem = useAddBudgetItem();
  const updateBudgetItem = useUpdateBudgetItem();
  const deleteBudgetItem = useDeleteBudgetItem();

  // Committed = sum of agreed/paid items
  const committedAmount = budgetItems
    .filter((item) => item.status === 'agreed' || item.status === 'paid')
    .reduce((sum, item) => sum + (item.agreed_price ?? 0), 0);

  // Booked = categories with a non-cancelled item
  const bookedCategories = new Set<string>();
  for (const item of budgetItems) {
    if (item.status !== 'cancelled') {
      bookedCategories.add(item.category);
    }
  }
  const bookedCount = bookedCategories.size;
  const totalCategories = event.categories_needed?.length ?? 0;

  const handleUpdateItem = (id: string, updates: BudgetItemUpdate) => {
    updateBudgetItem.mutate({ id, eventId: event.id, updates });
  };

  const handleDeleteItem = (id: string) => {
    deleteBudgetItem.mutate({ id, eventId: event.id });
  };

  const handleAddItem = (item: {
    category: string;
    label: string;
    agreed_price?: number;
    price_notes?: string;
  }) => {
    addBudgetItem.mutate({
      event_id: event.id,
      category: item.category,
      label: item.label,
      agreed_price: item.agreed_price,
      price_notes: item.price_notes,
      status: item.agreed_price !== undefined ? 'agreed' : 'estimated',
    });
  };

  return (
    <div className="space-y-4 pt-4">
      <BudgetSummaryBar
        totalBudget={event.budget}
        committedAmount={committedAmount}
        bookedCount={bookedCount}
        totalCategories={totalCategories}
      />
      <BudgetBreakdownTable
        budgetItems={budgetItems}
        categoriesNeeded={event.categories_needed ?? []}
        onUpdateItem={handleUpdateItem}
        onDeleteItem={handleDeleteItem}
        onAddItem={() => setAddDialogOpen(true)}
      />
      <AddBudgetItemDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        categoriesNeeded={event.categories_needed ?? []}
        onSubmit={handleAddItem}
      />
    </div>
  );
}

// ─── CollapsibleEventRow ───────────────────────────────────────────────────────

interface CollapsibleEventRowProps {
  event: Event;
  isExpanded: boolean;
  onToggle: () => void;
}

function CollapsibleEventRow({ event, isExpanded, onToggle }: CollapsibleEventRowProps) {
  // Quick summary numbers for the header (read from items inside EventBudgetSection,
  // but we keep a lightweight duplicate query here for the header display only)
  const { data: budgetItems = [] } = useEventBudgetItems(event.id);

  const committedAmount = budgetItems
    .filter((item) => item.status === 'agreed' || item.status === 'paid')
    .reduce((sum, item) => sum + (item.agreed_price ?? 0), 0);

  const totalBudget = event.budget;

  const formattedDate = event.event_date
    ? format(parseISO(event.event_date), 'MMMM d, yyyy')
    : 'Date TBD';

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      {/* Header — always visible, clickable */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between px-6 py-4 hover:bg-[#F9F8F4] transition-colors text-left"
        aria-expanded={isExpanded}
      >
        <div className="flex items-center gap-3 min-w-0">
          <span className="flex-shrink-0 text-[#0F4C5C]">
            {isExpanded ? (
              <ChevronDown className="h-5 w-5" />
            ) : (
              <ChevronRight className="h-5 w-5" />
            )}
          </span>
          <div className="min-w-0">
            <p className="font-bold text-[#1A1A1A] text-base truncate">{event.event_name}</p>
            <p className="text-sm text-[#4A4A4A]">{formattedDate}</p>
          </div>
        </div>
        <div className="flex-shrink-0 ml-4 text-sm font-medium text-[#4A4A4A]">
          {totalBudget !== null ? (
            <span>
              <span className="text-[#0F4C5C] font-semibold">
                ${committedAmount.toLocaleString()}
              </span>
              {' / '}
              <span>${totalBudget.toLocaleString()}</span>
            </span>
          ) : (
            <span className="text-[#4A4A4A]">
              <span className="text-[#0F4C5C] font-semibold">
                ${committedAmount.toLocaleString()}
              </span>
              {' committed'}
            </span>
          )}
        </div>
      </button>

      {/* Expanded content */}
      {isExpanded && (
        <div className="px-6 pb-6 border-t border-gray-100">
          <EventBudgetSection event={event} />
        </div>
      )}
    </div>
  );
}

// ─── BudgetPage ────────────────────────────────────────────────────────────────

export default function BudgetPage() {
  const { user, isAuthenticated, loading } = useAuth();
  const { data: events = [], isLoading: eventsLoading } = useEvents(user?.id);

  // Track which events are expanded (Set of event IDs)
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());

  // Initialize expanded state after events load
  useEffect(() => {
    if (events.length === 0) return;
    if (events.length === 1) {
      setExpandedEvents(new Set([events[0].id]));
    } else {
      setExpandedEvents(new Set([events[0].id]));
    }
  // Only run once when events first load (go from 0 → N)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [events.length > 0]);

  const toggleEvent = (eventId: string) => {
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) {
        next.delete(eventId);
      } else {
        next.add(eventId);
      }
      return next;
    });
  };

  // ── Loading state ──
  if (loading || eventsLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-3">
            <div className="w-8 h-8 border-4 border-[#0F4C5C] border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-[#4A4A4A]">Loading budgets…</p>
          </div>
        </div>
      </div>
    );
  }

  // ── Not logged in ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center space-y-4">
            <h2 className="text-2xl font-semibold text-[#1A1A1A]">
              Log in to manage your event budgets
            </h2>
            <p className="text-[#4A4A4A]">
              Track spending and keep your Arangetram planning on budget.
            </p>
            <Link
              to="/login"
              className="inline-block mt-2 rounded-full bg-[#0F4C5C] px-8 py-3 text-sm font-semibold text-white hover:bg-[#093642] transition-colors"
            >
              Log In
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // ── No events ──
  if (events.length === 0) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h1 className="text-3xl font-bold text-[#1A1A1A] mb-8">Budget</h1>
          <div className="flex items-center justify-center min-h-[40vh]">
            <div className="text-center space-y-4">
              <h2 className="text-xl font-semibold text-[#1A1A1A]">No events yet</h2>
              <p className="text-[#4A4A4A]">
                Create your first event to start tracking your budget.
              </p>
              <Link
                to="/events/create"
                className="inline-block mt-2 rounded-full bg-[#0F4C5C] px-8 py-3 text-sm font-semibold text-white hover:bg-[#093642] transition-colors"
              >
                Plan Your Event
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ── Events exist ──
  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2">Budget</h1>
        <p className="text-[#4A4A4A] mb-8">
          Track and manage your budget across all events.
        </p>

        <div className="space-y-4">
          {events.map((event) => (
            <CollapsibleEventRow
              key={event.id}
              event={event}
              isExpanded={expandedEvents.has(event.id)}
              onToggle={() => toggleEvent(event.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import {
  Building2,
  UtensilsCrossed,
  Camera,
  Video,
  Palette,
  Music,
  Mic2,
  Sparkles,
  Mail,
  Crown,
  Gift,
  Trash2,
  Plus,
  LucideProps,
} from 'lucide-react';
import { Card, CardContent } from '../ui/card';
import { getCategoryByValue } from '../../lib/vendor-categories';
import type { BudgetItem, BudgetItemUpdate } from '../../hooks/useEventBudgetItems';

// Icon map for category icon names from vendor-categories
const ICON_MAP: Record<string, React.ComponentType<LucideProps>> = {
  Building2,
  UtensilsCrossed,
  Camera,
  Video,
  Palette,
  Music,
  Mic2,
  Sparkles,
  Mail,
  Crown,
  Gift,
};

interface BudgetBreakdownTableProps {
  budgetItems: BudgetItem[];
  categoriesNeeded: string[];
  onUpdateItem: (id: string, updates: BudgetItemUpdate) => void;
  onDeleteItem: (id: string) => void;
  onAddItem: () => void;
}

// Status badge styling
function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    estimated: 'bg-amber-100 text-amber-800 border border-amber-300',
    agreed: 'bg-green-100 text-green-800 border border-green-300',
    paid: 'bg-blue-100 text-blue-800 border border-blue-300',
    cancelled: 'bg-red-100 text-red-800 border border-red-300',
    open: 'bg-gray-100 text-gray-700 border border-gray-300',
  };
  const label: Record<string, string> = {
    estimated: 'Estimated',
    agreed: 'Agreed',
    paid: 'Paid',
    cancelled: 'Cancelled',
    open: 'Open',
  };
  const key = status.toLowerCase();
  return (
    <span
      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold ${
        styles[key] ?? styles.open
      }`}
    >
      {label[key] ?? status}
    </span>
  );
}

// Inline editable cell — shows value or input on click
function EditableCell({
  value,
  type,
  onSave,
  displayValue,
  placeholder,
}: {
  value: string;
  type: 'text' | 'number';
  onSave: (val: string) => void;
  displayValue: string;
  placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  const save = () => {
    setEditing(false);
    onSave(draft);
  };

  const cancel = () => {
    setEditing(false);
    setDraft(value);
  };

  if (editing) {
    return (
      <input
        autoFocus
        type={type}
        value={draft}
        placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={save}
        onKeyDown={(e) => {
          if (e.key === 'Enter') save();
          if (e.key === 'Escape') cancel();
        }}
        className="w-full rounded border border-input bg-background px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-ring"
      />
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onClick={startEdit}
      onKeyDown={(e) => e.key === 'Enter' && startEdit()}
      className="cursor-pointer rounded px-1 py-0.5 hover:bg-accent hover:text-accent-foreground text-sm transition-colors"
      title="Click to edit"
    >
      {displayValue || <span className="text-muted-foreground italic">{placeholder ?? '—'}</span>}
    </span>
  );
}

// Category label with icon — high contrast dark text on colored pill
function CategoryCell({ category }: { category: string }) {
  const cat = getCategoryByValue(category);
  if (!cat) {
    return <span className="text-sm font-medium text-foreground">{category}</span>;
  }
  const IconComponent = ICON_MAP[cat.icon];
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-800 px-2.5 py-1 text-xs font-semibold text-white">
      {IconComponent && <IconComponent className="h-3.5 w-3.5 flex-shrink-0" />}
      {cat.label}
    </span>
  );
}

export function BudgetBreakdownTable({
  budgetItems,
  categoriesNeeded,
  onUpdateItem,
  onDeleteItem,
  onAddItem,
}: BudgetBreakdownTableProps) {
  // Active (non-cancelled) budget items by category
  const activeByCategory = new Map<string, BudgetItem>();
  for (const item of budgetItems) {
    if (item.status !== 'cancelled') {
      activeByCategory.set(item.category, item);
    }
  }

  // Unbooked: categories needed but without an active budget item
  const unbookedCategories = categoriesNeeded.filter(
    (cat) => !activeByCategory.has(cat)
  );

  // All booked items (including cancelled) to display
  const bookedItems = budgetItems;

  const handlePriceSave = (item: BudgetItem, val: string) => {
    const parsed = parseFloat(val);
    onUpdateItem(item.id, {
      agreed_price: isNaN(parsed) ? null : parsed,
    });
  };

  const handleNotesSave = (item: BudgetItem, val: string) => {
    onUpdateItem(item.id, {
      price_notes: val.trim() || null,
    });
  };

  return (
    <Card>
      <CardContent className="p-0">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b">
          <h3 className="font-semibold text-base">Category Breakdown</h3>
          <button
            onClick={onAddItem}
            className="inline-flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </button>
        </div>

        {/* Column headers */}
        <div className="grid grid-cols-[2fr_2fr_1.5fr_2fr_1fr_auto] gap-3 px-6 py-2 border-b bg-muted/50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          <span>Category</span>
          <span>Vendor / Label</span>
          <span>Price</span>
          <span>Notes</span>
          <span>Status</span>
          <span className="w-8" />
        </div>

        {/* Booked rows */}
        {bookedItems.length === 0 && unbookedCategories.length === 0 && (
          <div className="px-6 py-8 text-center text-sm text-muted-foreground">
            No budget items yet. Add your first item above.
          </div>
        )}

        {bookedItems.map((item) => {
          const isCancelled = item.status === 'cancelled';
          return (
            <div
              key={item.id}
              className={`grid grid-cols-[2fr_2fr_1.5fr_2fr_1fr_auto] gap-3 items-center px-6 py-3 border-b last:border-b-0 transition-opacity ${
                isCancelled ? 'opacity-50' : ''
              }`}
            >
              {/* Category */}
              <div>
                <CategoryCell category={item.category} />
              </div>

              {/* Vendor / Label */}
              <div className="text-sm font-medium text-foreground">
                {item.label ?? <span className="text-muted-foreground italic">—</span>}
              </div>

              {/* Price — editable */}
              <div>
                <EditableCell
                  value={item.agreed_price != null ? String(item.agreed_price) : ''}
                  type="number"
                  placeholder="Add price"
                  displayValue={
                    item.agreed_price != null
                      ? `$${item.agreed_price.toLocaleString()}`
                      : ''
                  }
                  onSave={(val) => handlePriceSave(item, val)}
                />
              </div>

              {/* Notes — editable */}
              <div>
                <EditableCell
                  value={item.price_notes ?? ''}
                  type="text"
                  placeholder="Add notes"
                  displayValue={item.price_notes ?? ''}
                  onSave={(val) => handleNotesSave(item, val)}
                />
              </div>

              {/* Status */}
              <div>
                <StatusBadge status={item.status} />
              </div>

              {/* Delete */}
              <div className="w-8 flex justify-center">
                <button
                  onClick={() => onDeleteItem(item.id)}
                  className="rounded p-1 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  title="Delete item"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}

        {/* Unbooked rows */}
        {unbookedCategories.map((cat) => (
          <div
            key={`unbooked-${cat}`}
            className="grid grid-cols-[2fr_2fr_1.5fr_2fr_1fr_auto] gap-3 items-center px-6 py-3 border-b last:border-b-0 opacity-50"
          >
            <div>
              <CategoryCell category={cat} />
            </div>
            <div className="text-sm text-muted-foreground italic">No vendor yet</div>
            <div className="text-sm text-muted-foreground">—</div>
            <div className="text-sm text-muted-foreground">—</div>
            <div>
              <StatusBadge status="open" />
            </div>
            <div className="w-8" />
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

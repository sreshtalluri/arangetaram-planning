import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
import { Label } from '../ui/label';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';
import { getCategoryByValue } from '../../lib/vendor-categories';

// The .jsx UI components don't carry full TypeScript prop types.
// Cast them here so TSX can use them as standard React components.
// Double-cast (as unknown as T) is needed because the .jsx source types don't overlap cleanly.
type AnyComponent<P = Record<string, unknown>> = React.ComponentType<P>;
const DDialog = Dialog as unknown as AnyComponent<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }>;
const DDialogContent = DialogContent as unknown as AnyComponent<{ className?: string; children: React.ReactNode }>;
const DDialogHeader = DialogHeader as unknown as AnyComponent<{ children: React.ReactNode }>;
const DDialogTitle = DialogTitle as unknown as AnyComponent<{ children: React.ReactNode }>;
const DDialogFooter = DialogFooter as unknown as AnyComponent<{ children: React.ReactNode }>;
const DSelect = Select as unknown as AnyComponent<{ value: string; onValueChange: (val: string) => void; children: React.ReactNode }>;
const DSelectTrigger = SelectTrigger as unknown as AnyComponent<{ id?: string; children: React.ReactNode }>;
const DSelectValue = SelectValue as unknown as AnyComponent<{ placeholder?: string }>;
const DSelectContent = SelectContent as unknown as AnyComponent<{ children: React.ReactNode }>;
const DSelectItem = SelectItem as unknown as AnyComponent<{ value: string; children: React.ReactNode }>;

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriesNeeded: string[];
  onSubmit: (item: {
    category: string;
    label: string;
    agreed_price?: number;
    price_notes?: string;
  }) => void;
}

const EMPTY_FORM = {
  category: '',
  label: '',
  price: '',
  notes: '',
};

export function AddBudgetItemDialog({
  open,
  onOpenChange,
  categoriesNeeded,
  onSubmit,
}: AddBudgetItemDialogProps) {
  const [form, setForm] = useState(EMPTY_FORM);

  // Reset form whenever the dialog opens or closes
  useEffect(() => {
    if (!open) {
      setForm(EMPTY_FORM);
    }
  }, [open]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category || !form.label.trim()) return;

    const parsedPrice = parseInt(form.price, 10);

    onSubmit({
      category: form.category,
      label: form.label.trim(),
      agreed_price: !isNaN(parsedPrice) && form.price !== '' ? parsedPrice : undefined,
      price_notes: form.notes.trim() || undefined,
    });

    onOpenChange(false);
  };

  const isValid = form.category !== '' && form.label.trim() !== '';

  return (
    <DDialog open={open} onOpenChange={onOpenChange}>
      <DDialogContent className="sm:max-w-md">
        <DDialogHeader>
          <DDialogTitle>Add Budget Item</DDialogTitle>
        </DDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="add-item-category">Category</Label>
            <DSelect
              value={form.category}
              onValueChange={(val: string) => setForm((f) => ({ ...f, category: val }))}
            >
              <DSelectTrigger id="add-item-category">
                <DSelectValue placeholder="Select a category" />
              </DSelectTrigger>
              <DSelectContent>
                {categoriesNeeded.map((cat) => {
                  const info = getCategoryByValue(cat);
                  return (
                    <DSelectItem key={cat} value={cat}>
                      {info ? info.label : cat}
                    </DSelectItem>
                  );
                })}
              </DSelectContent>
            </DSelect>
          </div>

          {/* Label */}
          <div className="space-y-1.5">
            <Label htmlFor="add-item-label">Vendor / Description</Label>
            <Input
              id="add-item-label"
              type="text"
              placeholder="e.g. Rajan Photography Studio"
              value={form.label}
              onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
            />
          </div>

          {/* Price */}
          <div className="space-y-1.5">
            <Label htmlFor="add-item-price">Price</Label>
            <div className="relative">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                $
              </span>
              <Input
                id="add-item-price"
                type="number"
                min="0"
                step="1"
                placeholder="0"
                value={form.price}
                onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))}
                className="pl-7"
              />
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-1.5">
            <Label htmlFor="add-item-notes">Notes</Label>
            <Textarea
              id="add-item-notes"
              placeholder="Optional notes about this budget item"
              value={form.notes}
              onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
              rows={3}
            />
          </div>

          <DDialogFooter>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              className="inline-flex items-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!isValid}
              className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50 transition-colors"
            >
              Add Item
            </button>
          </DDialogFooter>
        </form>
      </DDialogContent>
    </DDialog>
  );
}

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
import { useVendors, PublicVendor } from '../../hooks/useVendors';

// The .jsx UI components don't carry full TypeScript prop types.
// Cast them here so TSX can use them as standard React components.
// Double-cast (as unknown as T) is needed because the .jsx source types don't overlap cleanly.
type AnyComponent<P = Record<string, unknown>> = React.ComponentType<P>;
const DDialog = Dialog as unknown as AnyComponent<{ open: boolean; onOpenChange: (open: boolean) => void; children: React.ReactNode }>;
const DDialogContent = DialogContent as unknown as AnyComponent<{ className?: string; children: React.ReactNode }>;
const DDialogHeader = DialogHeader as unknown as AnyComponent<{ children: React.ReactNode }>;
const DDialogTitle = DialogTitle as unknown as AnyComponent<{ children: React.ReactNode }>;
const DDialogFooter = DialogFooter as unknown as AnyComponent<{ children: React.ReactNode }>;
const DSelect = Select as unknown as AnyComponent<{ value: string; onValueChange: (val: string) => void; disabled?: boolean; children: React.ReactNode }>;
const DSelectTrigger = SelectTrigger as unknown as AnyComponent<{ id?: string; children: React.ReactNode }>;
const DSelectValue = SelectValue as unknown as AnyComponent<{ placeholder?: string }>;
const DSelectContent = SelectContent as unknown as AnyComponent<{ children: React.ReactNode }>;
const DSelectItem = SelectItem as unknown as AnyComponent<{ value: string; children: React.ReactNode }>;

type Mode = 'platform' | 'manual';

interface AddBudgetItemDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  categoriesNeeded: string[];
  defaultCategory?: string;
  onSubmit: (item: {
    category: string;
    label: string;
    agreed_price?: number;
    price_notes?: string;
    vendor_id?: string;
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
  defaultCategory,
  onSubmit,
}: AddBudgetItemDialogProps) {
  const [mode, setMode] = useState<Mode>('platform');
  const [form, setForm] = useState(EMPTY_FORM);
  const [vendorSearch, setVendorSearch] = useState('');
  const [selectedVendor, setSelectedVendor] = useState<PublicVendor | null>(null);

  // Resolve the active category: defaultCategory takes precedence
  const activeCategory = defaultCategory ?? form.category;

  // Vendor search — only runs when in platform mode and a category is selected
  const { data: vendors = [], isLoading: vendorsLoading } = useVendors(
    mode === 'platform' && activeCategory
      ? { category: activeCategory, search: vendorSearch || undefined }
      : {}
  );

  // Reset form state when dialog closes
  useEffect(() => {
    if (!open) {
      setMode('platform');
      setForm(EMPTY_FORM);
      setVendorSearch('');
      setSelectedVendor(null);
    }
  }, [open]);

  // When category changes in platform mode, clear selected vendor and search
  useEffect(() => {
    setSelectedVendor(null);
    setVendorSearch('');
  }, [activeCategory]);

  const handleSelectVendor = (vendor: PublicVendor) => {
    setSelectedVendor(vendor);
    setForm((f) => ({ ...f, label: vendor.business_name }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const category = activeCategory;
    const label = form.label.trim();
    if (!category || !label) return;

    const parsedPrice = parseInt(form.price, 10);

    onSubmit({
      category,
      label,
      agreed_price: !isNaN(parsedPrice) && form.price !== '' ? parsedPrice : undefined,
      price_notes: form.notes.trim() || undefined,
      vendor_id: mode === 'platform' && selectedVendor ? selectedVendor.id : undefined,
    });

    onOpenChange(false);
  };

  const isValid = activeCategory !== '' && form.label.trim() !== '';

  return (
    <DDialog open={open} onOpenChange={onOpenChange}>
      <DDialogContent className="sm:max-w-lg">
        <DDialogHeader>
          <DDialogTitle>Add Budget Item</DDialogTitle>
        </DDialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode toggle */}
          <div className="flex rounded-md border border-input overflow-hidden text-sm">
            <button
              type="button"
              onClick={() => {
                setMode('platform');
                setSelectedVendor(null);
                setVendorSearch('');
              }}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === 'platform'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Platform Vendor
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('manual');
                setSelectedVendor(null);
              }}
              className={`flex-1 py-2 font-medium transition-colors ${
                mode === 'manual'
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-background text-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              Manual Entry
            </button>
          </div>

          {/* Category */}
          <div className="space-y-1.5">
            <Label htmlFor="add-item-category">Category</Label>
            {defaultCategory ? (
              <div className="flex h-9 w-full items-center rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground">
                {getCategoryByValue(defaultCategory)?.label ?? defaultCategory}
              </div>
            ) : (
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
            )}
          </div>

          {/* ── Platform Vendor mode ── */}
          {mode === 'platform' && (
            <>
              {activeCategory && (
                <>
                  {/* Vendor search input */}
                  <div className="space-y-1.5">
                    <Label htmlFor="vendor-search">Search Vendors</Label>
                    <Input
                      id="vendor-search"
                      type="text"
                      placeholder="Search by name…"
                      value={vendorSearch}
                      onChange={(e) => setVendorSearch(e.target.value)}
                    />
                  </div>

                  {/* Vendor list */}
                  <div className="space-y-1.5">
                    <Label>Select a Vendor</Label>
                    <div className="max-h-48 overflow-y-auto rounded-md border border-input divide-y divide-border">
                      {vendorsLoading ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          Loading vendors…
                        </p>
                      ) : vendors.length === 0 ? (
                        <p className="px-3 py-4 text-center text-sm text-muted-foreground">
                          No vendors found for this category.
                        </p>
                      ) : (
                        vendors.map((vendor) => (
                          <button
                            key={vendor.id}
                            type="button"
                            onClick={() => handleSelectVendor(vendor)}
                            className={`w-full px-3 py-2.5 text-left transition-colors ${
                              selectedVendor?.id === vendor.id
                                ? 'bg-primary/10 text-primary'
                                : 'hover:bg-accent hover:text-accent-foreground'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-medium text-sm">{vendor.business_name}</span>
                              <span className="shrink-0 text-xs text-muted-foreground">
                                {vendor.price_range}
                              </span>
                            </div>
                            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
                              <span>{vendor.price_estimate}</span>
                              {vendor.location && (
                                <>
                                  <span>·</span>
                                  <span>{vendor.location}</span>
                                </>
                              )}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </div>
                </>
              )}

              {/* Label (auto-filled from vendor, editable) */}
              <div className="space-y-1.5">
                <Label htmlFor="add-item-label">Label</Label>
                <Input
                  id="add-item-label"
                  type="text"
                  placeholder={selectedVendor ? selectedVendor.business_name : 'Select a vendor above'}
                  value={form.label}
                  onChange={(e) => setForm((f) => ({ ...f, label: e.target.value }))}
                />
              </div>
            </>
          )}

          {/* ── Manual Entry mode ── */}
          {mode === 'manual' && (
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
          )}

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
              rows={2}
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

import { format } from 'date-fns'
import { CalendarIcon, MapPin, X } from 'lucide-react'
import { VENDOR_CATEGORIES } from '../../lib/vendor-categories'
import { Button } from '../ui/button'
import { Slider } from '../ui/slider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Calendar } from '../ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '../ui/popover'
import { cn } from '../../lib/utils'

function FilterSection({ title, children }) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-[#4A4A4A]">{title}</label>
      {children}
    </div>
  )
}

const PRICE_RANGES = [
  { value: '', label: 'All Prices' },
  { value: '$', label: '$ Budget' },
  { value: '$$', label: '$$ Moderate' },
  { value: '$$$', label: '$$$ Premium' },
  { value: '$$$$', label: '$$$$ Luxury' },
]

export function FilterSidebar({ filters, setFilter, setLocationFilter, clearLocationFilter, clearFilters, hasActiveFilters }) {
  const selectedDate = filters.availableDate ? new Date(filters.availableDate + 'T00:00:00') : undefined

  return (
    <div className="sticky top-24 space-y-6 bg-white p-5 rounded-xl shadow-sm border border-[#E5E5E5]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-[#1A1A1A]">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-[#0F4C5C] hover:text-[#0F4C5C]/80 -mr-2"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection title="Category">
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => setFilter('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VENDOR_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection title="Location">
        <Select
          value={filters.location || 'all'}
          onValueChange={(value) => setFilter('location', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {METRO_AREAS.map((area) => (
              <SelectItem key={area.value} value={area.value}>
                {area.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range">
        <Select
          value={filters.priceRange || 'all'}
          onValueChange={(value) => setFilter('priceRange', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.value || 'all'} value={range.value || 'all'}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Available On Date Filter */}
      <FilterSection title="Available On">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal input-styled',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setFilter('availableDate', date ? format(date, 'yyyy-MM-dd') : '')
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {filters.availableDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilter('availableDate', '')}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </FilterSection>
    </div>
  )
}

// Mobile version of filters displayed in a Sheet
export function MobileFilters({ filters, setFilter, clearFilters, hasActiveFilters }) {
  const selectedDate = filters.availableDate ? new Date(filters.availableDate + 'T00:00:00') : undefined

  return (
    <div className="space-y-6 py-4">
      {/* Header */}
      <div className="flex items-center justify-between px-1">
        <h3 className="font-semibold text-[#1A1A1A] text-lg">Filters</h3>
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={clearFilters}
            className="text-[#0F4C5C] hover:text-[#0F4C5C]/80"
          >
            Clear all
          </Button>
        )}
      </div>

      {/* Category Filter */}
      <FilterSection title="Category">
        <Select
          value={filters.category || 'all'}
          onValueChange={(value) => setFilter('category', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {VENDOR_CATEGORIES.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Location Filter */}
      <FilterSection title="Location">
        <Select
          value={filters.location || 'all'}
          onValueChange={(value) => setFilter('location', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Locations" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Locations</SelectItem>
            {METRO_AREAS.map((area) => (
              <SelectItem key={area.value} value={area.value}>
                {area.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Price Range Filter */}
      <FilterSection title="Price Range">
        <Select
          value={filters.priceRange || 'all'}
          onValueChange={(value) => setFilter('priceRange', value === 'all' ? '' : value)}
        >
          <SelectTrigger className="w-full input-styled">
            <SelectValue placeholder="All Prices" />
          </SelectTrigger>
          <SelectContent>
            {PRICE_RANGES.map((range) => (
              <SelectItem key={range.value || 'all'} value={range.value || 'all'}>
                {range.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </FilterSection>

      {/* Available On Date Filter */}
      <FilterSection title="Available On">
        <div className="flex gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant="outline"
                className={cn(
                  'w-full justify-start text-left font-normal input-styled',
                  !selectedDate && 'text-muted-foreground'
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {selectedDate ? format(selectedDate, 'MMM d, yyyy') : 'Select date'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={selectedDate}
                onSelect={(date) => {
                  setFilter('availableDate', date ? format(date, 'yyyy-MM-dd') : '')
                }}
                disabled={(date) => date < new Date()}
                initialFocus
              />
            </PopoverContent>
          </Popover>
          {filters.availableDate && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setFilter('availableDate', '')}
              className="shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </FilterSection>
    </div>
  )
}

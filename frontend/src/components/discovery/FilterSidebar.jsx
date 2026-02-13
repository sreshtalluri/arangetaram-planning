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
        <div className="space-y-3">
          {filters.locationLat ? (
            <div className="flex items-center gap-2 bg-[#F9F8F4] rounded-lg px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-[#0F4C5C] shrink-0" />
              <span className="text-sm text-[#1A1A1A] truncate flex-1">
                {filters.location}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLocationFilter}
                className="h-6 w-6 p-0 shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault()
              const input = e.target.elements.locationSearch.value.trim()
              if (!input) return
              try {
                const res = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=place,postcode,address&country=US&limit=1`
                )
                const data = await res.json()
                if (data.features?.length > 0) {
                  const feature = data.features[0]
                  const [lng, lat] = feature.center
                  setLocationFilter(feature.place_name || input, lat, lng)
                }
              } catch (err) {
                console.error('Geocoding error:', err)
              }
            }}>
              <input
                name="locationSearch"
                type="text"
                placeholder="Search city or zip code..."
                className="w-full input-styled px-3 py-2 text-sm rounded-md border"
              />
            </form>
          )}
          {filters.locationLat && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>Radius</span>
                <span>{filters.radius} miles</span>
              </div>
              <Slider
                value={[parseInt(filters.radius) || 25]}
                onValueChange={([value]) => setFilter('radius', value.toString())}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>
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
export function MobileFilters({ filters, setFilter, setLocationFilter, clearLocationFilter, clearFilters, hasActiveFilters }) {
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
        <div className="space-y-3">
          {filters.locationLat ? (
            <div className="flex items-center gap-2 bg-[#F9F8F4] rounded-lg px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-[#0F4C5C] shrink-0" />
              <span className="text-sm text-[#1A1A1A] truncate flex-1">
                {filters.location}
              </span>
              <Button
                variant="ghost"
                size="sm"
                onClick={clearLocationFilter}
                className="h-6 w-6 p-0 shrink-0"
              >
                <X className="w-3 h-3" />
              </Button>
            </div>
          ) : (
            <form onSubmit={async (e) => {
              e.preventDefault()
              const input = e.target.elements.locationSearch.value.trim()
              if (!input) return
              try {
                const res = await fetch(
                  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=place,postcode,address&country=US&limit=1`
                )
                const data = await res.json()
                if (data.features?.length > 0) {
                  const feature = data.features[0]
                  const [lng, lat] = feature.center
                  setLocationFilter(feature.place_name || input, lat, lng)
                }
              } catch (err) {
                console.error('Geocoding error:', err)
              }
            }}>
              <input
                name="locationSearch"
                type="text"
                placeholder="Search city or zip code..."
                className="w-full input-styled px-3 py-2 text-sm rounded-md border"
              />
            </form>
          )}
          {filters.locationLat && (
            <div className="space-y-1">
              <div className="flex justify-between text-xs text-[#888888]">
                <span>Radius</span>
                <span>{filters.radius} miles</span>
              </div>
              <Slider
                value={[parseInt(filters.radius) || 25]}
                onValueChange={([value]) => setFilter('radius', value.toString())}
                min={5}
                max={100}
                step={5}
                className="w-full"
              />
            </div>
          )}
        </div>
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

# Calendar UI Polish Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Upgrade all calendar and date UIs to match the cultural luxury design system with branded colors, improved interactions (shift-click range selection), and consistent premium styling.

**Architecture:** Restyle the existing react-day-picker v8 base `Calendar` component with brand colors/typography, then update all consumers. Add shift-click range selection to the vendor AvailabilityCalendar. No new dependencies.

**Tech Stack:** React 19, react-day-picker v8, date-fns v4, Radix UI Popover, Tailwind CSS, Shadcn/UI

**Design doc:** `docs/plans/2026-02-13-calendar-ui-polish-design.md`

---

### Task 1: Restyle Base Calendar Component

**Files:**
- Modify: `frontend/src/components/ui/calendar.jsx`

**Context:** This is the Shadcn/UI `Calendar` wrapper around `DayPicker`. It defines all shared classNames. Every calendar in the app inherits from this. Currently uses default Shadcn slate styling with small `h-8 w-8` cells.

**Step 1: Replace calendar.jsx with branded version**

Replace the entire file content with:

```jsx
import * as React from "react"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { DayPicker } from "react-day-picker"

import { cn } from "@/lib/utils"
import { buttonVariants } from "@/components/ui/button"

function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  ...props
}) {
  return (
    <DayPicker
      showOutsideDays={showOutsideDays}
      className={cn("p-5", className)}
      classNames={{
        months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
        month: "space-y-4",
        caption: "flex justify-center pt-1 relative items-center",
        caption_label: "text-base font-semibold tracking-tight",
        nav: "space-x-1 flex items-center",
        nav_button: cn(
          buttonVariants({ variant: "outline" }),
          "h-8 w-8 bg-transparent p-0 text-[#4A4A4A] hover:text-[#C5A059] hover:border-[#C5A059] transition-colors duration-200"
        ),
        nav_button_previous: "absolute left-1",
        nav_button_next: "absolute right-1",
        table: "w-full border-collapse space-y-1",
        head_row: "flex",
        head_cell:
          "text-[#888888] rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wider",
        row: "flex w-full mt-2",
        cell: cn(
          "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:bg-[#800020]/10 [&:has([aria-selected].day-outside)]:bg-[#800020]/5 [&:has([aria-selected].day-range-end)]:rounded-r-md",
          props.mode === "range"
            ? "[&:has(>.day-range-end)]:rounded-r-md [&:has(>.day-range-start)]:rounded-l-md first:[&:has([aria-selected])]:rounded-l-md last:[&:has([aria-selected])]:rounded-r-md"
            : "[&:has([aria-selected])]:rounded-md"
        ),
        day: cn(
          buttonVariants({ variant: "ghost" }),
          "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#F9F8F4] hover:text-[#1A1A1A] transition-colors duration-200"
        ),
        day_range_start: "day-range-start",
        day_range_end: "day-range-end",
        day_selected:
          "bg-[#800020] text-white hover:bg-[#800020] hover:text-white focus:bg-[#800020] focus:text-white",
        day_today: "ring-2 ring-[#0F4C5C] ring-inset text-[#0F4C5C] font-medium",
        day_outside:
          "day-outside text-[#888888]/40 aria-selected:bg-[#800020]/5 aria-selected:text-[#888888]/60",
        day_disabled: "text-[#888888]/30",
        day_range_middle:
          "aria-selected:bg-[#800020]/10 aria-selected:text-[#800020]",
        day_hidden: "invisible",
        ...classNames,
      }}
      components={{
        IconLeft: ({ className, ...props }) => (
          <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
        ),
        IconRight: ({ className, ...props }) => (
          <ChevronRight className={cn("h-4 w-4", className)} {...props} />
        ),
      }}
      {...props} />
  );
}
Calendar.displayName = "Calendar"

export { Calendar }
```

Key changes from the original:
- `p-3` → `p-5` for generous padding
- `h-8 w-8` → `h-10 w-10` day cells
- `caption_label`: larger `text-base font-semibold tracking-tight` (inherits Playfair Display from global CSS `h1-h6` rule — but `caption_label` is a `div`, not a heading, so it won't inherit. This is fine — Manrope body font at semibold looks premium for month labels)
- `head_cell`: `w-10` to match new cell size, `text-[#888888]` muted, `uppercase tracking-wider`
- Nav buttons: gold hover `hover:text-[#C5A059] hover:border-[#C5A059]` with `transition-colors duration-200`
- `day`: `h-10 w-10`, hover `bg-[#F9F8F4]`, explicit `transition-colors duration-200`
- `day_selected`: Deep Crimson `bg-[#800020] text-white`
- `day_today`: Teal ring `ring-2 ring-[#0F4C5C] ring-inset` with no fill
- `cell` selected state: `bg-[#800020]/10` (crimson tint)
- `day_outside`: very low opacity `text-[#888888]/40`
- `day_disabled`: `text-[#888888]/30`

**Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/ui/calendar.jsx
git commit -m "style: restyle base Calendar with branded colors and larger cells"
```

---

### Task 2: Overhaul Vendor Availability Calendar — Visual Styling

**Files:**
- Modify: `frontend/src/components/vendor/AvailabilityCalendar.tsx`

**Context:** This is the main vendor calendar for blocking/unblocking dates. Currently uses raw `DayPicker` directly (not the Shadcn `Calendar` wrapper) with basic red/blue modifier classes, a flat legend, and a simple blocked-dates list. This task handles the visual restyling. Task 3 adds the shift-click range selection.

**Step 1: Rewrite AvailabilityCalendar.tsx with branded styling, grouped blocked dates, and inline legend**

Replace the entire file with:

```tsx
import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isSameDay, isAfter, startOfToday, eachDayOfInterval, parseISO } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBlockedDates, useBlockDates, useUnblockDate } from '@/hooks/useAvailability'
import { Loader2, X, ChevronLeft, ChevronRight, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/utils'
import { buttonVariants } from '@/components/ui/button'

interface AvailabilityCalendarProps {
  vendorId: string
}

export function AvailabilityCalendar({ vendorId }: AvailabilityCalendarProps) {
  const { blockedDates, availability, isLoading } = useBlockedDates(vendorId)
  const blockMutation = useBlockDates()
  const unblockMutation = useUnblockDate()

  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [lastClickedDate, setLastClickedDate] = useState<Date | null>(null)
  const [note, setNote] = useState('')
  const [showAllBlocked, setShowAllBlocked] = useState(false)
  const today = startOfToday()

  const isDateBlocked = (date: Date) =>
    blockedDates.some(blocked => isSameDay(blocked, date))

  const handleDayClick = (day: Date, modifiers: Record<string, boolean>, e: React.MouseEvent) => {
    if (!isAfter(day, today) && !isSameDay(day, today)) return

    if (isDateBlocked(day)) {
      handleUnblock(day)
      return
    }

    // Shift-click range selection
    if (e.shiftKey && lastClickedDate && !isSameDay(day, lastClickedDate)) {
      const start = day < lastClickedDate ? day : lastClickedDate
      const end = day < lastClickedDate ? lastClickedDate : day
      const range = eachDayOfInterval({ start, end }).filter(
        d => (isAfter(d, today) || isSameDay(d, today)) && !isDateBlocked(d)
      )
      setSelectedDates(prev => {
        const combined = [...prev]
        for (const d of range) {
          if (!combined.some(existing => isSameDay(existing, d))) {
            combined.push(d)
          }
        }
        return combined
      })
      setLastClickedDate(day)
      return
    }

    // Single click toggle
    setSelectedDates(prev => {
      const exists = prev.some(d => isSameDay(d, day))
      if (exists) {
        return prev.filter(d => !isSameDay(d, day))
      }
      return [...prev, day]
    })
    setLastClickedDate(day)
  }

  const handleUnblock = async (date: Date) => {
    try {
      await unblockMutation.mutateAsync({ vendorId, date })
      toast.success(`${format(date, 'MMM d')} is now available`)
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  const handleBlockSelected = async () => {
    if (selectedDates.length === 0) return

    try {
      await blockMutation.mutateAsync({
        vendorId,
        dates: selectedDates,
        note: note || undefined,
      })
      toast.success(`${selectedDates.length} date(s) marked as booked`)
      setSelectedDates([])
      setLastClickedDate(null)
      setNote('')
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  const handleClearSelection = () => {
    setSelectedDates([])
    setLastClickedDate(null)
    setNote('')
  }

  // Group blocked dates by month for display
  const groupedBlocked = (availability || []).reduce<Record<string, typeof availability>>((acc, item) => {
    const monthKey = format(parseISO(item.blocked_date), 'MMMM yyyy')
    if (!acc[monthKey]) acc[monthKey] = []
    acc[monthKey]!.push(item)
    return acc
  }, {})

  const blockedEntries = Object.entries(groupedBlocked)
  const visibleBlocked = showAllBlocked ? blockedEntries : blockedEntries.slice(0, 3)

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Inline legend */}
      <div className="flex items-center gap-3 flex-wrap">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F8F4] border border-[#E5E5E5] text-xs font-medium text-[#4A4A4A]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#F9F8F4] border border-[#E5E5E5]" />
          Available
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#800020]/10 border border-[#800020]/20 text-xs font-medium text-[#800020]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#800020]/15" />
          Booked
        </div>
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C5C]/10 border border-[#0F4C5C]/20 text-xs font-medium text-[#0F4C5C]">
          <div className="w-2.5 h-2.5 rounded-full bg-[#0F4C5C]/15" />
          Selected
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6">
        {/* Calendar */}
        <div className="flex-1">
          <DayPicker
            mode="multiple"
            selected={selectedDates}
            onDayClick={handleDayClick}
            disabled={{ before: today }}
            modifiers={{
              booked: blockedDates,
              selected: selectedDates,
            }}
            modifiersClassNames={{
              booked: 'bg-[#800020]/15 text-[#800020] font-medium',
              selected: 'bg-[#0F4C5C]/15 text-[#0F4C5C] ring-2 ring-[#0F4C5C]',
            }}
            className="border border-[#E5E5E5] rounded-xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]"
            classNames={{
              months: "flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0",
              month: "space-y-4",
              caption: "flex justify-center pt-1 relative items-center",
              caption_label: "text-base font-semibold tracking-tight",
              nav: "space-x-1 flex items-center",
              nav_button: cn(
                buttonVariants({ variant: "outline" }),
                "h-8 w-8 bg-transparent p-0 text-[#4A4A4A] hover:text-[#C5A059] hover:border-[#C5A059] transition-colors duration-200"
              ),
              nav_button_previous: "absolute left-1",
              nav_button_next: "absolute right-1",
              table: "w-full border-collapse space-y-1",
              head_row: "flex",
              head_cell: "text-[#888888] rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wider",
              row: "flex w-full mt-2",
              cell: "relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md",
              day: cn(
                buttonVariants({ variant: "ghost" }),
                "h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#F9F8F4] hover:text-[#1A1A1A] transition-colors duration-200"
              ),
              day_selected: "bg-[#800020] text-white hover:bg-[#800020] hover:text-white focus:bg-[#800020] focus:text-white",
              day_today: "ring-2 ring-[#0F4C5C] ring-inset text-[#0F4C5C] font-medium",
              day_outside: "day-outside text-[#888888]/40",
              day_disabled: "text-[#888888]/30",
              day_hidden: "invisible",
            }}
            numberOfMonths={1}
            components={{
              IconLeft: ({ className, ...props }: any) => (
                <ChevronLeft className={cn("h-4 w-4", className)} {...props} />
              ),
              IconRight: ({ className, ...props }: any) => (
                <ChevronRight className={cn("h-4 w-4", className)} {...props} />
              ),
            }}
          />
          <p className="text-xs text-[#888888] mt-3">
            Click to select dates. Shift-click to select a range. Click a booked date to unblock it.
          </p>
        </div>

        {/* Actions panel */}
        <div className="w-full md:w-72 space-y-4">
          {selectedDates.length > 0 && (
            <div className="border border-[#E5E5E5] rounded-xl p-5 space-y-4 bg-[#F9F8F4]">
              <div>
                <p className="text-2xl font-semibold text-[#1A1A1A]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {selectedDates.length}
                </p>
                <p className="text-sm text-[#4A4A4A]">
                  date{selectedDates.length !== 1 ? 's' : ''} selected
                </p>
                <p className="text-xs text-[#888888] mt-1">
                  {selectedDates
                    .sort((a, b) => a.getTime() - b.getTime())
                    .map(d => format(d, 'MMM d'))
                    .join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note" className="text-sm text-[#4A4A4A]">Private Note (optional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Smith wedding"
                  className="border-[#E5E5E5] focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBlockSelected}
                  disabled={blockMutation.isPending}
                  className="flex-1 bg-[#0F4C5C] text-white hover:bg-[#093642] rounded-full transition-colors duration-200"
                >
                  {blockMutation.isPending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    'Mark as Booked'
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={handleClearSelection}
                  disabled={blockMutation.isPending}
                  className="border-[#E5E5E5] hover:border-[#800020] hover:text-[#800020] transition-colors duration-200"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {selectedDates.length === 0 && (
            <div className="border border-[#E5E5E5] border-dashed rounded-xl p-5 text-center">
              <p className="text-sm text-[#888888]">
                Select dates on the calendar to block them for bookings
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Grouped blocked dates list */}
      {blockedEntries.length > 0 && (
        <div className="border-t border-[#E5E5E5] pt-6">
          <h3 className="font-semibold text-[#1A1A1A] mb-4">Blocked Dates</h3>
          <div className="space-y-4">
            {visibleBlocked.map(([month, items]) => (
              <div key={month}>
                <h4 className="text-sm font-medium text-[#4A4A4A] mb-2">{month}</h4>
                <div className="space-y-1.5">
                  {items!.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-center justify-between p-3 bg-[#F9F8F4] rounded-lg border-l-2 border-[#800020]/40 group"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-medium text-[#1A1A1A]">
                          {format(parseISO(item.blocked_date), 'EEEE, MMM d')}
                        </span>
                        {item.note && (
                          <span className="text-xs text-[#888888]">{item.note}</span>
                        )}
                      </div>
                      <button
                        onClick={() => handleUnblock(parseISO(item.blocked_date))}
                        className="opacity-0 group-hover:opacity-100 p-1 rounded text-[#888888] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 transition-colors duration-200"
                        title="Make available"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
          {blockedEntries.length > 3 && (
            <button
              onClick={() => setShowAllBlocked(!showAllBlocked)}
              className="mt-3 text-sm text-[#0F4C5C] hover:text-[#093642] font-medium inline-flex items-center gap-1 transition-colors duration-200"
            >
              <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", showAllBlocked && "rotate-180")} />
              {showAllBlocked
                ? 'Show less'
                : `Show ${blockedEntries.length - 3} more month${blockedEntries.length - 3 !== 1 ? 's' : ''}`
              }
            </button>
          )}
        </div>
      )}
    </div>
  )
}
```

Key changes:
- Brand-aligned modifier classes (crimson for booked, teal for selected)
- Full branded `classNames` matching base Calendar styling (larger cells, gold nav, teal today ring)
- Shift-click range selection via `eachDayOfInterval` + `lastClickedDate` tracking
- Inline pill legend above the calendar
- Actions panel with Warm Parchment bg, branded button and input styles
- Playfair Display for the selected count number
- Empty state with dashed border when nothing selected
- Blocked dates grouped by month with crimson left border accent
- Hover-reveal X button for unblocking (red on hover)
- "Show more" toggle instead of hard cutoff at 12
- Help text below calendar explaining shift-click
- Gold spinner on loading state

**Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/vendor/AvailabilityCalendar.tsx
git commit -m "feat: overhaul vendor availability calendar with branded styling and range selection"
```

---

### Task 3: Upgrade Event Date Picker to Radix Popover

**Files:**
- Modify: `frontend/src/components/event/EventWizard/StepDetails.tsx`

**Context:** Currently uses a manual `div` + `useEffect` click-outside handler for the date picker popover. Should use the existing Radix `Popover` component for better accessibility and animations. Uses raw `DayPicker` — switch to the branded `Calendar` component.

**Step 1: Rewrite the date picker section in StepDetails.tsx**

Replace the entire file with:

```tsx
import { useFormContext, Controller } from 'react-hook-form'
import { format, parseISO, startOfToday } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { METRO_AREAS } from '@/lib/metro-areas'
import { cn } from '@/lib/utils'
import type { EventFormData } from './index'

interface StepDetailsProps {
  onNext: () => void
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { register, formState: { errors }, trigger, control, watch, setValue } = useFormContext<EventFormData>()
  const today = startOfToday()

  const handleNext = async () => {
    const valid = await trigger(['event_name', 'event_date'])
    if (valid) onNext()
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setValue('budget', value ? parseInt(value, 10) : null)
  }

  const budgetValue = watch('budget')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Event Details</h2>
        <p className="text-[#4A4A4A]">Tell us about your Arangetram</p>
      </div>

      <div className="space-y-4">
        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="event_name">Event Name *</Label>
          <Input
            id="event_name"
            {...register('event_name')}
            placeholder="e.g., Priya's Arangetram"
          />
          {errors.event_name && (
            <p className="text-sm text-[#D32F2F]">{errors.event_name.message}</p>
          )}
        </div>

        {/* Event Date */}
        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Controller
            name="event_date"
            control={control}
            render={({ field }) => (
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal border-[#E5E5E5] hover:border-[#C5A059] transition-colors duration-200",
                      !field.value && "text-[#888888]"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4 text-[#C5A059]" />
                    {field.value ? format(parseISO(field.value), 'PPP') : 'Select a date'}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={field.value ? parseISO(field.value) : undefined}
                    onSelect={(date) => {
                      if (date) {
                        field.onChange(format(date, 'yyyy-MM-dd'))
                      }
                    }}
                    disabled={{ before: today }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            )}
          />
          {errors.event_date && (
            <p className="text-sm text-[#D32F2F]">{errors.event_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <select
            id="location"
            {...register('location')}
            className="w-full h-10 px-3 py-2 border border-[#E5E5E5] rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:ring-offset-2"
          >
            <option value="">Select a metro area</option>
            {METRO_AREAS.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}, {area.state}
              </option>
            ))}
          </select>
        </div>

        {/* Guest Count */}
        <div className="space-y-2">
          <Label htmlFor="guest_count">Expected Guest Count (optional)</Label>
          <Input
            id="guest_count"
            type="number"
            {...register('guest_count', { valueAsNumber: true })}
            placeholder="e.g., 200"
            min={1}
          />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget">Total Budget (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
            <Input
              id="budget"
              type="text"
              value={budgetValue ? budgetValue.toLocaleString() : ''}
              onChange={handleBudgetChange}
              placeholder="e.g., 15000"
              className="pl-7"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}
```

Key changes:
- Removed `useState` for `dateOpen`, `useRef` for `popoverRef`, `useEffect` for click-outside
- Replaced manual div popover with `Popover`/`PopoverTrigger`/`PopoverContent` from Radix
- Replaced raw `DayPicker` with branded `Calendar` component
- Calendar icon colored gold `text-[#C5A059]`
- Trigger button: `border-[#E5E5E5] hover:border-[#C5A059]`
- Placeholder text: `text-[#888888]` (brand muted)
- Error text: `text-[#D32F2F]` (design system error red)
- Other minor text color alignments (`text-gray-500` → `text-[#4A4A4A]`, `text-[#888888]`)
- Popover auto-closes via Radix interaction (no manual `setDateOpen(false)` needed — actually, Radix Popover doesn't auto-close on internal click. We need the `onSelect` to still work. Since `Calendar` fires `onSelect` and `Popover` stays open, we need to close it manually.)

**CORRECTION — Popover must close on date select.** Update the `onSelect` handler:

Actually, looking at the FilterSidebar, it also uses `Calendar` + `Popover` and does not manually close the popover — it relies on the user clicking away. This is the standard Shadcn pattern for date pickers. The current StepDetails manually closes (`setDateOpen(false)`) on select, which is a nicer UX. To preserve this with Radix Popover, we need controlled open state:

Replace the Event Date section with:

```tsx
        {/* Event Date */}
        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Controller
            name="event_date"
            control={control}
            render={({ field }) => {
              const [open, setOpen] = React.useState(false)
              return (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#E5E5E5] hover:border-[#C5A059] transition-colors duration-200",
                        !field.value && "text-[#888888]"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#C5A059]" />
                      {field.value ? format(parseISO(field.value), 'PPP') : 'Select a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM-dd'))
                          setOpen(false)
                        }
                      }}
                      disabled={{ before: today }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          {errors.event_date && (
            <p className="text-sm text-[#D32F2F]">{errors.event_date.message}</p>
          )}
        </div>
```

Note: This means we need `React` imported for `React.useState`. Update the import line to:
```tsx
import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
```

**Step 2: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 3: Commit**

```bash
git add frontend/src/components/event/EventWizard/StepDetails.tsx
git commit -m "refactor: upgrade event date picker to Radix Popover with branded Calendar"
```

---

### Task 4: Polish Filter Sidebar & Availability Badge

**Files:**
- Modify: `frontend/src/components/discovery/FilterSidebar.jsx`
- Modify: `frontend/src/components/discovery/AvailabilityBadge.tsx`

**Context:** FilterSidebar already uses `Calendar` + `Popover` — mostly inherits the base calendar restyle. Just need icon color and clear button color updates. AvailabilityBadge needs design-system colors and a fade-in animation.

**Step 1: Update FilterSidebar icon and clear button colors**

In `frontend/src/components/discovery/FilterSidebar.jsx`, make these changes:

In both `FilterSidebar` and `MobileFilters` components, update the calendar trigger button icon color and clear button hover:

Change (appears twice — once in `FilterSidebar`, once in `MobileFilters`):
```jsx
<CalendarIcon className="mr-2 h-4 w-4" />
```
to:
```jsx
<CalendarIcon className="mr-2 h-4 w-4 text-[#C5A059]" />
```

Change (appears twice):
```jsx
<X className="h-4 w-4" />
```
(inside the clear date button) to have a hover color on the parent `Button`:

Change both clear buttons from:
```jsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setFilter('availableDate', '')}
  className="shrink-0"
>
  <X className="h-4 w-4" />
</Button>
```
to:
```jsx
<Button
  variant="ghost"
  size="icon"
  onClick={() => setFilter('availableDate', '')}
  className="shrink-0 hover:text-[#800020] transition-colors duration-200"
>
  <X className="h-4 w-4" />
</Button>
```

**Step 2: Restyle AvailabilityBadge.tsx**

Replace the entire file with:

```tsx
import { format, parseISO } from 'date-fns'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useBlockedDates } from '@/hooks/useAvailability'

interface AvailabilityBadgeProps {
  vendorId: string
  eventDate?: string
}

export function AvailabilityBadge({ vendorId, eventDate }: AvailabilityBadgeProps) {
  const { blockedDates, isLoading } = useBlockedDates(vendorId)

  if (!eventDate) return null

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F8F4] border border-[#E5E5E5] text-[#4A4A4A] text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
        <span>Checking availability...</span>
      </div>
    )
  }

  const eventDateObj = parseISO(eventDate)
  const isBlocked = blockedDates.some(
    (blockedDate) =>
      format(blockedDate, 'yyyy-MM-dd') === format(eventDateObj, 'yyyy-MM-dd')
  )

  const formattedDate = format(eventDateObj, 'MMM d, yyyy')

  if (isBlocked) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20 text-sm font-medium animate-fade-in-up">
        <XCircle className="w-4 h-4" />
        <span>Unavailable on {formattedDate}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20 text-sm font-medium animate-fade-in-up">
      <CheckCircle className="w-4 h-4" />
      <span>Available on {formattedDate}</span>
    </div>
  )
}

export default AvailabilityBadge
```

Key changes:
- Loading: `bg-[#F9F8F4]` with gold spinner `text-[#C5A059]` and `border border-[#E5E5E5]`
- Available: `bg-[#2E7D32]/10 text-[#2E7D32] border border-[#2E7D32]/20`
- Unavailable: `bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20`
- Both badges get `animate-fade-in-up` class (already defined in `index.css`)

**Step 3: Verify the app builds**

Run: `cd frontend && npm run build`
Expected: Build succeeds with no errors.

**Step 4: Commit**

```bash
git add frontend/src/components/discovery/FilterSidebar.jsx frontend/src/components/discovery/AvailabilityBadge.tsx
git commit -m "style: brand-align filter sidebar date picker and availability badges"
```

---

### Task 5: Visual Verification

**Context:** All code changes are complete. Use the running dev server + browser to verify each calendar looks correct.

**Step 1: Start the dev server**

Run: `cd frontend && npm start`
Expected: Dev server starts on `http://localhost:3000`

**Step 2: Verify base Calendar styling**

Navigate to vendor discovery page and open the "Available On" date filter popover. Confirm:
- Day cells are larger (40px)
- Navigation arrows show gold hover
- Today has a teal ring (no fill)
- Disabled past dates are very faint
- Overall padding is generous

**Step 3: Verify vendor availability calendar**

Log in as a vendor and navigate to the dashboard availability section. Confirm:
- Inline pill legend appears above calendar
- Calendar uses branded colors (crimson booked, teal selected)
- Click dates individually → teal selection
- Shift-click between two dates → range fills in
- Actions panel has Warm Parchment bg and teal "Mark as Booked" button
- Blocked dates are grouped by month with crimson left border
- Hover over a blocked date row → X button appears
- "Show more" toggle works for 3+ months of blocked dates

**Step 4: Verify event date picker**

Navigate to create event flow. Confirm:
- Calendar icon is gold
- Popover opens with scale animation
- Calendar inside uses branded styling
- Selecting a date closes the popover
- Selected date displays correctly in the trigger button

**Step 5: Verify availability badge**

Navigate to a vendor detail page with an event date in the URL. Confirm:
- Available badge: green with border, fade-in animation
- Unavailable badge: red with border, fade-in animation
- Loading state: parchment bg with gold spinner

**Step 6: Final commit if any tweaks needed**

```bash
git add -A
git commit -m "fix: calendar UI polish tweaks from visual review"
```

(Only if adjustments were made during visual review.)

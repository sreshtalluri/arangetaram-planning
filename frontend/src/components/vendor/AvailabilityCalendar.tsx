import { useState, useMemo } from 'react'
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
  const today = useMemo(() => startOfToday(), [])

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
  const groupedBlocked = useMemo(() =>
    (availability || []).reduce<Record<string, typeof availability>>((acc, item) => {
      const monthKey = format(parseISO(item.blocked_date), 'MMMM yyyy')
      if (!acc[monthKey]) acc[monthKey] = []
      acc[monthKey]!.push(item)
      return acc
    }, {}),
    [availability]
  )

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
                  {[...selectedDates]
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
                        className="opacity-0 group-hover:opacity-100 focus:opacity-100 p-1 rounded text-[#888888] hover:text-[#D32F2F] hover:bg-[#D32F2F]/10 transition-colors duration-200"
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

import { useState, useMemo, useEffect } from 'react'
import { DayPicker } from 'react-day-picker'
import {
  format,
  isSameDay,
  isBefore,
  parseISO,
  startOfToday,
  subDays,
  addDays,
  eachDayOfInterval,
} from 'date-fns'
import { toast } from 'sonner'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { buttonVariants } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { Loader2, ChevronLeft, ChevronRight, Info } from 'lucide-react'
import { useBookingSettings } from '@/hooks/useBookingSettings'
import { useCreateBooking } from '@/hooks/useVendorBookings'
import { CATEGORY_BOOKING_DEFAULTS } from '@/lib/vendor-categories'

interface BookingConfirmationDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vendorId: string
  vendorCategory: string
  inquiryId: string
  eventId: string
  eventName: string
  eventDate: string // yyyy-MM-dd
  onConfirm: () => void
}

export function BookingConfirmationDialog({
  open,
  onOpenChange,
  vendorId,
  vendorCategory,
  inquiryId,
  eventId,
  eventName,
  eventDate,
  onConfirm,
}: BookingConfirmationDialogProps) {
  const { data: bookingSettings } = useBookingSettings(vendorId)
  const createBooking = useCreateBooking()

  const categoryDefaults = CATEGORY_BOOKING_DEFAULTS[vendorCategory]

  const bufferBefore = bookingSettings?.buffer_days_before ?? categoryDefaults?.buffer_days_before ?? 0
  const bufferAfter = bookingSettings?.buffer_days_after ?? categoryDefaults?.buffer_days_after ?? 0
  const bufferLabelBefore = categoryDefaults?.buffer_label_before
  const bufferLabelAfter = categoryDefaults?.buffer_label_after

  const eventDateObj = useMemo(() => parseISO(eventDate), [eventDate])

  // Compute buffer date ranges
  const bufferDatesBefore = useMemo(() => {
    if (bufferBefore <= 0) return []
    return eachDayOfInterval({
      start: subDays(eventDateObj, bufferBefore),
      end: subDays(eventDateObj, 1),
    })
  }, [eventDateObj, bufferBefore])

  const bufferDatesAfter = useMemo(() => {
    if (bufferAfter <= 0) return []
    return eachDayOfInterval({
      start: addDays(eventDateObj, 1),
      end: addDays(eventDateObj, bufferAfter),
    })
  }, [eventDateObj, bufferAfter])

  const allBufferDates = useMemo(
    () => [...bufferDatesBefore, ...bufferDatesAfter],
    [bufferDatesBefore, bufferDatesAfter]
  )

  // Selected buffer dates (pre-selected, can be toggled off)
  const [selectedBufferDates, setSelectedBufferDates] = useState<Date[]>([])
  // Extra dates user clicks on
  const [extraDates, setExtraDates] = useState<Date[]>([])
  const [note, setNote] = useState('')

  // Reset state when dialog opens
  useEffect(() => {
    if (open) {
      setSelectedBufferDates([...allBufferDates])
      setExtraDates([])
      setNote('')
    }
  }, [open, allBufferDates])

  const isBufferDate = (date: Date) =>
    allBufferDates.some((d) => isSameDay(d, date))

  const isExtraDate = (date: Date) =>
    extraDates.some((d) => isSameDay(d, date))

  const isSelectedBuffer = (date: Date) =>
    selectedBufferDates.some((d) => isSameDay(d, date))

  // All dates that will be blocked
  const allSelectedDates = useMemo(() => {
    const dates = [eventDateObj, ...selectedBufferDates, ...extraDates]
    // Deduplicate
    const unique: Date[] = []
    for (const d of dates) {
      if (!unique.some((u) => isSameDay(u, d))) {
        unique.push(d)
      }
    }
    return unique.sort((a, b) => a.getTime() - b.getTime())
  }, [eventDateObj, selectedBufferDates, extraDates])

  const today = useMemo(() => startOfToday(), [])

  const handleDayClick = (day: Date) => {
    // Event date cannot be deselected
    if (isSameDay(day, eventDateObj)) return
    // Don't allow selecting past dates
    if (isBefore(day, today)) return

    // Buffer date: toggle selection
    if (isBufferDate(day)) {
      if (isSelectedBuffer(day)) {
        setSelectedBufferDates((prev) => prev.filter((d) => !isSameDay(d, day)))
      } else {
        setSelectedBufferDates((prev) => [...prev, day])
      }
      return
    }

    // Extra date: toggle
    if (isExtraDate(day)) {
      setExtraDates((prev) => prev.filter((d) => !isSameDay(d, day)))
    } else {
      setExtraDates((prev) => [...prev, day])
    }
  }

  const handleConfirm = async () => {
    try {
      await createBooking.mutateAsync({
        vendorId,
        eventId,
        inquiryId,
        bookedDate: eventDateObj,
        blockedDates: allSelectedDates,
        source: 'inquiry',
        note: note || undefined,
      })
      toast.success(
        `Booking confirmed! ${allSelectedDates.length} date(s) blocked.`
      )
      onConfirm()
    } catch (error: any) {
      const message = error?.message || ''
      if (message.toLowerCase().includes('maximum bookings')) {
        toast.error(
          'This vendor is already booked for this date. The maximum number of bookings has been reached.'
        )
      } else {
        toast.error(message || 'Failed to create booking')
      }
    }
  }

  const handleSkip = () => {
    onOpenChange(false)
  }

  // Build modifiers for DayPicker
  const modifiers = useMemo(
    () => ({
      eventDay: [eventDateObj],
      bufferSelected: selectedBufferDates,
      bufferUnselected: allBufferDates.filter(
        (d) => !selectedBufferDates.some((s) => isSameDay(s, d))
      ),
      extra: extraDates,
    }),
    [eventDateObj, selectedBufferDates, allBufferDates, extraDates]
  )

  const modifiersClassNames = useMemo(
    () => ({
      eventDay: 'bg-[#0F4C5C] text-white hover:bg-[#0F4C5C] hover:text-white focus:bg-[#0F4C5C] focus:text-white',
      bufferSelected: 'bg-[#0F4C5C]/20 text-[#0F4C5C] font-medium',
      bufferUnselected: 'opacity-40',
      extra: 'bg-[#C5A059]/20 text-[#C5A059] ring-1 ring-[#C5A059]',
    }),
    []
  )

  const hasBufferDates = allBufferDates.length > 0

  // Build a buffer label for the banner
  const bufferBannerLabel = useMemo(() => {
    const parts: string[] = []
    if (bufferBefore > 0) {
      parts.push(
        `${bufferBefore} day${bufferBefore > 1 ? 's' : ''} before${bufferLabelBefore ? ` (${bufferLabelBefore.toLowerCase()})` : ''}`
      )
    }
    if (bufferAfter > 0) {
      parts.push(
        `${bufferAfter} day${bufferAfter > 1 ? 's' : ''} after${bufferLabelAfter ? ` (${bufferLabelAfter.toLowerCase()})` : ''}`
      )
    }
    return parts.join(' and ')
  }, [bufferBefore, bufferAfter, bufferLabelBefore, bufferLabelAfter])

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* @ts-ignore -- dialog.jsx lacks TS declarations */}
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {/* @ts-ignore */}
        <DialogHeader>
          {/* @ts-ignore */}
          <DialogTitle>Confirm Booking</DialogTitle>
          {/* @ts-ignore */}
          <DialogDescription>
            Block dates on your calendar for {eventName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Buffer info banner */}
          {hasBufferDates && (
            <div className="flex items-start gap-2 p-3 rounded-lg bg-[#0F4C5C]/5 border border-[#0F4C5C]/15">
              <Info className="w-4 h-4 text-[#0F4C5C] mt-0.5 shrink-0" />
              <p className="text-sm text-[#4A4A4A]">
                Buffer days ({bufferBannerLabel}) are pre-selected based on your
                category settings. You can toggle them off if not needed.
              </p>
            </div>
          )}

          {/* Legend */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C5C] text-xs font-medium text-white">
              <div className="w-2.5 h-2.5 rounded-full bg-white/30" />
              Event Day
            </div>
            {hasBufferDates && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0F4C5C]/20 border border-[#0F4C5C]/30 text-xs font-medium text-[#0F4C5C]">
                <div className="w-2.5 h-2.5 rounded-full bg-[#0F4C5C]/30" />
                Buffer Days
              </div>
            )}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#C5A059]/20 border border-[#C5A059]/40 text-xs font-medium text-[#C5A059]">
              <div className="w-2.5 h-2.5 rounded-full bg-[#C5A059]/40" />
              Extra Days
            </div>
          </div>

          {/* Calendar */}
          <DayPicker
            mode="multiple"
            selected={allSelectedDates}
            onDayClick={handleDayClick}
            disabled={{ before: today }}
            defaultMonth={eventDateObj}
            modifiers={modifiers}
            modifiersClassNames={modifiersClassNames}
            className="border border-[#E5E5E5] rounded-xl p-5 shadow-[0_4px_20px_-2px_rgba(0,0,0,0.05)]"
            classNames={{
              months:
                'flex flex-col sm:flex-row space-y-4 sm:space-x-4 sm:space-y-0',
              month: 'space-y-4',
              caption: 'flex justify-center pt-1 relative items-center',
              caption_label: 'text-base font-semibold tracking-tight',
              nav: 'space-x-1 flex items-center',
              nav_button: cn(
                buttonVariants({ variant: 'outline' }),
                'h-8 w-8 bg-transparent p-0 text-[#4A4A4A] hover:text-[#C5A059] hover:border-[#C5A059] transition-colors duration-200'
              ),
              nav_button_previous: 'absolute left-1',
              nav_button_next: 'absolute right-1',
              table: 'w-full border-collapse space-y-1',
              head_row: 'flex',
              head_cell:
                'text-[#888888] rounded-md w-10 font-medium text-[0.8rem] uppercase tracking-wider',
              row: 'flex w-full mt-2',
              cell: 'relative p-0 text-center text-sm focus-within:relative focus-within:z-20 [&:has([aria-selected])]:rounded-md',
              day: cn(
                buttonVariants({ variant: 'ghost' }),
                'h-10 w-10 p-0 font-normal aria-selected:opacity-100 hover:bg-[#F9F8F4] hover:text-[#1A1A1A] transition-colors duration-200'
              ),
              day_selected:
                'bg-[#0F4C5C] text-white hover:bg-[#0F4C5C] hover:text-white focus:bg-[#0F4C5C] focus:text-white',
              day_today:
                'ring-2 ring-[#0F4C5C] ring-inset text-[#0F4C5C] font-medium',
              day_outside: 'day-outside text-[#888888]/40',
              day_disabled: 'text-[#888888]/30',
              day_hidden: 'invisible',
            }}
            numberOfMonths={1}
            components={{
              IconLeft: ({ className, ...props }: any) => (
                <ChevronLeft className={cn('h-4 w-4', className)} {...props} />
              ),
              IconRight: ({ className, ...props }: any) => (
                <ChevronRight
                  className={cn('h-4 w-4', className)}
                  {...props}
                />
              ),
            }}
          />

          {/* Summary */}
          <div className="rounded-lg border border-[#E5E5E5] p-3 bg-[#F9F8F4]">
            <p className="text-sm text-[#1A1A1A] font-medium">
              {allSelectedDates.length} date{allSelectedDates.length !== 1 ? 's' : ''} will be blocked:
            </p>
            <p className="text-xs text-[#888888] mt-1">
              {allSelectedDates.map((d) => format(d, 'MMM d')).join(', ')}
            </p>
          </div>

          {/* Note input */}
          <div className="space-y-2">
            <Label htmlFor="booking-note" className="text-sm text-[#4A4A4A]">
              Note (optional)
            </Label>
            <Input
              id="booking-note"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder={`e.g., ${eventName}`}
              className="border-[#E5E5E5] focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={handleSkip}
            disabled={createBooking.isPending}
          >
            Skip Blocking
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={createBooking.isPending}
            className="btn-primary"
          >
            {createBooking.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              'Confirm Booking'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

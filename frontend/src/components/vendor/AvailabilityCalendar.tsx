import { useState } from 'react'
import { DayPicker } from 'react-day-picker'
import { format, isSameDay, isAfter, startOfToday } from 'date-fns'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBlockedDates, useBlockDates, useUnblockDate } from '@/hooks/useAvailability'
import { Loader2, X } from 'lucide-react'

interface AvailabilityCalendarProps {
  vendorId: string
}

export function AvailabilityCalendar({ vendorId }: AvailabilityCalendarProps) {
  const { blockedDates, availability, isLoading } = useBlockedDates(vendorId)
  const blockMutation = useBlockDates()
  const unblockMutation = useUnblockDate()

  const [selectedDates, setSelectedDates] = useState<Date[]>([])
  const [note, setNote] = useState('')
  const today = startOfToday()

  const isDateBlocked = (date: Date) =>
    blockedDates.some(blocked => isSameDay(blocked, date))

  const handleDayClick = (day: Date) => {
    // Don't allow selecting past dates
    if (!isAfter(day, today) && !isSameDay(day, today)) return

    if (isDateBlocked(day)) {
      // Unblock this date
      handleUnblock(day)
    } else {
      // Toggle selection for new blocking
      setSelectedDates(prev => {
        const exists = prev.some(d => isSameDay(d, day))
        if (exists) {
          return prev.filter(d => !isSameDay(d, day))
        }
        return [...prev, day]
      })
    }
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
      setNote('')
    } catch (error) {
      toast.error('Failed to update availability')
    }
  }

  const handleClearSelection = () => {
    setSelectedDates([])
    setNote('')
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-8">
        <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
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
              booked: 'bg-red-100 text-red-800 font-medium',
              selected: 'bg-blue-100 text-blue-800 ring-2 ring-blue-500',
            }}
            className="border rounded-lg p-4"
            numberOfMonths={1}
          />
        </div>

        {/* Actions panel */}
        <div className="w-full md:w-64 space-y-4">
          <div>
            <h3 className="font-medium mb-2">Legend</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-red-100 rounded" />
                <span>Booked / Unavailable</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 bg-blue-100 rounded ring-2 ring-blue-500" />
                <span>Selected to block</span>
              </div>
            </div>
          </div>

          {selectedDates.length > 0 && (
            <div className="border rounded-lg p-4 space-y-4 bg-gray-50">
              <div>
                <p className="font-medium">
                  {selectedDates.length} date(s) selected
                </p>
                <p className="text-sm text-gray-500">
                  {selectedDates.map(d => format(d, 'MMM d')).join(', ')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="note">Private Note (optional)</Label>
                <Input
                  id="note"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="e.g., Smith wedding"
                />
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={handleBlockSelected}
                  disabled={blockMutation.isPending}
                  className="flex-1"
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
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          <div className="text-sm text-gray-500">
            <p>Click a date to select it for blocking.</p>
            <p>Click a red date to make it available again.</p>
          </div>
        </div>
      </div>

      {/* Upcoming blocked dates list */}
      {availability && availability.length > 0 && (
        <div className="border-t pt-4">
          <h3 className="font-medium mb-3">Blocked Dates</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
            {availability.slice(0, 12).map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-2 bg-red-50 rounded text-sm"
              >
                <div>
                  <span className="font-medium">
                    {format(new Date(item.blocked_date), 'MMM d, yyyy')}
                  </span>
                  {item.note && (
                    <span className="text-gray-500 ml-2">- {item.note}</span>
                  )}
                </div>
                <span className="text-red-600 text-xs font-medium">Booked</span>
              </div>
            ))}
          </div>
          {availability.length > 12 && (
            <p className="text-sm text-gray-500 mt-2">
              +{availability.length - 12} more blocked dates
            </p>
          )}
        </div>
      )}
    </div>
  )
}

import { format, parseISO } from 'date-fns'
import { CheckCircle, XCircle, Loader2 } from 'lucide-react'
import { useBlockedDates } from '@/hooks/useAvailability'

interface AvailabilityBadgeProps {
  vendorId: string
  /** Event date in yyyy-MM-dd format */
  eventDate?: string
}

/**
 * AvailabilityBadge - Shows if vendor is available on a specific date
 *
 * Only renders when eventDate is provided. Checks vendor's blocked dates
 * and displays a green (available) or red (unavailable) badge.
 */
export function AvailabilityBadge({ vendorId, eventDate }: AvailabilityBadgeProps) {
  const { blockedDates, isLoading } = useBlockedDates(vendorId)

  // Don't render if no event date to check against
  if (!eventDate) return null

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gray-100 text-gray-600 text-sm">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>Checking availability...</span>
      </div>
    )
  }

  // Check if eventDate is in blocked dates
  const eventDateObj = parseISO(eventDate)
  const isBlocked = blockedDates.some(
    (blockedDate) =>
      format(blockedDate, 'yyyy-MM-dd') === format(eventDateObj, 'yyyy-MM-dd')
  )

  const formattedDate = format(eventDateObj, 'MMM d, yyyy')

  if (isBlocked) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium">
        <XCircle className="w-4 h-4" />
        <span>Unavailable on {formattedDate}</span>
      </div>
    )
  }

  return (
    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium">
      <CheckCircle className="w-4 h-4" />
      <span>Available on {formattedDate}</span>
    </div>
  )
}

export default AvailabilityBadge

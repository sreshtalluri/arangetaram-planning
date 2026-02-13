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

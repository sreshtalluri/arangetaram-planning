import { format, parseISO } from 'date-fns'
import { CheckCircle, XCircle, AlertTriangle, Loader2 } from 'lucide-react'
import { useBlockedDates } from '@/hooks/useAvailability'
import { useAllBlockedDates } from '@/hooks/useVendorBookings'

interface AvailabilityBadgeProps {
  vendorId: string
  /** Event date in yyyy-MM-dd format */
  eventDate?: string | null
}

/**
 * AvailabilityBadge - Shows if vendor is available on a specific date
 *
 * Checks both manual blocks (vendor_availability) and confirmed bookings
 * (vendor_bookings) to determine availability status.
 */
export function AvailabilityBadge({ vendorId, eventDate }: AvailabilityBadgeProps) {
  const { blockedDates, isLoading: manualLoading } = useBlockedDates(vendorId)
  const { data: allBlocked, isLoading: bookingsLoading } = useAllBlockedDates(vendorId)

  if (!eventDate) return null

  const isLoading = manualLoading || bookingsLoading

  if (isLoading) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#F9F8F4] border border-[#E5E5E5] text-[#4A4A4A] text-sm">
        <Loader2 className="w-4 h-4 animate-spin text-[#C5A059]" />
        <span>Checking availability...</span>
      </div>
    )
  }

  const formattedDate = format(parseISO(eventDate), 'MMM d, yyyy')

  // Check manual blocks
  const isManualBlocked = blockedDates.some(
    (d) => format(d, 'yyyy-MM-dd') === eventDate
  )

  if (isManualBlocked) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20 text-sm font-medium animate-fade-in-up">
        <XCircle className="w-4 h-4" />
        <span>Unavailable on {formattedDate}</span>
      </div>
    )
  }

  // Check booking blocks (event day bookings vs buffer day conflicts)
  const bookingBlocks = allBlocked?.bookingBlocks || []
  const eventDayBlock = bookingBlocks.find(
    (b) => b.date === eventDate && !b.isBufferDay
  )
  const bufferDayBlock = bookingBlocks.find(
    (b) => b.date === eventDate && b.isBufferDay
  )

  if (eventDayBlock) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D32F2F]/10 text-[#D32F2F] border border-[#D32F2F]/20 text-sm font-medium animate-fade-in-up">
        <XCircle className="w-4 h-4" />
        <span>Booked on {formattedDate}</span>
      </div>
    )
  }

  if (bufferDayBlock) {
    return (
      <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-sm font-medium animate-fade-in-up">
        <AlertTriangle className="w-4 h-4" />
        <span>Buffer day conflict on {formattedDate}</span>
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

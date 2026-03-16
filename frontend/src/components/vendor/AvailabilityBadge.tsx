import { cn } from '@/lib/utils'
import { Check, AlertTriangle, X } from 'lucide-react'

interface AvailabilityBadgeProps {
  status?: 'available' | 'buffer_conflict' | 'unavailable'
  note?: string
  className?: string
}

export function AvailabilityBadge({ status, note, className }: AvailabilityBadgeProps) {
  if (!status) return null

  const config = {
    available: {
      icon: Check,
      text: 'Available',
      bg: 'bg-emerald-50 border-emerald-200 text-emerald-700',
      iconColor: 'text-emerald-500',
    },
    buffer_conflict: {
      icon: AlertTriangle,
      text: note || 'Buffer day conflict',
      bg: 'bg-amber-50 border-amber-200 text-amber-700',
      iconColor: 'text-amber-500',
    },
    unavailable: {
      icon: X,
      text: note || 'Unavailable',
      bg: 'bg-red-50 border-red-200 text-red-700',
      iconColor: 'text-red-500',
    },
  }[status]

  const Icon = config.icon

  return (
    <div className={cn(
      'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-medium',
      config.bg,
      className,
    )}>
      <Icon className={cn('w-3 h-3', config.iconColor)} />
      {config.text}
    </div>
  )
}

import { Badge } from '../ui/badge'
import { Clock, Check, X } from 'lucide-react'

const statusConfig = {
  pending: {
    label: 'Pending',
    className: 'bg-amber-100 text-amber-800 border-amber-200',
    icon: Clock,
  },
  accepted: {
    label: 'Accepted',
    className: 'bg-green-100 text-green-800 border-green-200',
    icon: Check,
  },
  declined: {
    label: 'Declined',
    className: 'bg-red-100 text-red-800 border-red-200',
    icon: X,
  },
}

export function InquiryBadge({ status, showIcon = true }) {
  const config = statusConfig[status]
  if (!config) return null

  const Icon = config.icon

  return (
    <Badge className={`${config.className} border`}>
      {showIcon && <Icon className="w-3 h-3 mr-1" />}
      {config.label}
    </Badge>
  )
}

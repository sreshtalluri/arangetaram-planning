import { useInquiryStats } from '../../hooks/useInquiries'
import { MessageSquare, Clock, CheckCircle, XCircle } from 'lucide-react'

/**
 * InquiryStatsCards displays four stat cards for vendor dashboard overview
 *
 * @param {Object} props
 * @param {string} props.vendorId - Vendor ID to fetch stats for
 */
export function InquiryStatsCards({ vendorId }) {
  const { data: stats } = useInquiryStats(vendorId)

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <StatCard
        icon={MessageSquare}
        iconBg="bg-[#0F4C5C]/10"
        iconColor="text-[#0F4C5C]"
        value={stats?.total || 0}
        label="Total"
      />
      <StatCard
        icon={Clock}
        iconBg="bg-amber-100"
        iconColor="text-amber-600"
        value={stats?.pending || 0}
        label="Pending"
      />
      <StatCard
        icon={CheckCircle}
        iconBg="bg-green-100"
        iconColor="text-green-600"
        value={stats?.accepted || 0}
        label="Accepted"
      />
      <StatCard
        icon={XCircle}
        iconBg="bg-red-100"
        iconColor="text-red-600"
        value={stats?.declined || 0}
        label="Declined"
      />
    </div>
  )
}

function StatCard({ icon: Icon, iconBg, iconColor, value, label }) {
  return (
    <div className="bg-white rounded-lg p-4 border shadow-sm">
      <div className="flex items-center gap-3">
        <div className={`w-10 h-10 rounded-lg ${iconBg} flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-2xl font-bold text-[#1A1A1A]">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  )
}

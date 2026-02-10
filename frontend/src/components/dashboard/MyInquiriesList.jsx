import { useUserInquiries, useMarkInquiryRead } from '../../hooks/useInquiries'
import { InquiryCard } from '../inquiry/InquiryCard'
import { Loader2, Send } from 'lucide-react'
import { useEffect } from 'react'

/**
 * MyInquiriesList displays all inquiries sent by a user
 * Shows loading state, empty state, and inquiry cards with status badges
 * Automatically marks inquiries with responses as read on mount
 */
export function MyInquiriesList({ userId }) {
  const { data: inquiries = [], isLoading } = useUserInquiries(userId)
  const markRead = useMarkInquiryRead('user')

  // Mark inquiries with responses as read when viewing
  useEffect(() => {
    const unreadWithResponse = inquiries.filter(
      i => i.status !== 'pending' && !i.user_read_at
    )
    unreadWithResponse.forEach(inquiry => {
      markRead.mutate(inquiry.id)
    })
  }, [inquiries])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F4C5C]" />
      </div>
    )
  }

  if (inquiries.length === 0) {
    return (
      <div className="bg-white rounded-xl p-8 shadow-sm text-center">
        <div className="w-12 h-12 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-3">
          <Send className="w-6 h-6 text-[#888888]" />
        </div>
        <h3 className="font-medium text-[#1A1A1A] mb-1">No inquiries yet</h3>
        <p className="text-sm text-[#888888]">
          Browse vendors and send inquiries to get started.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {inquiries.map((inquiry) => (
        <InquiryCard
          key={inquiry.id}
          inquiry={inquiry}
          view="user"
        />
      ))}
    </div>
  )
}

export default MyInquiriesList

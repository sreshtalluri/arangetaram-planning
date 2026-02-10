import { useState, useEffect } from 'react'
import { useVendorInquiries, useMarkInquiryRead } from '../../hooks/useInquiries'
import { InquiryCard } from '../inquiry/InquiryCard'
import { RespondInquiryDialog } from '../inquiry/RespondInquiryDialog'
import { Loader2, Inbox } from 'lucide-react'

/**
 * VendorInquiriesList displays all inquiries received by a vendor
 * with respond functionality and auto-mark-as-read behavior
 *
 * @param {Object} props
 * @param {string} props.vendorId - Vendor ID to fetch inquiries for
 */
export function VendorInquiriesList({ vendorId }) {
  const { data: inquiries = [], isLoading } = useVendorInquiries(vendorId)
  const markRead = useMarkInquiryRead('vendor')
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [respondDialogOpen, setRespondDialogOpen] = useState(false)

  // Mark inquiries as read when viewing
  useEffect(() => {
    const unread = inquiries.filter(i => !i.vendor_read_at)
    unread.forEach(inquiry => {
      markRead.mutate(inquiry.id)
    })
  }, [inquiries])

  const handleRespond = (inquiry) => {
    setSelectedInquiry(inquiry)
    setRespondDialogOpen(true)
  }

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
          <Inbox className="w-6 h-6 text-[#888888]" />
        </div>
        <h3 className="font-medium text-[#1A1A1A] mb-1">No inquiries yet</h3>
        <p className="text-sm text-[#888888]">
          When families send you inquiries, they'll appear here.
        </p>
      </div>
    )
  }

  return (
    <>
      <div className="space-y-4">
        {inquiries.map((inquiry) => (
          <InquiryCard
            key={inquiry.id}
            inquiry={inquiry}
            view="vendor"
            onRespond={() => handleRespond(inquiry)}
          />
        ))}
      </div>

      <RespondInquiryDialog
        inquiry={selectedInquiry}
        open={respondDialogOpen}
        onOpenChange={setRespondDialogOpen}
      />
    </>
  )
}

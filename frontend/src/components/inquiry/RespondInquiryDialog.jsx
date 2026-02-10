import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Textarea } from '../ui/textarea'
import { useRespondToInquiry } from '../../hooks/useInquiries'
import { toast } from 'sonner'
import { Loader2, Check, X } from 'lucide-react'

/**
 * RespondInquiryDialog allows vendors to accept or decline inquiries
 *
 * @param {Object} props
 * @param {Object} props.inquiry - InquiryWithDetails object
 * @param {boolean} props.open - Dialog open state
 * @param {Function} props.onOpenChange - Dialog open state handler
 */
export function RespondInquiryDialog({ inquiry, open, onOpenChange }) {
  const [responseMessage, setResponseMessage] = useState('')
  const respondToInquiry = useRespondToInquiry()

  const handleRespond = async (status) => {
    try {
      await respondToInquiry.mutateAsync({
        inquiryId: inquiry.id,
        status,
        responseMessage: responseMessage || undefined,
      })
      toast.success(`Inquiry ${status}!`)
      onOpenChange(false)
      setResponseMessage('')
    } catch (error) {
      toast.error(error.message || 'Failed to respond')
    }
  }

  const userName =
    inquiry?.user_profile?.full_name || inquiry?.user_profile?.email || 'User'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Respond to Inquiry</DialogTitle>
          <DialogDescription>
            Respond to {userName}'s inquiry for {inquiry?.event?.event_name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <label className="text-sm font-medium">
              Message <span className="text-[#888888] font-normal">(optional)</span>
            </label>
            <Textarea
              value={responseMessage}
              onChange={(e) => setResponseMessage(e.target.value)}
              placeholder="Add a message to your response..."
              className="input-styled resize-none"
              rows={3}
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-2">
          <Button
            variant="outline"
            onClick={() => handleRespond('declined')}
            disabled={respondToInquiry.isPending}
            className="flex-1 border-red-200 text-red-600 hover:bg-red-50"
          >
            {respondToInquiry.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <X className="w-4 h-4 mr-2" />
                Decline
              </>
            )}
          </Button>
          <Button
            onClick={() => handleRespond('accepted')}
            disabled={respondToInquiry.isPending}
            className="flex-1 btn-primary"
          >
            {respondToInquiry.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Check className="w-4 h-4 mr-2" />
                Accept
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

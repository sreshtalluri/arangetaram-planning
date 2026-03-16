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
import { Input } from '../ui/input'
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
  const [quotedPrice, setQuotedPrice] = useState('')
  const [quotedPriceNotes, setQuotedPriceNotes] = useState('')
  const respondToInquiry = useRespondToInquiry()

  const handleRespond = async (action) => {
    try {
      await respondToInquiry.mutateAsync({
        inquiryId: inquiry.id,
        status: action,
        responseMessage: responseMessage || undefined,
        quotedPrice: action === 'accepted' && quotedPrice ? parseFloat(quotedPrice) : undefined,
        quotedPriceNotes: action === 'accepted' && quotedPriceNotes.trim() ? quotedPriceNotes.trim() : undefined,
      })
      toast.success(`Inquiry ${action}!`)
      onOpenChange(false)
      setResponseMessage('')
      setQuotedPrice('')
      setQuotedPriceNotes('')
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

          {/* Price fields — shown only when vendor is accepting */}
          <div className="space-y-4 rounded-lg border border-dashed border-green-300 bg-green-50/50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-green-700">
              If accepting — your quote
            </p>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Your Price <span className="text-[#888888] font-normal">(optional)</span>
              </label>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-muted-foreground text-sm">
                  $
                </span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  value={quotedPrice}
                  onChange={(e) => setQuotedPrice(e.target.value)}
                  className="pl-7"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Price Notes <span className="text-[#888888] font-normal">(optional)</span>
              </label>
              <Input
                type="text"
                placeholder="e.g. includes 8 hours coverage"
                value={quotedPriceNotes}
                onChange={(e) => setQuotedPriceNotes(e.target.value)}
              />
            </div>
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

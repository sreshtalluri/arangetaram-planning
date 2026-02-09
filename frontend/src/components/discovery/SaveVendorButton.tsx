import { useNavigate } from 'react-router-dom'
import { Heart, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useIsSaved, useSaveVendor, useUnsaveVendor } from '@/hooks/useSavedVendors'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

interface SaveVendorButtonProps {
  vendorId: string
  /** 'icon' = just heart icon, 'button' = heart + text */
  variant?: 'icon' | 'button'
  className?: string
}

/**
 * SaveVendorButton - Heart button to save/unsave vendors
 *
 * Features:
 * - Toggles saved state for authenticated users
 * - Prompts login for guests
 * - Shows loading state during mutation
 * - Two variants: icon-only or button with text
 */
export function SaveVendorButton({
  vendorId,
  variant = 'icon',
  className,
}: SaveVendorButtonProps) {
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuth()
  const userId = user?.id

  const { data: isSaved, isLoading: isCheckingStatus } = useIsSaved(userId, vendorId)
  const saveMutation = useSaveVendor()
  const unsaveMutation = useUnsaveVendor()

  const isLoading = saveMutation.isPending || unsaveMutation.isPending

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated || !userId) {
      toast.info('Sign in to save vendors')
      navigate('/login')
      return
    }

    try {
      if (isSaved) {
        await unsaveMutation.mutateAsync({ userId, vendorId })
        toast.success('Vendor removed from saved')
      } else {
        await saveMutation.mutateAsync({ userId, vendorId })
        toast.success('Vendor saved!')
      }
    } catch (error) {
      toast.error('Something went wrong. Please try again.')
    }
  }

  // Icon-only variant (for cards, hero images)
  if (variant === 'icon') {
    return (
      <button
        onClick={handleClick}
        disabled={isLoading || isCheckingStatus}
        className={cn(
          'p-2 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-white',
          'bg-white/90 hover:bg-white shadow',
          'disabled:opacity-50 disabled:cursor-not-allowed',
          className
        )}
        aria-label={isSaved ? 'Remove from saved vendors' : 'Save vendor'}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 text-gray-600 animate-spin" />
        ) : (
          <Heart
            className={cn(
              'w-5 h-5 transition-colors',
              isSaved
                ? 'text-red-500 fill-red-500'
                : 'text-gray-600 hover:text-red-500'
            )}
          />
        )}
      </button>
    )
  }

  // Button variant (for sidebar, detail page)
  return (
    <Button
      onClick={handleClick}
      disabled={isLoading || isCheckingStatus}
      variant={isSaved ? 'default' : 'outline'}
      className={cn(
        'w-full gap-2',
        isSaved && 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100',
        className
      )}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <Heart
          className={cn(
            'w-4 h-4',
            isSaved ? 'fill-red-500 text-red-500' : ''
          )}
        />
      )}
      {isSaved ? 'Saved' : 'Save Vendor'}
    </Button>
  )
}

export default SaveVendorButton

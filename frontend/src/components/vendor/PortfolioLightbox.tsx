import { useState, useEffect, useCallback } from 'react'
import * as Dialog from '@radix-ui/react-dialog'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'

interface PortfolioLightboxProps {
  images: string[]
  initialIndex?: number
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * PortfolioLightbox - Fullscreen image gallery modal
 *
 * Features:
 * - Fullscreen overlay with bg-black/90
 * - Close button in top-right corner
 * - Left/right navigation arrows
 * - Image counter at bottom
 * - Keyboard navigation: Arrow keys for prev/next, Escape to close
 * - Wrap-around navigation (last -> first, first -> last)
 */
export function PortfolioLightbox({
  images,
  initialIndex = 0,
  open,
  onOpenChange,
}: PortfolioLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(initialIndex)

  // Reset to initial index when lightbox opens
  useEffect(() => {
    if (open) {
      setCurrentIndex(initialIndex)
    }
  }, [open, initialIndex])

  const goNext = useCallback(() => {
    setCurrentIndex((i) => (i + 1) % images.length)
  }, [images.length])

  const goPrev = useCallback(() => {
    setCurrentIndex((i) => (i - 1 + images.length) % images.length)
  }, [images.length])

  // Keyboard navigation
  useEffect(() => {
    if (!open) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight') {
        goNext()
      } else if (e.key === 'ArrowLeft') {
        goPrev()
      }
      // Note: Escape is handled by Radix Dialog automatically
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, goNext, goPrev])

  if (images.length === 0) return null

  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-black/90 z-50" />
        <Dialog.Content
          className="fixed inset-0 z-50 flex items-center justify-center"
          aria-describedby={undefined}
        >
          <Dialog.Title className="sr-only">
            Portfolio Image {currentIndex + 1} of {images.length}
          </Dialog.Title>

          {/* Close button */}
          <Dialog.Close
            className="absolute top-4 right-4 p-2 text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
            aria-label="Close lightbox"
          >
            <X className="w-8 h-8" />
          </Dialog.Close>

          {/* Previous button */}
          {images.length > 1 && (
            <button
              onClick={goPrev}
              className="absolute left-4 p-2 text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Previous image"
            >
              <ChevronLeft className="w-12 h-12" />
            </button>
          )}

          {/* Main image */}
          <img
            src={images[currentIndex]}
            alt={`Portfolio image ${currentIndex + 1} of ${images.length}`}
            className="max-h-[90vh] max-w-[90vw] object-contain"
          />

          {/* Next button */}
          {images.length > 1 && (
            <button
              onClick={goNext}
              className="absolute right-4 p-2 text-white hover:text-gray-300 transition-colors focus:outline-none focus:ring-2 focus:ring-white rounded"
              aria-label="Next image"
            >
              <ChevronRight className="w-12 h-12" />
            </button>
          )}

          {/* Image counter */}
          {images.length > 1 && (
            <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-lg font-medium bg-black/50 px-4 py-2 rounded-full">
              {currentIndex + 1} / {images.length}
            </div>
          )}
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

export default PortfolioLightbox

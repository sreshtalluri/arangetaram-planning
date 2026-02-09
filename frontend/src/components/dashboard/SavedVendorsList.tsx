import { Link } from 'react-router-dom'
import { Heart, Loader2, MapPin, Bookmark } from 'lucide-react'
import { Button } from '../ui/button'
import { Badge } from '../ui/badge'
import { useSavedVendors, useUnsaveVendor } from '../../hooks/useSavedVendors'
import { getCategoryByValue } from '../../lib/vendor-categories'
import { toast } from 'sonner'

interface SavedVendorsListProps {
  userId: string
}

const priceRangeLabel = (min: number | null, max: number | null): string => {
  if (min && max) {
    return `$${min.toLocaleString()} - $${max.toLocaleString()}`
  }
  if (min) {
    return `From $${min.toLocaleString()}`
  }
  if (max) {
    return `Up to $${max.toLocaleString()}`
  }
  return 'Price varies'
}

/**
 * Grid/list of saved vendors for the user dashboard
 * Shows vendor thumbnails, names, categories, and unsave action
 */
export function SavedVendorsList({ userId }: SavedVendorsListProps) {
  const { data: savedVendors, isLoading, error } = useSavedVendors(userId)
  const unsaveVendor = useUnsaveVendor()

  const handleUnsave = (vendorId: string, businessName: string) => {
    unsaveVendor.mutate(
      { userId, vendorId },
      {
        onSuccess: () => {
          toast.success(`Removed ${businessName} from saved vendors`)
        },
        onError: () => {
          toast.error('Failed to remove vendor. Please try again.')
        },
      }
    )
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-6 h-6 animate-spin text-[#0F4C5C]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[#888888]">
        Failed to load saved vendors
      </div>
    )
  }

  if (!savedVendors || savedVendors.length === 0) {
    return (
      <div className="bg-[#F9F8F4] rounded-lg p-6 text-center">
        <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center mx-auto mb-3">
          <Bookmark className="w-6 h-6 text-[#888888]" />
        </div>
        <p className="text-[#4A4A4A] mb-2">No saved vendors yet</p>
        <p className="text-sm text-[#888888] mb-4">
          Save vendors you like while browsing to compare later
        </p>
        <Link to="/vendors">
          <Button variant="outline" size="sm" className="btn-ghost">
            Browse Vendors
          </Button>
        </Link>
      </div>
    )
  }

  return (
    <div className="grid gap-3">
      {savedVendors.map(({ saved_vendor_id, vendor }) => {
        const category = getCategoryByValue(vendor.category)
        const imageUrl =
          vendor.profile_photo_url ||
          'https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg'

        return (
          <div
            key={saved_vendor_id}
            className="flex items-center gap-3 bg-white rounded-lg p-3 border border-[#E5E5E5] hover:border-[#0F4C5C] transition-colors group"
          >
            {/* Thumbnail */}
            <Link to={`/vendors/${vendor.id}`} className="shrink-0">
              <img
                src={imageUrl}
                alt={vendor.business_name}
                className="w-16 h-16 object-cover rounded-lg"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  target.src =
                    'https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg'
                }}
              />
            </Link>

            {/* Vendor Info */}
            <div className="flex-1 min-w-0">
              <Link
                to={`/vendors/${vendor.id}`}
                className="font-medium text-[#1A1A1A] hover:text-[#800020] line-clamp-1"
              >
                {vendor.business_name}
              </Link>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="secondary" className="text-xs">
                  {category?.label || vendor.category}
                </Badge>
                <span className="text-xs text-[#888888]">
                  {priceRangeLabel(vendor.price_min, vendor.price_max)}
                </span>
              </div>
              {vendor.service_areas && vendor.service_areas.length > 0 && (
                <div className="flex items-center gap-1 mt-1 text-xs text-[#888888]">
                  <MapPin className="w-3 h-3" />
                  <span className="line-clamp-1">
                    {vendor.service_areas.slice(0, 2).join(', ')}
                    {vendor.service_areas.length > 2 &&
                      ` +${vendor.service_areas.length - 2}`}
                  </span>
                </div>
              )}
            </div>

            {/* Unsave Button */}
            <Button
              variant="ghost"
              size="icon"
              className="shrink-0 text-[#800020] hover:text-[#800020] hover:bg-red-50"
              onClick={() => handleUnsave(vendor.id, vendor.business_name)}
              disabled={unsaveVendor.isPending}
              title="Remove from saved"
            >
              <Heart className="w-5 h-5 fill-current" />
            </Button>
          </div>
        )
      })}

      {/* View All Link */}
      {savedVendors.length >= 3 && (
        <Link
          to="/vendors?saved=true"
          className="text-center text-sm text-[#0F4C5C] hover:underline py-2"
        >
          View all saved vendors
        </Link>
      )}
    </div>
  )
}

export default SavedVendorsList

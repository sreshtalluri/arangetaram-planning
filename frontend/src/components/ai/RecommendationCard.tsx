import { X, MapPin, Sparkles } from 'lucide-react'
import { Button } from '../ui/button'
import type { RecommendedVendor } from '../../hooks/useRecommendations'

interface RecommendationCardProps {
  vendor: RecommendedVendor
  onDismiss: (vendorId: string) => void
  onViewProfile: (vendorId: string) => void
}

export function RecommendationCard({
  vendor,
  onDismiss,
  onViewProfile,
}: RecommendationCardProps) {
  return (
    <div className="relative bg-white rounded-xl border border-[#E5E5E5] overflow-hidden hover:shadow-md transition-shadow group">
      {/* Dismiss button */}
      <button
        onClick={() => onDismiss(vendor.id)}
        className="absolute top-2 right-2 p-1.5 bg-white/80 hover:bg-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity z-10"
        aria-label="Dismiss recommendation"
      >
        <X className="w-4 h-4 text-[#888888]" />
      </button>

      {/* Vendor image */}
      <div className="aspect-[4/3] bg-[#F9F8F4] overflow-hidden">
        {vendor.profile_photo_url ? (
          <img
            src={vendor.profile_photo_url}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-[#888888]">
            <span className="text-4xl font-light">
              {vendor.business_name.charAt(0)}
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Header */}
        <div>
          <h4 className="font-semibold text-[#1A1A1A] line-clamp-1">
            {vendor.business_name}
          </h4>
          <div className="flex items-center gap-2 text-sm text-[#888888] mt-0.5">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{vendor.service_areas?.[0] || 'Bay Area'}</span>
            <span className="text-[#E5E5E5]">|</span>
            <span className="font-medium text-[#0F4C5C]">
              {vendor.price_min && vendor.price_max
                ? `$${vendor.price_min} - $${vendor.price_max}`
                : vendor.price_min
                ? `From $${vendor.price_min}`
                : 'Contact for pricing'}
            </span>
          </div>
        </div>

        {/* AI Explanation */}
        <div className="flex gap-2 p-2.5 bg-[#FFF9E6] rounded-lg">
          <Sparkles className="w-4 h-4 text-[#C5A059] shrink-0 mt-0.5" />
          <p className="text-sm text-[#4A4A4A] leading-relaxed">
            {vendor.aiExplanation}
          </p>
        </div>

        {/* Action */}
        <Button
          onClick={() => onViewProfile(vendor.id)}
          variant="outline"
          className="w-full text-sm"
        >
          View Profile
        </Button>
      </div>
    </div>
  )
}

export default RecommendationCard

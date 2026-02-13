import React from 'react'
import {
  X, MapPin, Sparkles,
  Building2, UtensilsCrossed, Camera, Video, Palette,
  Music, Mic2, Mail, Crown, Gift,
} from 'lucide-react'
import { Button } from '../ui/button'
import type { RecommendedVendor } from '../../hooks/useRecommendations'

const CATEGORY_PLACEHOLDERS: Record<string, { icon: React.ElementType; bg: string }> = {
  venue:            { icon: Building2,        bg: 'bg-[#D4C5A9]' },
  catering:         { icon: UtensilsCrossed,  bg: 'bg-[#C5A059]/20' },
  photography:      { icon: Camera,           bg: 'bg-slate-200' },
  videography:      { icon: Video,            bg: 'bg-sky-100' },
  stage_decoration: { icon: Palette,          bg: 'bg-rose-100' },
  musicians:        { icon: Music,            bg: 'bg-purple-100' },
  nattuvanar:       { icon: Mic2,             bg: 'bg-[#800020]/10' },
  makeup_artist:    { icon: Sparkles,         bg: 'bg-pink-100' },
  invitations:      { icon: Mail,             bg: 'bg-amber-100' },
  costumes:         { icon: Crown,            bg: 'bg-[#0F4C5C]/10' },
  return_gifts:     { icon: Gift,             bg: 'bg-emerald-100' },
}

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
        ) : vendor.portfolio_images && vendor.portfolio_images.length > 0 ? (
          <img
            src={vendor.portfolio_images[0]}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
          />
        ) : (
          (() => {
            const placeholder = CATEGORY_PLACEHOLDERS[vendor.category]
            const Icon = placeholder?.icon || Sparkles
            const bgClass = placeholder?.bg || 'bg-[#F9F8F4]'
            return (
              <div className={`w-full h-full flex flex-col items-center justify-center gap-2 ${bgClass}`}>
                <Icon className="w-10 h-10 text-[#888888]/60" />
                <span className="text-sm font-medium text-[#888888]/80">
                  {vendor.business_name.charAt(0)}{vendor.business_name.split(' ')[1]?.charAt(0) || ''}
                </span>
              </div>
            )
          })()
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

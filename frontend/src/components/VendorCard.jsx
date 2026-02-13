import { Link } from "react-router-dom";
import { Star, MapPin } from "lucide-react";
import { Badge } from "./ui/badge";

const priceLabels = {
  "$": "Budget-Friendly",
  "$$": "Moderate",
  "$$$": "Premium",
  "$$$$": "Luxury",
};

const priceColors = {
  "$": "bg-green-100 text-green-800",
  "$$": "bg-blue-100 text-blue-800",
  "$$$": "bg-purple-100 text-purple-800",
  "$$$$": "bg-amber-100 text-amber-800",
};

export const VendorCard = ({ vendor }) => {
  // Prioritize profile photo, then portfolio images, then default
  const imageUrl = vendor.profile_photo_url || vendor.portfolio_images?.[0] || "https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg";

  return (
    <Link to={`/vendors/${vendor.id}`} data-testid={`vendor-card-${vendor.id}`}>
      <div className="card-vendor group cursor-pointer h-full flex flex-col">
        {/* Image */}
        <div className="vendor-image-container relative h-48">
          <img
            src={imageUrl}
            alt={vendor.business_name}
            className="vendor-image w-full h-full object-cover"
            onError={(e) => {
              e.target.src = "https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg";
            }}
          />
          <div className="absolute top-3 right-3">
            <Badge className={`${priceColors[vendor.price_range] || priceColors["$$"]} border-0`}>
              {vendor.price_range}
            </Badge>
          </div>
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h3 className="font-semibold text-[#1A1A1A] line-clamp-1 group-hover:text-[#800020] transition-colors">
              {vendor.business_name}
            </h3>
            {vendor.rating > 0 && (
              <div className="flex items-center gap-1 shrink-0">
                <Star className="w-4 h-4 text-[#C5A059] fill-[#C5A059]" />
                <span className="text-sm font-medium">{vendor.rating.toFixed(1)}</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-1 text-[#888888] text-sm mb-2">
            <MapPin className="w-3 h-3" />
            <span>{vendor.location || 'Location not set'}</span>
            {vendor.distance_miles != null && (
              <span className="ml-1 text-xs bg-[#0F4C5C]/10 text-[#0F4C5C] px-1.5 py-0.5 rounded-full">
                {vendor.distance_miles} mi
              </span>
            )}
          </div>

          <p className="text-sm text-[#4A4A4A] line-clamp-2 mb-3 flex-1">
            {vendor.description}
          </p>

          <div className="flex items-center justify-between pt-3 border-t border-[#E5E5E5]">
            <span className="text-xs text-[#888888]">{vendor.review_count} reviews</span>
            <span className="text-sm font-medium text-[#0F4C5C]">{vendor.price_estimate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default VendorCard;

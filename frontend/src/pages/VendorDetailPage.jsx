import { useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useVendorById } from "../hooks/useVendors";
import { useAuth } from "../hooks/useAuth";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Textarea } from "../components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../components/ui/dialog";
import { toast } from "sonner";
import {
  Star, MapPin, Phone, Mail, ArrowLeft, Check,
  Loader2, Users, DollarSign
} from "lucide-react";
import { PortfolioLightbox } from "../components/vendor/PortfolioLightbox";
import { AvailabilityBadge } from "../components/discovery/AvailabilityBadge";
import { SaveVendorButton } from "../components/discovery/SaveVendorButton";

const priceColors = {
  "$": "bg-green-100 text-green-800",
  "$$": "bg-blue-100 text-blue-800",
  "$$$": "bg-purple-100 text-purple-800",
  "$$$$": "bg-amber-100 text-amber-800",
};

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isAuthenticated } = useAuth();

  const { data: vendor, isLoading, error } = useVendorById(id);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [message, setMessage] = useState("");

  // Lightbox state
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  // Get event date from URL params for availability check
  const eventDate = searchParams.get("eventDate");

  // Handle error state
  if (error) {
    toast.error("Vendor not found");
    navigate("/vendors");
    return null;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C]" />
        </div>
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <p className="text-gray-500">Vendor not found</p>
        </div>
      </div>
    );
  }

  const imageUrl = vendor.profile_photo_url || vendor.portfolio_images?.[0] || "https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg";

  const handleBookClick = async () => {
    if (!isAuthenticated) {
      toast.info("Please sign in to book vendors");
      navigate("/login");
    } else {
      setBookingOpen(true);
    }
  };

  const handleBookingRequest = async () => {
    // TODO: Implement booking request via Supabase
    toast.success("Booking request sent! (Demo mode)");
    setBookingOpen(false);
    setMessage("");
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Back Button */}
        <button
          onClick={() => navigate(-1)}
          className="inline-flex items-center text-[#800020] hover:text-[#600018] mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Vendors
        </button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Hero Image */}
            <div className="relative h-[400px] rounded-2xl overflow-hidden">
              <img
                src={imageUrl}
                alt={vendor.business_name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.src = "https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg";
                }}
              />
              {/* Save button on hero */}
              <div className="absolute top-4 left-4">
                <SaveVendorButton vendorId={id} variant="icon" />
              </div>
              <div className="absolute top-4 right-4">
                <Badge className={`${priceColors[vendor.price_range]} border-0 text-sm px-3 py-1`}>
                  {vendor.price_range}
                </Badge>
              </div>
            </div>

            {/* Title & Rating */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <div className="space-y-2">
                  <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                    {vendor.business_name}
                  </h1>
                  {/* Availability Badge - shows when eventDate param present */}
                  <AvailabilityBadge vendorId={id} eventDate={eventDate} />
                </div>
                {vendor.rating > 0 && (
                  <div className="flex items-center gap-2 bg-white rounded-full px-4 py-2 shadow-sm">
                    <Star className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
                    <span className="font-semibold">{vendor.rating.toFixed(1)}</span>
                    <span className="text-[#888888]">({vendor.review_count} reviews)</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 text-[#4A4A4A]">
                <MapPin className="w-4 h-4" />
                <span>{vendor.location}</span>
              </div>
            </div>

            {/* Description */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">About</h2>
              <p className="text-[#4A4A4A] leading-relaxed">{vendor.description || "No description available."}</p>
            </div>

            {/* Service Areas */}
            {vendor.service_areas && vendor.service_areas.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Service Areas</h2>
                <div className="flex flex-wrap gap-2">
                  {vendor.service_areas.map((area, idx) => (
                    <Badge key={idx} variant="secondary" className="bg-[#F9F8F4]">
                      {area}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {vendor.portfolio_images && vendor.portfolio_images.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.portfolio_images.map((img, idx) => (
                    <button
                      key={idx}
                      onClick={() => {
                        setLightboxIndex(idx);
                        setLightboxOpen(true);
                      }}
                      className="relative h-32 w-full overflow-hidden rounded-lg hover:opacity-90 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:ring-offset-2"
                    >
                      <img
                        src={img}
                        alt={`${vendor.business_name} portfolio ${idx + 1}`}
                        className="h-full w-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Booking Card */}
            <div className="bg-white rounded-xl p-6 shadow-sm sticky top-24">
              <div className="mb-6">
                <p className="text-sm text-[#888888] mb-1">Starting from</p>
                <p className="text-2xl font-bold text-[#1A1A1A]">{vendor.price_estimate}</p>
              </div>

              <Button
                onClick={handleBookClick}
                className="w-full btn-primary mb-3"
                data-testid="request-booking-btn"
              >
                Send Inquiry
              </Button>

              {/* Save Button */}
              <SaveVendorButton vendorId={id} variant="button" className="mb-4" />

              <p className="text-xs text-center text-[#888888]">
                Free to inquire • No commitment required
              </p>

              {/* Contact Info */}
              <div className="mt-6 pt-6 border-t border-[#E5E5E5] space-y-4">
                <h3 className="font-semibold text-[#1A1A1A]">Contact Information</h3>
                {vendor.contact_phone && (
                  <a href={`tel:${vendor.contact_phone}`} className="flex items-center gap-3 text-[#4A4A4A] hover:text-[#0F4C5C]">
                    <Phone className="w-4 h-4" />
                    <span>{vendor.contact_phone}</span>
                  </a>
                )}
                {vendor.contact_email && (
                  <a href={`mailto:${vendor.contact_email}`} className="flex items-center gap-3 text-[#4A4A4A] hover:text-[#0F4C5C]">
                    <Mail className="w-4 h-4" />
                    <span>{vendor.contact_email}</span>
                  </a>
                )}
                {!vendor.contact_phone && !vendor.contact_email && (
                  <p className="text-sm text-[#888888]">Contact info available after booking request</p>
                )}
              </div>
            </div>

            {/* Quick Facts */}
            <div className="bg-white rounded-xl p-6 shadow-sm">
              <h3 className="font-semibold text-[#1A1A1A] mb-4">Quick Facts</h3>
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F9F8F4] flex items-center justify-center">
                    <DollarSign className="w-5 h-5 text-[#0F4C5C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#888888]">Price Range</p>
                    <p className="font-medium text-[#1A1A1A]">{vendor.price_estimate}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F9F8F4] flex items-center justify-center">
                    <MapPin className="w-5 h-5 text-[#0F4C5C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#888888]">Location</p>
                    <p className="font-medium text-[#1A1A1A]">{vendor.location}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#F9F8F4] flex items-center justify-center">
                    <Users className="w-5 h-5 text-[#0F4C5C]" />
                  </div>
                  <div>
                    <p className="text-sm text-[#888888]">Reviews</p>
                    <p className="font-medium text-[#1A1A1A]">{vendor.review_count} reviews</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Booking Dialog */}
      <Dialog open={bookingOpen} onOpenChange={setBookingOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Send Inquiry</DialogTitle>
            <DialogDescription>
              Send an inquiry to {vendor.business_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Message (Optional)</label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Add any specific requirements or questions..."
                className="input-styled resize-none"
                rows={4}
                data-testid="booking-message"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setBookingOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleBookingRequest}
              className="btn-primary"
              data-testid="submit-booking-btn"
            >
              Send Inquiry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Portfolio Lightbox */}
      {vendor.portfolio_images && vendor.portfolio_images.length > 0 && (
        <PortfolioLightbox
          images={vendor.portfolio_images}
          initialIndex={lightboxIndex}
          open={lightboxOpen}
          onOpenChange={setLightboxOpen}
        />
      )}
    </div>
  );
}

import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { vendorAPI, bookingAPI, eventAPI } from "../lib/api";
import { useAuth } from "../lib/auth";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { toast } from "sonner";
import {
  Star, MapPin, Phone, Mail, ArrowLeft, Check,
  Loader2, Calendar, Users, DollarSign
} from "lucide-react";

const priceColors = {
  "$": "bg-green-100 text-green-800",
  "$$": "bg-blue-100 text-blue-800",
  "$$$": "bg-purple-100 text-purple-800",
  "$$$$": "bg-amber-100 text-amber-800",
};

export default function VendorDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated, continueAsGuest } = useAuth();
  
  const [vendor, setVendor] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingOpen, setBookingOpen] = useState(false);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [events, setEvents] = useState([]);
  const [selectedEvent, setSelectedEvent] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const loadVendor = async () => {
      try {
        const response = await vendorAPI.getById(id);
        setVendor(response.data);
      } catch (error) {
        toast.error("Vendor not found");
        navigate("/vendors");
      } finally {
        setLoading(false);
      }
    };
    loadVendor();
  }, [id, navigate]);

  useEffect(() => {
    const loadEvents = async () => {
      if (isAuthenticated()) {
        try {
          const response = await eventAPI.getAll();
          setEvents(response.data.filter(e => e.status === "planning"));
        } catch (error) {
          console.error("Failed to load events:", error);
        }
      }
    };
    loadEvents();
  }, [isAuthenticated]);

  const handleBookingRequest = async () => {
    if (!selectedEvent) {
      toast.error("Please select an event");
      return;
    }

    setBookingLoading(true);
    try {
      await bookingAPI.create({
        event_id: selectedEvent,
        vendor_id: vendor.id,
        message: message,
      });
      toast.success("Booking request sent successfully!");
      setBookingOpen(false);
      setMessage("");
      setSelectedEvent("");
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to send booking request");
    } finally {
      setBookingLoading(false);
    }
  };

  const handleBookClick = async () => {
    if (!isAuthenticated()) {
      // Create guest account and redirect to plan
      try {
        await continueAsGuest();
        toast.info("Please create an event first to book vendors");
        navigate("/plan");
      } catch (error) {
        toast.error("Something went wrong");
      }
    } else if (events.length === 0) {
      toast.info("Please create an event first to book vendors");
      navigate("/plan");
    } else {
      setBookingOpen(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C]" />
        </div>
      </div>
    );
  }

  if (!vendor) return null;

  const imageUrl = vendor.portfolio_images?.[0] || "https://images.pexels.com/photos/16985130/pexels-photo-16985130.jpeg";

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
              <div className="absolute top-4 right-4">
                <Badge className={`${priceColors[vendor.price_range]} border-0 text-sm px-3 py-1`}>
                  {vendor.price_range}
                </Badge>
              </div>
            </div>

            {/* Title & Rating */}
            <div>
              <div className="flex items-start justify-between gap-4 mb-3">
                <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
                  {vendor.business_name}
                </h1>
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
              <p className="text-[#4A4A4A] leading-relaxed">{vendor.description}</p>
            </div>

            {/* Services */}
            {vendor.services && vendor.services.length > 0 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Services Included</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {vendor.services.map((service, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#0F4C5C]/10 flex items-center justify-center">
                        <Check className="w-3 h-3 text-[#0F4C5C]" />
                      </div>
                      <span className="text-[#4A4A4A]">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {vendor.portfolio_images && vendor.portfolio_images.length > 1 && (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">Gallery</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {vendor.portfolio_images.map((img, idx) => (
                    <img
                      key={idx}
                      src={img}
                      alt={`${vendor.business_name} portfolio ${idx + 1}`}
                      className="h-32 w-full object-cover rounded-lg"
                    />
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
                className="w-full btn-primary mb-4"
                data-testid="request-booking-btn"
              >
                Request Booking
              </Button>

              <p className="text-xs text-center text-[#888888]">
                Free to request • No commitment required
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
            <DialogTitle>Request Booking</DialogTitle>
            <DialogDescription>
              Send a booking request to {vendor.business_name}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Event</label>
              <Select value={selectedEvent} onValueChange={setSelectedEvent}>
                <SelectTrigger data-testid="select-event">
                  <SelectValue placeholder="Choose an event" />
                </SelectTrigger>
                <SelectContent>
                  {events.map((event) => (
                    <SelectItem key={event.id} value={event.id}>
                      {event.event_name} - {event.event_date}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

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
              disabled={bookingLoading}
              className="btn-primary"
              data-testid="submit-booking-btn"
            >
              {bookingLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Sending...
                </>
              ) : (
                "Send Request"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

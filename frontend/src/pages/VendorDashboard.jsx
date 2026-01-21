import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../lib/auth";
import { vendorAPI, bookingAPI } from "../lib/api";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
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
  Store, Calendar, MapPin, DollarSign, Plus, Edit2,
  Loader2, Clock, CheckCircle2, XCircle, User, Star
} from "lucide-react";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
};

const categories = [
  { value: "venue", label: "Venue" },
  { value: "catering", label: "Catering" },
  { value: "photographer", label: "Photographer" },
  { value: "videographer", label: "Videographer" },
  { value: "decorations", label: "Decorations" },
  { value: "musicians", label: "Musicians" },
];

const priceRanges = [
  { value: "$", label: "$ - Budget" },
  { value: "$$", label: "$$ - Moderate" },
  { value: "$$$", label: "$$$ - Premium" },
  { value: "$$$$", label: "$$$$ - Luxury" },
];

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, isAuthenticated, isVendor } = useAuth();
  const [vendorProfile, setVendorProfile] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [updatingBooking, setUpdatingBooking] = useState(null);

  const [formData, setFormData] = useState({
    business_name: "",
    category: "",
    description: "",
    location: "",
    price_range: "$$",
    price_estimate: "",
    services: "",
    contact_phone: "",
    contact_email: "",
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate("/login");
      return;
    }
    if (!isVendor()) {
      navigate("/dashboard");
      return;
    }
    loadData();
  }, [isAuthenticated, isVendor, navigate]);

  const loadData = async () => {
    setLoading(true);
    try {
      const bookingsRes = await bookingAPI.getVendorBookings();
      setBookings(bookingsRes.data);

      try {
        const profileRes = await vendorAPI.getMyProfile();
        setVendorProfile(profileRes.data);
        setFormData({
          business_name: profileRes.data.business_name || "",
          category: profileRes.data.category || "",
          description: profileRes.data.description || "",
          location: profileRes.data.location || "",
          price_range: profileRes.data.price_range || "$$",
          price_estimate: profileRes.data.price_estimate || "",
          services: profileRes.data.services?.join(", ") || "",
          contact_phone: profileRes.data.contact_phone || "",
          contact_email: profileRes.data.contact_email || "",
        });
      } catch (e) {
        // No profile yet
        setProfileDialogOpen(true);
      }
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFormChange = (field, value) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleSaveProfile = async () => {
    if (!formData.business_name || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields");
      return;
    }

    setSavingProfile(true);
    try {
      const profileData = {
        business_name: formData.business_name,
        category: formData.category,
        description: formData.description,
        location: formData.location,
        price_range: formData.price_range,
        price_estimate: formData.price_estimate,
        services: formData.services.split(",").map(s => s.trim()).filter(s => s),
        contact_phone: formData.contact_phone,
        contact_email: formData.contact_email,
      };

      if (vendorProfile) {
        await vendorAPI.update(vendorProfile.id, profileData);
        toast.success("Profile updated successfully");
      } else {
        const res = await vendorAPI.create(profileData);
        setVendorProfile(res.data);
        toast.success("Profile created successfully");
      }
      setProfileDialogOpen(false);
      loadData();
    } catch (error) {
      toast.error(error.response?.data?.detail || "Failed to save profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleBookingUpdate = async (bookingId, status) => {
    setUpdatingBooking(bookingId);
    try {
      await bookingAPI.update(bookingId, { status });
      toast.success(`Booking ${status}`);
      loadData();
    } catch (error) {
      toast.error("Failed to update booking");
    } finally {
      setUpdatingBooking(null);
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

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
              Vendor Dashboard
            </h1>
            <p className="text-[#4A4A4A]">Manage your profile and booking requests</p>
          </div>
          <Button onClick={() => setProfileDialogOpen(true)} className="btn-secondary">
            <Edit2 className="w-4 h-4 mr-2" />
            {vendorProfile ? "Edit Profile" : "Create Profile"}
          </Button>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="bg-white border border-[#E5E5E5] p-1">
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-6"
              data-testid="profile-tab"
            >
              My Profile
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-6"
              data-testid="vendor-bookings-tab"
            >
              Booking Requests ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            {vendorProfile ? (
              <div className="bg-white rounded-xl p-6 shadow-sm">
                <div className="grid md:grid-cols-3 gap-8">
                  {/* Profile Image */}
                  <div className="md:col-span-1">
                    <div className="aspect-square rounded-xl bg-[#F9F8F4] flex items-center justify-center overflow-hidden">
                      {vendorProfile.portfolio_images?.[0] ? (
                        <img
                          src={vendorProfile.portfolio_images[0]}
                          alt={vendorProfile.business_name}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Store className="w-16 h-16 text-[#888888]" />
                      )}
                    </div>
                    <div className="mt-4 text-center">
                      <div className="flex items-center justify-center gap-1 mb-1">
                        <Star className="w-5 h-5 text-[#C5A059] fill-[#C5A059]" />
                        <span className="font-semibold">{vendorProfile.rating?.toFixed(1) || "0.0"}</span>
                      </div>
                      <p className="text-sm text-[#888888]">{vendorProfile.review_count || 0} reviews</p>
                    </div>
                  </div>

                  {/* Profile Details */}
                  <div className="md:col-span-2 space-y-6">
                    <div>
                      <h2 className="text-2xl font-bold text-[#1A1A1A]">{vendorProfile.business_name}</h2>
                      <Badge className="mt-2 bg-[#0F4C5C]/10 text-[#0F4C5C] border-0">
                        {vendorProfile.category}
                      </Badge>
                    </div>

                    <p className="text-[#4A4A4A]">{vendorProfile.description}</p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-[#888888]" />
                        <span className="text-[#4A4A4A]">{vendorProfile.location}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-[#888888]" />
                        <span className="text-[#4A4A4A]">{vendorProfile.price_estimate}</span>
                      </div>
                    </div>

                    {vendorProfile.services?.length > 0 && (
                      <div>
                        <h3 className="font-semibold text-[#1A1A1A] mb-2">Services</h3>
                        <div className="flex flex-wrap gap-2">
                          {vendorProfile.services.map((service, idx) => (
                            <Badge key={idx} variant="outline" className="border-[#E5E5E5]">
                              {service}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
                  <Store className="w-8 h-8 text-[#888888]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No profile yet</h3>
                <p className="text-[#4A4A4A] mb-6">
                  Create your vendor profile to start receiving booking requests
                </p>
                <Button onClick={() => setProfileDialogOpen(true)} className="btn-primary">
                  <Plus className="w-4 h-4 mr-2" />
                  Create Profile
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length > 0 ? (
              <div className="grid gap-4">
                {bookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="bg-white rounded-xl p-6 shadow-sm"
                    data-testid={`vendor-booking-card-${booking.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                      <div className="flex items-start gap-4">
                        <div className="w-12 h-12 rounded-full bg-[#0F4C5C] flex items-center justify-center shrink-0">
                          <User className="w-6 h-6 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-[#1A1A1A]">
                            {booking.user?.name || "Guest User"}
                          </h3>
                          <p className="text-sm text-[#4A4A4A]">
                            {booking.user?.email}
                          </p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-[#888888]">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{booking.event_date}</span>
                            </div>
                          </div>
                          <p className="text-sm text-[#4A4A4A] mt-2">
                            Event: {booking.event?.event_name}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-3">
                        <Badge className={`${statusColors[booking.status]} border-0`}>
                          {booking.status}
                        </Badge>

                        {booking.status === "pending" && (
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleBookingUpdate(booking.id, "declined")}
                              disabled={updatingBooking === booking.id}
                              className="border-red-200 text-red-600 hover:bg-red-50"
                            >
                              {updatingBooking === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <XCircle className="w-4 h-4 mr-1" />
                                  Decline
                                </>
                              )}
                            </Button>
                            <Button
                              size="sm"
                              onClick={() => handleBookingUpdate(booking.id, "accepted")}
                              disabled={updatingBooking === booking.id}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              {updatingBooking === booking.id ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                              ) : (
                                <>
                                  <CheckCircle2 className="w-4 h-4 mr-1" />
                                  Accept
                                </>
                              )}
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>

                    {booking.message && (
                      <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                        <p className="text-sm text-[#4A4A4A]">
                          <span className="font-medium">Message:</span> {booking.message}
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#888888]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No booking requests</h3>
                <p className="text-[#4A4A4A]">
                  Booking requests from families will appear here
                </p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Profile Dialog */}
      <Dialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen}>
        <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{vendorProfile ? "Edit" : "Create"} Vendor Profile</DialogTitle>
            <DialogDescription>
              Fill in your business details to start receiving booking requests
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="business_name">Business Name *</Label>
              <Input
                id="business_name"
                value={formData.business_name}
                onChange={(e) => handleFormChange("business_name", e.target.value)}
                placeholder="Your business name"
                className="input-styled"
                data-testid="vendor-business-name"
              />
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select value={formData.category} onValueChange={(v) => handleFormChange("category", v)}>
                <SelectTrigger className="input-styled" data-testid="vendor-category">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat.value} value={cat.value}>
                      {cat.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleFormChange("description", e.target.value)}
                placeholder="Describe your services..."
                className="input-styled resize-none"
                rows={3}
                data-testid="vendor-description"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => handleFormChange("location", e.target.value)}
                  placeholder="e.g., Fremont, CA"
                  className="input-styled"
                  data-testid="vendor-location"
                />
              </div>

              <div className="space-y-2">
                <Label>Price Range</Label>
                <Select value={formData.price_range} onValueChange={(v) => handleFormChange("price_range", v)}>
                  <SelectTrigger className="input-styled">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {priceRanges.map((pr) => (
                      <SelectItem key={pr.value} value={pr.value}>
                        {pr.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="price_estimate">Price Estimate</Label>
              <Input
                id="price_estimate"
                value={formData.price_estimate}
                onChange={(e) => handleFormChange("price_estimate", e.target.value)}
                placeholder="e.g., $2,000 - $3,500"
                className="input-styled"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="services">Services (comma-separated)</Label>
              <Input
                id="services"
                value={formData.services}
                onChange={(e) => handleFormChange("services", e.target.value)}
                placeholder="e.g., Full coverage, Edited photos, Online gallery"
                className="input-styled"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="contact_phone">Phone</Label>
                <Input
                  id="contact_phone"
                  value={formData.contact_phone}
                  onChange={(e) => handleFormChange("contact_phone", e.target.value)}
                  placeholder="(408) 555-0101"
                  className="input-styled"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="contact_email">Email</Label>
                <Input
                  id="contact_email"
                  type="email"
                  value={formData.contact_email}
                  onChange={(e) => handleFormChange("contact_email", e.target.value)}
                  placeholder="you@business.com"
                  className="input-styled"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setProfileDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={savingProfile}
              className="btn-primary"
              data-testid="save-vendor-profile"
            >
              {savingProfile ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                "Save Profile"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

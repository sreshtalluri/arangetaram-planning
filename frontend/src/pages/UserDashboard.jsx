import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { eventAPI, bookingAPI, vendorAPI } from "../lib/api";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { toast } from "sonner";
import {
  Calendar, MapPin, Users, DollarSign, Plus,
  Loader2, Clock, CheckCircle2, XCircle, Building2
} from "lucide-react";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  accepted: "bg-green-100 text-green-800",
  declined: "bg-red-100 text-red-800",
  planning: "bg-blue-100 text-blue-800",
  confirmed: "bg-green-100 text-green-800",
  completed: "bg-gray-100 text-gray-800",
};

const statusIcons = {
  pending: Clock,
  accepted: CheckCircle2,
  declined: XCircle,
};

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();
  const [events, setEvents] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // ProtectedRoute handles auth check, just load data when authenticated
    if (!authLoading && user) {
      loadData();
    }
  }, [authLoading, user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [eventsRes, bookingsRes] = await Promise.all([
        eventAPI.getAll(),
        bookingAPI.getUserBookings(),
      ]);
      setEvents(eventsRes.data);
      setBookings(bookingsRes.data);
    } catch (error) {
      console.error("Failed to load data:", error);
    } finally {
      setLoading(false);
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
              Welcome, {profile?.full_name || user?.email}
            </h1>
            <p className="text-[#4A4A4A]">Manage your events and bookings</p>
          </div>
          <Button onClick={() => navigate("/plan")} className="btn-primary">
            <Plus className="w-4 h-4 mr-2" />
            Plan New Event
          </Button>
        </div>

        <Tabs defaultValue="events" className="space-y-6">
          <TabsList className="bg-white border border-[#E5E5E5] p-1">
            <TabsTrigger
              value="events"
              className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-6"
              data-testid="events-tab"
            >
              My Events ({events.length})
            </TabsTrigger>
            <TabsTrigger
              value="bookings"
              className="data-[state=active]:bg-[#0F4C5C] data-[state=active]:text-white rounded-lg px-6"
              data-testid="bookings-tab"
            >
              Booking Requests ({bookings.length})
            </TabsTrigger>
          </TabsList>

          {/* Events Tab */}
          <TabsContent value="events" className="space-y-4">
            {events.length > 0 ? (
              <div className="grid gap-4">
                {events.map((event) => (
                  <div
                    key={event.id}
                    className="bg-white rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                    data-testid={`event-card-${event.id}`}
                  >
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-3">
                          <h3 className="text-xl font-semibold text-[#1A1A1A]">
                            {event.event_name}
                          </h3>
                          <Badge className={`${statusColors[event.status]} border-0`}>
                            {event.status}
                          </Badge>
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-[#4A4A4A]">
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            <span>{event.event_date}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>{event.guest_count} guests</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <DollarSign className="w-4 h-4" />
                            <span>{event.budget}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            <span>{event.location_preference}</span>
                          </div>
                        </div>
                        {event.selected_vendors?.length > 0 && (
                          <p className="text-sm text-[#888888]">
                            {event.selected_vendors.length} vendors selected
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => navigate("/vendors")}
                          className="btn-ghost"
                        >
                          Browse Vendors
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
                  <Calendar className="w-8 h-8 text-[#888888]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No events yet</h3>
                <p className="text-[#4A4A4A] mb-6">
                  Start planning your Arangetram today
                </p>
                <Button onClick={() => navigate("/plan")} className="btn-primary">
                  Plan Your Event
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Bookings Tab */}
          <TabsContent value="bookings" className="space-y-4">
            {bookings.length > 0 ? (
              <div className="grid gap-4">
                {bookings.map((booking) => {
                  const StatusIcon = statusIcons[booking.status] || Clock;
                  return (
                    <div
                      key={booking.id}
                      className="bg-white rounded-xl p-6 shadow-sm"
                      data-testid={`booking-card-${booking.id}`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-start gap-4">
                          <div className="w-12 h-12 rounded-lg bg-[#F9F8F4] flex items-center justify-center shrink-0">
                            <Building2 className="w-6 h-6 text-[#0F4C5C]" />
                          </div>
                          <div>
                            <Link
                              to={`/vendors/${booking.vendor?.id}`}
                              className="text-lg font-semibold text-[#1A1A1A] hover:text-[#800020]"
                            >
                              {booking.vendor?.business_name || "Vendor"}
                            </Link>
                            <p className="text-sm text-[#4A4A4A]">
                              {booking.vendor?.category} • {booking.vendor?.location}
                            </p>
                            <p className="text-sm text-[#888888] mt-1">
                              For: {booking.event?.event_name} on {booking.event_date}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className={`${statusColors[booking.status]} border-0 flex items-center gap-1`}>
                            <StatusIcon className="w-3 h-3" />
                            {booking.status}
                          </Badge>
                        </div>
                      </div>
                      {booking.message && (
                        <div className="mt-4 pt-4 border-t border-[#E5E5E5]">
                          <p className="text-sm text-[#4A4A4A]">
                            <span className="font-medium">Your message:</span> {booking.message}
                          </p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white rounded-xl p-12 shadow-sm text-center">
                <div className="w-16 h-16 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
                  <Building2 className="w-8 h-8 text-[#888888]" />
                </div>
                <h3 className="text-xl font-semibold text-[#1A1A1A] mb-2">No booking requests</h3>
                <p className="text-[#4A4A4A] mb-6">
                  Browse vendors and send booking requests
                </p>
                <Button onClick={() => navigate("/vendors")} className="btn-primary">
                  Browse Vendors
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

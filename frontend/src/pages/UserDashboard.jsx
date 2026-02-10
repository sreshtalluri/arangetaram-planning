import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useEvents } from "../hooks/useEvents";
import Navbar from "../components/Navbar";
import { EventCard } from "../components/dashboard/EventCard";
import { SavedVendorsList } from "../components/dashboard/SavedVendorsList";
import { MyInquiriesList } from "../components/dashboard/MyInquiriesList";
import { RecommendationsSection } from "../components/ai/RecommendationsSection";
import { Button } from "../components/ui/button";
import {
  Calendar, Plus, Loader2, Search, ArrowRight, Sparkles, MessageSquare
} from "lucide-react";

export default function UserDashboard() {
  const navigate = useNavigate();
  const { user, profile, loading: authLoading } = useAuth();

  // Fetch events using Supabase hook
  const { data: events = [], isLoading: eventsLoading } = useEvents(user?.id);

  // Combined loading state
  const isLoading = authLoading || eventsLoading;

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

  // Get display name
  const displayName = profile?.full_name || user?.email?.split("@")[0] || "there";

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1
              className="text-3xl font-bold text-[#1A1A1A]"
              style={{ fontFamily: "Playfair Display, serif" }}
            >
              Welcome, {displayName}
            </h1>
            <p className="text-[#4A4A4A]">
              Manage your Arangetram planning
            </p>
          </div>
          <Button
            onClick={() => navigate("/events/create")}
            className="btn-primary"
          >
            <Plus className="w-4 h-4 mr-2" />
            Create Event
          </Button>
        </header>

        {/* Main Content Grid */}
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column - Events (spans 2 cols on lg) */}
          <div className="lg:col-span-2 space-y-6">
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">
                  My Events
                </h2>
                {events.length > 0 && (
                  <span className="text-sm text-[#888888]">
                    {events.length} event{events.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {events.length > 0 ? (
                <div className="space-y-4">
                  {events.map((event) => (
                    <EventCard
                      key={event.id}
                      event={event}
                      onEdit={() =>
                        navigate(`/events/create?edit=${event.id}`)
                      }
                      onBrowseVendors={() =>
                        navigate(`/vendors?date=${event.event_date}`)
                      }
                    />
                  ))}
                </div>
              ) : (
                <EmptyEventsState onCreateEvent={() => navigate("/events/create")} />
              )}
            </section>

            {/* AI Recommendations Section */}
            {events.length > 0 && (
              <section className="mt-8">
                <RecommendationsSection event={events[0]} />
              </section>
            )}
          </div>

          {/* Right Column - Saved Vendors + Quick Actions */}
          <div className="space-y-6">
            {/* Saved Vendors Section */}
            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
                Saved Vendors
              </h2>
              <SavedVendorsList userId={user?.id} />
            </section>

            {/* My Inquiries Section */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold text-[#1A1A1A]">
                  My Inquiries
                </h2>
              </div>
              <MyInquiriesList userId={user?.id} />
            </section>

            {/* Quick Actions Section */}
            <section>
              <h2 className="text-xl font-semibold text-[#1A1A1A] mb-4">
                Quick Actions
              </h2>
              <div className="space-y-3">
                <QuickActionCard
                  icon={Plus}
                  title="Create Event"
                  description="Start planning your Arangetram"
                  onClick={() => navigate("/events/create")}
                />
                <QuickActionCard
                  icon={Search}
                  title="Browse All Vendors"
                  description="Explore venues, caterers, and more"
                  onClick={() => navigate("/vendors")}
                />
                <QuickActionCard
                  icon={Sparkles}
                  title="Get Recommendations"
                  description="AI-powered vendor suggestions"
                  onClick={() => navigate("/chat")}
                />
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Empty state component for when user has no events
 */
function EmptyEventsState({ onCreateEvent }) {
  return (
    <div className="bg-white rounded-xl p-12 shadow-sm text-center">
      <div className="w-16 h-16 rounded-full bg-[#F9F8F4] flex items-center justify-center mx-auto mb-4">
        <Calendar className="w-8 h-8 text-[#888888]" />
      </div>
      <h3
        className="text-xl font-semibold text-[#1A1A1A] mb-2"
        style={{ fontFamily: "Playfair Display, serif" }}
      >
        No events yet
      </h3>
      <p className="text-[#4A4A4A] mb-6 max-w-sm mx-auto">
        Start planning your Arangetram by creating your first event. We'll help
        you find the perfect vendors.
      </p>
      <Button onClick={onCreateEvent} className="btn-primary">
        <Plus className="w-4 h-4 mr-2" />
        Create Your First Event
      </Button>
    </div>
  );
}

/**
 * Quick action card component for sidebar actions
 */
function QuickActionCard({ icon: Icon, title, description, onClick }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 bg-white rounded-lg p-4 border border-[#E5E5E5] hover:border-[#0F4C5C] hover:shadow-sm transition-all text-left group"
    >
      <div className="w-10 h-10 rounded-lg bg-[#F9F8F4] flex items-center justify-center shrink-0 group-hover:bg-[#0F4C5C] transition-colors">
        <Icon className="w-5 h-5 text-[#0F4C5C] group-hover:text-white transition-colors" />
      </div>
      <div className="flex-1 min-w-0">
        <h4 className="font-medium text-[#1A1A1A] group-hover:text-[#0F4C5C] transition-colors">
          {title}
        </h4>
        <p className="text-sm text-[#888888] line-clamp-1">{description}</p>
      </div>
      <ArrowRight className="w-4 h-4 text-[#888888] group-hover:text-[#0F4C5C] transition-colors shrink-0" />
    </button>
  );
}

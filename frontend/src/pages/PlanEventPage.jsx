import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { eventAPI, aiAPI, vendorAPI } from "../lib/api";
import Navbar from "../components/Navbar";
import AIChat from "../components/AIChat";
import VendorCard from "../components/VendorCard";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Calendar } from "../components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import { Checkbox } from "../components/ui/checkbox";
import { toast } from "sonner";
import { format } from "date-fns";
import {
  CalendarIcon, Users, DollarSign, MapPin, ArrowRight, ArrowLeft,
  Loader2, Building2, UtensilsCrossed, Camera, Video, Flower2, Music, Sparkles
} from "lucide-react";

const categories = [
  { id: "venue", name: "Venue", icon: Building2 },
  { id: "catering", name: "Catering", icon: UtensilsCrossed },
  { id: "photographer", name: "Photographer", icon: Camera },
  { id: "videographer", name: "Videographer", icon: Video },
  { id: "decorations", name: "Decorations", icon: Flower2 },
  { id: "musicians", name: "Musicians", icon: Music },
];

const budgetOptions = [
  { value: "$", label: "Budget-Friendly ($)" },
  { value: "$$", label: "Moderate ($$)" },
  { value: "$$$", label: "Premium ($$$)" },
  { value: "$$$$", label: "Luxury ($$$$)" },
];

export default function PlanEventPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated, continueAsGuest } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [recommendations, setRecommendations] = useState({});
  const [createdEvent, setCreatedEvent] = useState(null);

  const [eventData, setEventData] = useState({
    event_name: "",
    event_date: null,
    event_time: "",
    guest_count: 100,
    budget: "$$",
    location_preference: "Bay Area",
    special_requirements: "",
    categories_needed: ["venue", "catering", "photographer", "videographer", "decorations", "musicians"],
  });

  const handleInputChange = (field, value) => {
    setEventData({ ...eventData, [field]: value });
  };

  const toggleCategory = (categoryId) => {
    const current = eventData.categories_needed;
    if (current.includes(categoryId)) {
      handleInputChange("categories_needed", current.filter(c => c !== categoryId));
    } else {
      handleInputChange("categories_needed", [...current, categoryId]);
    }
  };

  const handleStep1Submit = async () => {
    if (!eventData.event_name) {
      toast.error("Please enter an event name");
      return;
    }
    if (!eventData.event_date) {
      toast.error("Please select an event date");
      return;
    }
    if (eventData.categories_needed.length === 0) {
      toast.error("Please select at least one vendor category");
      return;
    }

    setLoading(true);
    try {
      // Create guest if not authenticated
      if (!isAuthenticated()) {
        await continueAsGuest(eventData.event_name);
      }

      // Create event
      const eventPayload = {
        event_name: eventData.event_name,
        event_date: format(eventData.event_date, "yyyy-MM-dd"),
        event_time: eventData.event_time,
        guest_count: eventData.guest_count,
        budget: eventData.budget,
        location_preference: eventData.location_preference,
        special_requirements: eventData.special_requirements,
      };

      const eventResponse = await eventAPI.create(eventPayload);
      setCreatedEvent(eventResponse.data);

      // Get AI recommendations
      const recResponse = await aiAPI.getRecommendations({
        event_date: format(eventData.event_date, "yyyy-MM-dd"),
        guest_count: eventData.guest_count,
        budget: eventData.budget,
        location: eventData.location_preference,
        categories_needed: eventData.categories_needed,
      });
      
      setRecommendations(recResponse.data.recommendations);
      setStep(2);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    toast.success("Event planning started! Check your dashboard for details.");
    navigate("/dashboard");
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center gap-4">
            <div className={`flex items-center gap-2 ${step >= 1 ? "text-[#0F4C5C]" : "text-[#888888]"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 1 ? "bg-[#0F4C5C] text-white" : "bg-[#E5E5E5]"}`}>
                1
              </div>
              <span className="hidden sm:inline font-medium">Event Details</span>
            </div>
            <div className="w-12 h-0.5 bg-[#E5E5E5]">
              <div className={`h-full bg-[#0F4C5C] transition-all ${step >= 2 ? "w-full" : "w-0"}`} />
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? "text-[#0F4C5C]" : "text-[#888888]"}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${step >= 2 ? "bg-[#0F4C5C] text-white" : "bg-[#E5E5E5]"}`}>
                2
              </div>
              <span className="hidden sm:inline font-medium">Recommendations</span>
            </div>
          </div>
        </div>

        {/* Step 1: Event Details */}
        {step === 1 && (
          <div className="bg-white rounded-2xl p-8 shadow-sm animate-fade-in-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Plan Your Arangetram
              </h1>
              <p className="text-[#4A4A4A]">
                Tell us about your event and we'll recommend the perfect vendors
              </p>
            </div>

            <div className="space-y-6">
              {/* Event Name */}
              <div className="space-y-2">
                <Label htmlFor="event_name">Event Name</Label>
                <Input
                  id="event_name"
                  value={eventData.event_name}
                  onChange={(e) => handleInputChange("event_name", e.target.value)}
                  placeholder="e.g., Priya's Arangetram"
                  className="input-styled"
                  data-testid="event-name-input"
                />
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Event Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className="w-full justify-start text-left font-normal input-styled"
                        data-testid="event-date-picker"
                      >
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {eventData.event_date ? (
                          format(eventData.event_date, "PPP")
                        ) : (
                          <span className="text-[#888888]">Select date</span>
                        )}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={eventData.event_date}
                        onSelect={(date) => handleInputChange("event_date", date)}
                        disabled={(date) => date < new Date()}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_time">Event Time</Label>
                  <Input
                    id="event_time"
                    type="time"
                    value={eventData.event_time}
                    onChange={(e) => handleInputChange("event_time", e.target.value)}
                    className="input-styled"
                    data-testid="event-time-input"
                  />
                </div>
              </div>

              {/* Guest Count & Budget */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="guest_count">Expected Guests</Label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                    <Input
                      id="guest_count"
                      type="number"
                      value={eventData.guest_count}
                      onChange={(e) => handleInputChange("guest_count", parseInt(e.target.value) || 0)}
                      className="!pl-10 input-styled"
                      min={1}
                      data-testid="guest-count-input"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Budget</Label>
                  <Select value={eventData.budget} onValueChange={(value) => handleInputChange("budget", value)}>
                    <SelectTrigger className="input-styled" data-testid="budget-select">
                      <DollarSign className="w-4 h-4 mr-2 text-[#888888]" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {budgetOptions.map((opt) => (
                        <SelectItem key={opt.value} value={opt.value}>
                          {opt.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Location */}
              <div className="space-y-2">
                <Label htmlFor="location">Location Preference</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#888888]" />
                  <Input
                    id="location"
                    value={eventData.location_preference}
                    onChange={(e) => handleInputChange("location_preference", e.target.value)}
                    className="!pl-10 input-styled"
                    placeholder="e.g., Fremont, Sunnyvale"
                    data-testid="location-input"
                  />
                </div>
              </div>

              {/* Categories Needed */}
              <div className="space-y-3">
                <Label>What do you need? (Select all that apply)</Label>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {categories.map((cat) => (
                    <label
                      key={cat.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition-colors ${
                        eventData.categories_needed.includes(cat.id)
                          ? "border-[#0F4C5C] bg-[#0F4C5C]/5"
                          : "border-[#E5E5E5] hover:border-[#C5A059]"
                      }`}
                      data-testid={`category-checkbox-${cat.id}`}
                    >
                      <Checkbox
                        checked={eventData.categories_needed.includes(cat.id)}
                        onCheckedChange={() => toggleCategory(cat.id)}
                      />
                      <cat.icon className="w-5 h-5 text-[#0F4C5C]" />
                      <span className="font-medium text-[#1A1A1A]">{cat.name}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Special Requirements */}
              <div className="space-y-2">
                <Label htmlFor="special_requirements">Special Requirements (Optional)</Label>
                <Textarea
                  id="special_requirements"
                  value={eventData.special_requirements}
                  onChange={(e) => handleInputChange("special_requirements", e.target.value)}
                  placeholder="Any specific requirements, dietary restrictions, style preferences..."
                  className="input-styled resize-none"
                  rows={3}
                  data-testid="special-requirements"
                />
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleStep1Submit}
                disabled={loading}
                className="w-full btn-primary text-base py-6"
                data-testid="get-recommendations-btn"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Getting Recommendations...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5 mr-2" />
                    Get AI Recommendations
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Recommendations */}
        {step === 2 && (
          <div className="animate-fade-in-up">
            <div className="text-center mb-8">
              <h1 className="text-3xl font-bold text-[#1A1A1A] mb-2" style={{ fontFamily: 'Playfair Display, serif' }}>
                Your Personalized Recommendations
              </h1>
              <p className="text-[#4A4A4A]">
                Based on your preferences, here are our top vendor picks
              </p>
            </div>

            {/* Event Summary */}
            <div className="bg-white rounded-xl p-4 mb-8 shadow-sm">
              <div className="flex flex-wrap items-center gap-4 text-sm">
                <span className="font-semibold text-[#1A1A1A]">{eventData.event_name}</span>
                <span className="text-[#888888]">|</span>
                <span className="text-[#4A4A4A]">{eventData.event_date && format(eventData.event_date, "PPP")}</span>
                <span className="text-[#888888]">|</span>
                <span className="text-[#4A4A4A]">{eventData.guest_count} guests</span>
                <span className="text-[#888888]">|</span>
                <span className="text-[#4A4A4A]">{eventData.budget} budget</span>
              </div>
            </div>

            {/* Recommendations by Category */}
            <div className="space-y-8">
              {eventData.categories_needed.map((categoryId) => {
                const category = categories.find(c => c.id === categoryId);
                const categoryVendors = recommendations[categoryId] || [];
                
                return (
                  <div key={categoryId} className="bg-white rounded-2xl p-6 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                      <div className="w-10 h-10 rounded-lg bg-[#0F4C5C] flex items-center justify-center">
                        {category && <category.icon className="w-5 h-5 text-white" />}
                      </div>
                      <h2 className="text-xl font-semibold text-[#1A1A1A]">
                        {category?.name || categoryId}
                      </h2>
                    </div>

                    {categoryVendors.length > 0 ? (
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {categoryVendors.map((vendor) => (
                          <VendorCard key={vendor.id} vendor={vendor} />
                        ))}
                      </div>
                    ) : (
                      <div className="text-center py-8 text-[#888888]">
                        <p>No vendors found for this category matching your criteria.</p>
                        <Button
                          variant="link"
                          onClick={() => navigate(`/vendors?category=${categoryId}`)}
                          className="text-[#0F4C5C]"
                        >
                          Browse all {category?.name} vendors
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 mt-8">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="btn-secondary"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Edit Details
              </Button>
              <Button
                onClick={() => navigate("/vendors")}
                variant="outline"
                className="btn-secondary flex-1"
              >
                Browse All Vendors
              </Button>
              <Button
                onClick={handleFinish}
                className="btn-primary flex-1"
                data-testid="finish-planning-btn"
              >
                Go to Dashboard
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* AI Chat */}
      <AIChat 
        isOpen={chatOpen} 
        onClose={() => setChatOpen(!chatOpen)}
        eventContext={eventData.event_date ? {
          event_date: format(eventData.event_date, "yyyy-MM-dd"),
          guest_count: eventData.guest_count,
          budget: eventData.budget,
          location: eventData.location_preference,
        } : null}
      />
    </div>
  );
}

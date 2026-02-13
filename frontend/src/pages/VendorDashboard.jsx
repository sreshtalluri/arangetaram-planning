import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useVendorProfile } from "../hooks/useVendorProfile";
import { usePortfolio } from "../hooks/usePortfolio";
import { useBlockedDates } from "../hooks/useAvailability";
import { useUnreadCount } from "../hooks/useInquiries";
import { useVendorLocations } from "../hooks/useVendorLocations";
import { PortfolioUploader } from "../components/vendor/PortfolioUploader";
import { PortfolioGallery } from "../components/vendor/PortfolioGallery";
import { AvailabilityCalendar } from "../components/vendor/AvailabilityCalendar";
import { VendorInquiriesList } from "../components/dashboard/VendorInquiriesList";
import { InquiryStatsCards } from "../components/inquiry/InquiryStatsCards";
import { getCategoryByValue } from "../lib/vendor-categories";
import { cn } from "../lib/utils";
import Navbar from "../components/Navbar";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import {
  Store, Calendar, MapPin, DollarSign, Edit2,
  Loader2, Star, LayoutDashboard, Image, ExternalLink,
  CheckCircle2, AlertCircle, ImageIcon, CalendarDays, MessageSquare
} from "lucide-react";

export default function VendorDashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: vendorProfile, isLoading: profileLoading } = useVendorProfile(user?.id);
  const { data: portfolioImages = [] } = usePortfolio(user?.id);
  const { blockedDates = [], availability = [] } = useBlockedDates(user?.id);
  const { data: unreadCount = 0 } = useUnreadCount(user?.id, 'vendor');
  const { locations } = useVendorLocations(user?.id);

  const [activeSection, setActiveSection] = useState('overview');

  const sections = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'profile', label: 'Profile', icon: Store },
    { id: 'portfolio', label: 'Portfolio', icon: Image },
    { id: 'availability', label: 'Availability', icon: Calendar },
    { id: 'inquiries', label: 'Inquiries', icon: MessageSquare },
  ];

  const loading = authLoading || profileLoading;

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

  // No profile state - prompt to create
  if (!vendorProfile) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="max-w-xl mx-auto px-4 py-16 text-center">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Create Your Profile</h2>
          <p className="text-gray-500 mb-6">
            Set up your vendor profile to start receiving inquiries from families planning Arangetrams.
          </p>
          <Button
            onClick={() => navigate('/vendor/profile/create')}
            className="btn-primary"
          >
            Create Profile
          </Button>
        </div>
      </div>
    );
  }

  // Calculate profile completion status
  const hasDescription = !!vendorProfile.description;
  const hasServiceAreas = vendorProfile.service_areas?.length > 0;
  const hasPricing = vendorProfile.price_min !== null || vendorProfile.price_max !== null;
  const hasPortfolio = portfolioImages.length > 0;
  const isProfileComplete = hasDescription && hasServiceAreas && hasPricing && hasPortfolio;

  // Get category info
  const categoryInfo = getCategoryByValue(vendorProfile.category);

  // Render section content
  const renderSection = () => {
    switch (activeSection) {
      case 'overview':
        return (
          <OverviewSection
            vendorProfile={vendorProfile}
            portfolioCount={portfolioImages.length}
            blockedDatesCount={availability.length}
            isProfileComplete={isProfileComplete}
            hasDescription={hasDescription}
            hasServiceAreas={hasServiceAreas}
            hasPricing={hasPricing}
            hasPortfolio={hasPortfolio}
            navigate={navigate}
            setActiveSection={setActiveSection}
          />
        );
      case 'profile':
        return (
          <ProfileSection
            vendorProfile={vendorProfile}
            categoryInfo={categoryInfo}
            navigate={navigate}
          />
        );
      case 'portfolio':
        return (
          <PortfolioSection
            vendorId={user?.id}
            portfolioCount={portfolioImages.length}
          />
        );
      case 'availability':
        return (
          <AvailabilitySection
            vendorId={user?.id}
            upcomingBlockedCount={availability.length}
          />
        );
      case 'inquiries':
        return (
          <InquiriesSection vendorId={user?.id} />
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-white border-r min-h-[calc(100vh-64px)] p-4 hidden md:block">
          <div className="mb-6 px-4">
            <h2 className="font-semibold text-[#1A1A1A] truncate">
              {vendorProfile.business_name}
            </h2>
            <p className="text-sm text-gray-500">
              {categoryInfo?.label || vendorProfile.category}
            </p>
          </div>
          <nav className="space-y-1">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "relative w-full flex items-center gap-3 px-4 py-2 rounded-lg text-left transition-colors",
                  activeSection === section.id
                    ? "bg-[#0F4C5C] text-white"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <section.icon className="w-5 h-5" />
                {section.label}
                {section.id === 'inquiries' && unreadCount > 0 && (
                  <span className="absolute right-2 min-w-[20px] h-5 rounded-full bg-red-500 text-white text-xs flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            ))}
          </nav>
        </aside>

        {/* Mobile section tabs */}
        <div className="md:hidden w-full border-b bg-white px-4 py-2 overflow-x-auto">
          <div className="flex gap-2">
            {sections.map((section) => (
              <button
                key={section.id}
                onClick={() => setActiveSection(section.id)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm whitespace-nowrap transition-colors",
                  activeSection === section.id
                    ? "bg-[#0F4C5C] text-white"
                    : "text-gray-600 bg-gray-100"
                )}
              >
                <section.icon className="w-4 h-4" />
                {section.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 p-6">
          <div className="max-w-5xl mx-auto">
            {locations.length === 0 && (
              <div className="bg-[#C5A059]/10 border border-[#C5A059]/30 rounded-xl p-4 flex items-center justify-between mb-6">
                <div>
                  <p className="font-medium text-[#1A1A1A]">Add your business address</p>
                  <p className="text-sm text-[#888888]">
                    Update your profile with a physical address so clients can find you by location.
                  </p>
                </div>
                <Button
                  onClick={() => navigate('/vendor/profile/create')}
                  className="bg-[#800020] text-white hover:bg-[#600018] shrink-0"
                >
                  Update Profile
                </Button>
              </div>
            )}
            {renderSection()}
          </div>
        </main>
      </div>
    </div>
  );
}

// Overview Section Component
function OverviewSection({
  vendorProfile,
  portfolioCount,
  blockedDatesCount,
  isProfileComplete,
  hasDescription,
  hasServiceAreas,
  hasPricing,
  hasPortfolio,
  navigate,
  setActiveSection,
}) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Welcome back!
        </h1>
        <p className="text-gray-500">Here's an overview of your vendor account.</p>
      </div>

      {/* Profile completion prompt */}
      {!isProfileComplete && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="font-medium text-amber-800">Complete Your Profile</h3>
              <p className="text-sm text-amber-700 mt-1">
                A complete profile helps families find and trust you. Add the missing items:
              </p>
              <ul className="mt-2 space-y-1 text-sm text-amber-700">
                {!hasDescription && <li>- Add a description of your services</li>}
                {!hasServiceAreas && <li>- Specify your service areas</li>}
                {!hasPricing && <li>- Add your pricing information</li>}
                {!hasPortfolio && <li>- Upload portfolio images</li>}
              </ul>
              <div className="mt-3 flex gap-2">
                {(!hasDescription || !hasServiceAreas || !hasPricing) && (
                  <Button size="sm" onClick={() => navigate('/vendor/profile/create')}>
                    Edit Profile
                  </Button>
                )}
                {!hasPortfolio && (
                  <Button size="sm" variant="outline" onClick={() => setActiveSection('portfolio')}>
                    Add Photos
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {isProfileComplete && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600" />
            <div>
              <h3 className="font-medium text-green-800">Profile Complete</h3>
              <p className="text-sm text-green-700">
                Your profile is ready for families to discover.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Quick Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#0F4C5C]/10 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-[#0F4C5C]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{portfolioCount}</p>
              <p className="text-sm text-gray-500">Portfolio Images</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
              <CalendarDays className="w-5 h-5 text-red-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">{blockedDatesCount}</p>
              <p className="text-sm text-gray-500">Blocked Dates</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C5A059]/20 flex items-center justify-center">
              <Star className="w-5 h-5 text-[#C5A059]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-[#1A1A1A]">
                {vendorProfile.is_published ? 'Published' : 'Draft'}
              </p>
              <p className="text-sm text-gray-500">Profile Status</p>
            </div>
          </div>
        </div>
      </div>

      {/* View as User button */}
      {vendorProfile.is_published && (
        <div className="bg-white rounded-lg p-4 border shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-medium text-[#1A1A1A]">Public Profile</h3>
              <p className="text-sm text-gray-500">
                See how your profile appears to families searching for vendors.
              </p>
            </div>
            <Button
              variant="outline"
              onClick={() => navigate(`/vendors/${vendorProfile.id}`)}
            >
              <ExternalLink className="w-4 h-4 mr-2" />
              View as User
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// Profile Section Component
function ProfileSection({ vendorProfile, categoryInfo, navigate }) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Profile
          </h1>
          <p className="text-gray-500">View and edit your vendor profile.</p>
        </div>
        <Button onClick={() => navigate('/vendor/profile/create')} className="btn-secondary">
          <Edit2 className="w-4 h-4 mr-2" />
          Edit Profile
        </Button>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Image */}
          <div className="md:col-span-1">
            <div className="aspect-square rounded-xl bg-[#F9F8F4] flex items-center justify-center overflow-hidden">
              {vendorProfile.profile_photo_url ? (
                <img
                  src={vendorProfile.profile_photo_url}
                  alt={vendorProfile.business_name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <Store className="w-16 h-16 text-[#888888]" />
              )}
            </div>
            <div className="mt-4">
              <Badge className={cn(
                "w-full justify-center",
                vendorProfile.is_published
                  ? "bg-green-100 text-green-800 border-green-200"
                  : "bg-gray-100 text-gray-600 border-gray-200"
              )}>
                {vendorProfile.is_published ? 'Published' : 'Draft'}
              </Badge>
            </div>
          </div>

          {/* Profile Details */}
          <div className="md:col-span-2 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-[#1A1A1A]">{vendorProfile.business_name}</h2>
              <Badge className="mt-2 bg-[#0F4C5C]/10 text-[#0F4C5C] border-0">
                {categoryInfo?.label || vendorProfile.category}
              </Badge>
            </div>

            {vendorProfile.description ? (
              <p className="text-[#4A4A4A]">{vendorProfile.description}</p>
            ) : (
              <p className="text-gray-400 italic">No description added yet.</p>
            )}

            <div className="grid grid-cols-2 gap-4">
              {vendorProfile.service_areas?.length > 0 && (
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-[#888888] mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Service Areas</p>
                    <p className="text-[#4A4A4A]">{vendorProfile.service_areas.join(', ')}</p>
                  </div>
                </div>
              )}
              {(vendorProfile.price_min || vendorProfile.price_max) && (
                <div className="flex items-start gap-2">
                  <DollarSign className="w-4 h-4 text-[#888888] mt-1" />
                  <div>
                    <p className="text-sm font-medium text-gray-600">Pricing</p>
                    <p className="text-[#4A4A4A]">
                      {vendorProfile.price_min && vendorProfile.price_max
                        ? `$${vendorProfile.price_min.toLocaleString()} - $${vendorProfile.price_max.toLocaleString()}`
                        : vendorProfile.price_min
                        ? `From $${vendorProfile.price_min.toLocaleString()}`
                        : `Up to $${vendorProfile.price_max.toLocaleString()}`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Portfolio Section Component
function PortfolioSection({ vendorId, portfolioCount }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Portfolio
        </h1>
        <p className="text-gray-500">
          Showcase your work with up to 10 images. Drag to reorder.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-[#1A1A1A]">Upload New Image</h3>
            <span className="text-sm text-gray-500">{portfolioCount}/10 images</span>
          </div>
          <PortfolioUploader
            vendorId={vendorId}
            currentCount={portfolioCount}
          />
        </div>

        <div className="border-t pt-6">
          <h3 className="font-medium text-[#1A1A1A] mb-4">Your Portfolio</h3>
          <PortfolioGallery vendorId={vendorId} />
        </div>
      </div>
    </div>
  );
}

// Availability Section Component
function AvailabilitySection({ vendorId, upcomingBlockedCount }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Availability
        </h1>
        <p className="text-gray-500">
          Manage your calendar to show families when you're available.
        </p>
      </div>

      <div className="bg-white rounded-xl p-6 shadow-sm border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="font-medium text-[#1A1A1A]">Availability Calendar</h3>
          {upcomingBlockedCount > 0 && (
            <span className="text-sm text-gray-500">
              {upcomingBlockedCount} date{upcomingBlockedCount !== 1 ? 's' : ''} blocked
            </span>
          )}
        </div>
        <AvailabilityCalendar vendorId={vendorId} />
      </div>
    </div>
  );
}

// Inquiries Section Component
function InquiriesSection({ vendorId }) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
          Inquiries
        </h1>
        <p className="text-gray-500">
          View and respond to inquiries from families.
        </p>
      </div>

      {/* Stats Cards */}
      <InquiryStatsCards vendorId={vendorId} />

      {/* Inquiries List */}
      <div className="mt-6">
        <h3 className="font-medium text-[#1A1A1A] mb-4">All Inquiries</h3>
        <VendorInquiriesList vendorId={vendorId} />
      </div>
    </div>
  );
}

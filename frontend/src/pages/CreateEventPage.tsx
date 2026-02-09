import { Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import Navbar from '../components/Navbar'
import { EventWizard } from '../components/event/EventWizard'
import { Loader2, Info } from 'lucide-react'

export default function CreateEventPage() {
  const { user, isVendor, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F9F8F4]">
        <Navbar />
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-[#0F4C5C]" />
        </div>
      </div>
    )
  }

  // Must be logged in
  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Vendor info message */}
        {isVendor && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium">Planning your own event?</p>
              <p className="mt-1">
                As a vendor, you can also create events to plan your own Arangetram or help coordinate for family members.
              </p>
            </div>
          </div>
        )}

        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Plan Your Arangetram
          </h1>
          <p className="text-[#4A4A4A]">
            Tell us about your event and we'll help you find the perfect vendors
          </p>
        </div>

        <EventWizard />
      </div>
    </div>
  )
}

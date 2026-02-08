import { Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import Navbar from '../../components/Navbar'
import { ProfileWizard } from '../../components/vendor/ProfileWizard'
import { Loader2 } from 'lucide-react'

export default function ProfileWizardPage() {
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

  // Must be logged in as vendor
  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (!isVendor) {
    return <Navigate to="/dashboard" replace />
  }

  return (
    <div className="min-h-screen bg-[#F9F8F4]">
      <Navbar />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#1A1A1A]" style={{ fontFamily: 'Playfair Display, serif' }}>
            Create Your Profile
          </h1>
          <p className="text-[#4A4A4A]">Let families discover your services</p>
        </div>

        <ProfileWizard />
      </div>
    </div>
  )
}

import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCreateVendorProfile, useUpdateVendorProfile, useVendorProfile } from '@/hooks/useVendorProfile'
import { supabase } from '@/lib/supabase'
import { StepProgress } from './StepProgress'
import { StepBasics } from './StepBasics'
import { StepCategory } from './StepCategory'
import { StepServices } from './StepServices'
import { Card, CardContent } from '@/components/ui/card'

const STORAGE_KEY = 'vendor-profile-draft'
const STEPS = ['Basics', 'Category', 'Services', 'Complete']

interface ProfileFormData {
  business_name: string
  description: string
  category: string
  locations: Array<{
    label: string
    address_line1: string
    city: string
    state: string
    zip_code: string
    formatted_address: string
    latitude: number
    longitude: number
  }>
  price_min: number | null
  price_max: number | null
  profile_photo_url?: string | null
}

export function ProfileWizard() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const [step, setStep] = useState(1)
  const { data: existingProfile } = useVendorProfile(user?.id)
  const createProfile = useCreateVendorProfile()
  const updateProfile = useUpdateVendorProfile()

  // Load saved draft or existing profile
  const getSavedDraft = () => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  }

  const getDefaultValues = (): ProfileFormData => {
    const savedDraft = getSavedDraft()
    if (savedDraft) return savedDraft
    if (existingProfile) {
      return {
        business_name: existingProfile.business_name,
        description: existingProfile.description || '',
        category: existingProfile.category,
        locations: [],
        price_min: existingProfile.price_min,
        price_max: existingProfile.price_max,
        profile_photo_url: existingProfile.profile_photo_url || null,
      }
    }
    return {
      business_name: '',
      description: '',
      category: '',
      locations: [],
      price_min: null,
      price_max: null,
      profile_photo_url: null,
    }
  }

  const methods = useForm<ProfileFormData>({
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  })

  // Reset form when existingProfile loads (if no draft)
  useEffect(() => {
    if (existingProfile && !getSavedDraft()) {
      methods.reset({
        business_name: existingProfile.business_name,
        description: existingProfile.description || '',
        category: existingProfile.category,
        locations: [],
        price_min: existingProfile.price_min,
        price_max: existingProfile.price_max,
        profile_photo_url: existingProfile.profile_photo_url || null,
      })
    }
  }, [existingProfile, methods])

  // Auto-save on form change
  useEffect(() => {
    const subscription = methods.watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [methods])

  const handleSubmit = async () => {
    const data = methods.getValues()
    const { locations, ...profileData } = data

    try {
      if (existingProfile) {
        await updateProfile.mutateAsync({
          id: user!.id,
          ...profileData,
          is_published: true,
        })
        toast.success('Profile updated!')
      } else {
        await createProfile.mutateAsync({
          id: user!.id,
          ...profileData,
          is_published: true,
        })
        toast.success('Profile created!')
      }

      // Save locations
      if (locations && locations.length > 0) {
        // Delete existing locations first (in case of re-submission)
        await supabase
          .from('vendor_locations')
          .delete()
          .eq('vendor_id', user!.id)

        const locationInserts = locations.map((loc, idx) => ({
          vendor_id: user!.id,
          label: loc.label || `Location ${idx + 1}`,
          address_line1: loc.address_line1,
          city: loc.city,
          state: loc.state,
          zip_code: loc.zip_code,
          formatted_address: loc.formatted_address,
          latitude: loc.latitude,
          longitude: loc.longitude,
          is_primary: idx === 0,
        }))

        const { error: locError } = await supabase
          .from('vendor_locations')
          .insert(locationInserts)

        if (locError) throw locError
      }

      localStorage.removeItem(STORAGE_KEY)
      navigate('/vendor/dashboard')
    } catch (error) {
      toast.error('Failed to save profile. Please try again.')
    }
  }

  const isSubmitting = createProfile.isPending || updateProfile.isPending

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <StepProgress currentStep={step} totalSteps={4} steps={STEPS} />

        <FormProvider {...methods}>
          {step === 1 && <StepBasics onNext={() => setStep(2)} />}
          {step === 2 && <StepCategory onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <StepServices
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
            />
          )}
        </FormProvider>
      </CardContent>
    </Card>
  )
}

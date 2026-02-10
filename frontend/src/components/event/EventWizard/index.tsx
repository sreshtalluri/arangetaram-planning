import { useState, useEffect } from 'react'
import { useForm, FormProvider } from 'react-hook-form'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { useAuth } from '@/hooks/useAuth'
import { useCreateEvent, useUpdateEvent, useEvent } from '@/hooks/useEvents'
import { StepProgress } from '@/components/vendor/ProfileWizard/StepProgress'
import { StepDetails } from './StepDetails'
import { StepCategories } from './StepCategories'
import { StepReview } from './StepReview'
import { Card, CardContent } from '@/components/ui/card'

const STORAGE_KEY = 'event-draft'
const STEPS = ['Details', 'Categories', 'Review']

// Event form schema
export const eventSchema = z.object({
  event_name: z.string().min(1, 'Event name is required'),
  event_date: z.string().min(1, 'Event date is required'),
  location: z.string().optional().nullable(),
  guest_count: z.number().optional().nullable(),
  budget: z.number().optional().nullable(),
  categories_needed: z.array(z.string()).min(1, 'Select at least one category'),
  categories_covered: z.array(z.string()),
})

export type EventFormData = z.infer<typeof eventSchema>

// Default categories that are commonly needed for Arangetram
const DEFAULT_CATEGORIES = ['venue', 'catering', 'photography', 'musicians', 'makeup_artist']

export function EventWizard() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const { user } = useAuth()
  const [step, setStep] = useState(1)

  const editEventId = searchParams.get('edit')
  const { data: existingEvent } = useEvent(editEventId || undefined)
  const createEvent = useCreateEvent()
  const updateEvent = useUpdateEvent()

  // Load saved draft from localStorage
  const getSavedDraft = (): EventFormData | null => {
    if (typeof window === 'undefined') return null
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved ? JSON.parse(saved) : null
  }

  // Get default values for form
  const getDefaultValues = (): EventFormData => {
    const savedDraft = getSavedDraft()
    if (savedDraft) return savedDraft

    if (existingEvent) {
      return {
        event_name: existingEvent.event_name,
        event_date: existingEvent.event_date,
        location: existingEvent.location,
        guest_count: existingEvent.guest_count,
        budget: existingEvent.budget,
        categories_needed: existingEvent.categories_needed || DEFAULT_CATEGORIES,
        categories_covered: existingEvent.categories_covered || [],
      }
    }

    return {
      event_name: '',
      event_date: '',
      location: null,
      guest_count: null,
      budget: null,
      categories_needed: DEFAULT_CATEGORIES,
      categories_covered: [],
    }
  }

  const methods = useForm<EventFormData>({
    resolver: zodResolver(eventSchema),
    defaultValues: getDefaultValues(),
    mode: 'onChange',
  })

  // Reset form when existingEvent loads (if no draft)
  useEffect(() => {
    if (existingEvent && !getSavedDraft()) {
      methods.reset({
        event_name: existingEvent.event_name,
        event_date: existingEvent.event_date,
        location: existingEvent.location,
        guest_count: existingEvent.guest_count,
        budget: existingEvent.budget,
        categories_needed: existingEvent.categories_needed || DEFAULT_CATEGORIES,
        categories_covered: existingEvent.categories_covered || [],
      })
    }
  }, [existingEvent, methods])

  // Auto-save on form change
  useEffect(() => {
    const subscription = methods.watch((data) => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    })
    return () => subscription.unsubscribe()
  }, [methods])

  const handleSubmit = async () => {
    const data = methods.getValues()

    // Validate form data
    const result = eventSchema.safeParse(data)
    if (!result.success) {
      const firstError = result.error.errors[0]
      toast.error(firstError?.message || 'Please fill in all required fields')
      return
    }

    if (!user) {
      toast.error('You must be logged in to create an event')
      return
    }

    try {
      if (editEventId && existingEvent) {
        await updateEvent.mutateAsync({
          id: editEventId,
          event_name: data.event_name,
          event_date: data.event_date,
          location: data.location || null,
          guest_count: data.guest_count || null,
          budget: data.budget || null,
          categories_needed: data.categories_needed,
          categories_covered: data.categories_covered,
        })
        toast.success('Event updated!')
      } else {
        await createEvent.mutateAsync({
          user_id: user.id,
          event_name: data.event_name,
          event_date: data.event_date,
          location: data.location || null,
          guest_count: data.guest_count || null,
          budget: data.budget || null,
          categories_needed: data.categories_needed,
          categories_covered: data.categories_covered,
        })
        toast.success('Event created!')
      }
      localStorage.removeItem(STORAGE_KEY)
      navigate('/dashboard')
    } catch (error) {
      toast.error('Failed to save event. Please try again.')
    }
  }

  const isSubmitting = createEvent.isPending || updateEvent.isPending

  return (
    <Card className="max-w-2xl mx-auto">
      <CardContent className="pt-6">
        <StepProgress currentStep={step} totalSteps={3} steps={STEPS} />

        <FormProvider {...methods}>
          {step === 1 && <StepDetails onNext={() => setStep(2)} />}
          {step === 2 && <StepCategories onNext={() => setStep(3)} onBack={() => setStep(1)} />}
          {step === 3 && (
            <StepReview
              onSubmit={handleSubmit}
              onBack={() => setStep(2)}
              isSubmitting={isSubmitting}
              isEditing={!!editEventId}
            />
          )}
        </FormProvider>
      </CardContent>
    </Card>
  )
}

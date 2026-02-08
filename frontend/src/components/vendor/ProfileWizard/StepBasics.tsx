import { useFormContext } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Button } from '@/components/ui/button'

interface StepBasicsProps {
  onNext: () => void
}

export function StepBasics({ onNext }: StepBasicsProps) {
  const { register, formState: { errors }, trigger } = useFormContext()

  const handleNext = async () => {
    const valid = await trigger(['business_name', 'description'])
    if (valid) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Tell us about your business</h2>
        <p className="text-gray-500">Start with the basics</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="business_name">Business Name *</Label>
          <Input
            id="business_name"
            {...register('business_name', { required: 'Business name is required' })}
            placeholder="Your business name"
          />
          {errors.business_name && (
            <p className="text-sm text-red-500">{errors.business_name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Description *</Label>
          <Textarea
            id="description"
            {...register('description', { required: 'Description is required' })}
            placeholder="Describe your services and what makes you unique..."
            rows={4}
          />
          {errors.description && (
            <p className="text-sm text-red-500">{errors.description.message as string}</p>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

import { useFormContext, Controller } from 'react-hook-form'
import { METRO_AREAS } from '@/lib/metro-areas'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'

interface StepServicesProps {
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepServices({ onSubmit, onBack, isSubmitting }: StepServicesProps) {
  const { register, control } = useFormContext()

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Service details</h2>
        <p className="text-gray-500">Where do you operate and what do you charge?</p>
      </div>

      <div className="space-y-4">
        <div className="space-y-2">
          <Label>Service Areas</Label>
          <p className="text-sm text-gray-500">Select the metros where you provide services</p>
          <Controller
            name="service_areas"
            control={control}
            defaultValue={[]}
            render={({ field }) => (
              <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto border rounded-lg p-3">
                {METRO_AREAS.map((metro) => (
                  <Label key={metro.value} className="flex items-center gap-2 cursor-pointer">
                    <Checkbox
                      checked={field.value?.includes(metro.value)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          field.onChange([...field.value, metro.value])
                        } else {
                          field.onChange(field.value.filter((v: string) => v !== metro.value))
                        }
                      }}
                    />
                    <span className="text-sm">{metro.label}</span>
                  </Label>
                ))}
              </div>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="price_min">Minimum Price ($)</Label>
            <Input
              id="price_min"
              type="number"
              {...register('price_min', { valueAsNumber: true })}
              placeholder="500"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="price_max">Maximum Price ($)</Label>
            <Input
              id="price_max"
              type="number"
              {...register('price_max', { valueAsNumber: true })}
              placeholder="5000"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </div>
    </div>
  )
}

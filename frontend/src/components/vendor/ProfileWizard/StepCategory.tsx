import { useFormContext, Controller } from 'react-hook-form'
import { VENDOR_CATEGORIES } from '@/lib/vendor-categories'
import { Button } from '@/components/ui/button'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'

interface StepCategoryProps {
  onNext: () => void
  onBack: () => void
}

export function StepCategory({ onNext, onBack }: StepCategoryProps) {
  const { control, formState: { errors }, trigger } = useFormContext()

  const handleNext = async () => {
    const valid = await trigger('category')
    if (valid) onNext()
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">What service do you provide?</h2>
        <p className="text-gray-500">Select your primary category</p>
      </div>

      <Controller
        name="category"
        control={control}
        rules={{ required: 'Please select a category' }}
        render={({ field }) => (
          <RadioGroup value={field.value} onValueChange={field.onChange} className="grid gap-3">
            {VENDOR_CATEGORIES.map((cat) => {
              const Icon = LucideIcons[cat.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
              return (
                <Label
                  key={cat.value}
                  className={cn(
                    "flex items-start gap-4 p-4 border rounded-lg cursor-pointer hover:border-[#0F4C5C] transition-colors",
                    field.value === cat.value && "border-[#0F4C5C] bg-[#0F4C5C]/5"
                  )}
                >
                  <RadioGroupItem value={cat.value} className="mt-1" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      {Icon && <Icon className="w-5 h-5 text-[#0F4C5C]" />}
                      <span className="font-medium">{cat.label}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                  </div>
                </Label>
              )
            })}
          </RadioGroup>
        )}
      />
      {errors.category && (
        <p className="text-sm text-red-500">{errors.category.message as string}</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

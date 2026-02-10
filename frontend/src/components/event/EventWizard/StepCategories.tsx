import { useFormContext, Controller } from 'react-hook-form'
import { VENDOR_CATEGORIES } from '@/lib/vendor-categories'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'
import * as LucideIcons from 'lucide-react'
import { Check } from 'lucide-react'
import type { EventFormData } from './index'

interface StepCategoriesProps {
  onNext: () => void
  onBack: () => void
}

export function StepCategories({ onNext, onBack }: StepCategoriesProps) {
  const { control, formState: { errors }, trigger, watch, setValue } = useFormContext<EventFormData>()

  const categoriesNeeded = watch('categories_needed') || []
  const categoriesCovered = watch('categories_covered') || []

  const handleNext = async () => {
    const valid = await trigger('categories_needed')
    if (valid) onNext()
  }

  const toggleNeeded = (categoryValue: string) => {
    const current = [...categoriesNeeded]
    const index = current.indexOf(categoryValue)

    if (index === -1) {
      current.push(categoryValue)
    } else {
      current.splice(index, 1)
      // Also remove from covered if unchecking needed
      const coveredCurrent = [...categoriesCovered]
      const coveredIndex = coveredCurrent.indexOf(categoryValue)
      if (coveredIndex !== -1) {
        coveredCurrent.splice(coveredIndex, 1)
        setValue('categories_covered', coveredCurrent)
      }
    }

    setValue('categories_needed', current, { shouldValidate: true })
  }

  const toggleCovered = (categoryValue: string) => {
    // Can only toggle covered if category is needed
    if (!categoriesNeeded.includes(categoryValue)) return

    const current = [...categoriesCovered]
    const index = current.indexOf(categoryValue)

    if (index === -1) {
      current.push(categoryValue)
    } else {
      current.splice(index, 1)
    }

    setValue('categories_covered', current)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">What do you need?</h2>
        <p className="text-gray-500">
          Select the vendor categories you need for your event.
          Mark any you've already booked as "covered".
        </p>
      </div>

      <div className="space-y-3">
        {VENDOR_CATEGORIES.map((cat) => {
          const Icon = LucideIcons[cat.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
          const isNeeded = categoriesNeeded.includes(cat.value)
          const isCovered = categoriesCovered.includes(cat.value)

          return (
            <div
              key={cat.value}
              className={cn(
                "relative p-4 border rounded-lg transition-colors",
                isNeeded && !isCovered && "border-[#0F4C5C] bg-[#0F4C5C]/5",
                isCovered && "border-green-500 bg-green-50",
                !isNeeded && "border-gray-200 hover:border-gray-300"
              )}
            >
              <div className="flex items-start gap-4">
                {/* Need checkbox */}
                <div className="flex items-center">
                  <Checkbox
                    id={`need-${cat.value}`}
                    checked={isNeeded}
                    onCheckedChange={() => toggleNeeded(cat.value)}
                  />
                </div>

                {/* Category info */}
                <div className="flex-1 min-w-0">
                  <Label
                    htmlFor={`need-${cat.value}`}
                    className="flex items-center gap-2 cursor-pointer"
                  >
                    {Icon && <Icon className={cn(
                      "w-5 h-5",
                      isNeeded ? "text-[#0F4C5C]" : "text-gray-400"
                    )} />}
                    <span className="font-medium">{cat.label}</span>
                  </Label>
                  <p className="text-sm text-gray-500 mt-1">{cat.description}</p>
                </div>

                {/* Already covered toggle - only show if needed */}
                {isNeeded && (
                  <div className="flex items-center gap-2">
                    <label className="text-xs text-gray-600 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={isCovered}
                        onChange={() => toggleCovered(cat.value)}
                        className="sr-only"
                      />
                      <span className={cn(
                        "inline-flex items-center gap-1 px-2 py-1 rounded-full border transition-colors",
                        isCovered
                          ? "bg-green-100 border-green-300 text-green-700"
                          : "bg-gray-100 border-gray-200 text-gray-500 hover:bg-gray-200"
                      )}>
                        {isCovered ? (
                          <>
                            <Check className="w-3 h-3" />
                            Already covered
                          </>
                        ) : (
                          'Mark as covered'
                        )}
                      </span>
                    </label>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {errors.categories_needed && (
        <p className="text-sm text-red-500">{errors.categories_needed.message}</p>
      )}

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack}>Back</Button>
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

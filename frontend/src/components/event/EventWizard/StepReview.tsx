import { useFormContext } from 'react-hook-form'
import { format, parseISO } from 'date-fns'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { VENDOR_CATEGORIES, getCategoryByValue } from '@/lib/vendor-categories'
import { METRO_AREAS } from '@/lib/metro-areas'
import { Loader2, Check, Circle, Calendar, MapPin, Users, DollarSign } from 'lucide-react'
import * as LucideIcons from 'lucide-react'
import { cn } from '@/lib/utils'
import type { EventFormData } from './index'

interface StepReviewProps {
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
  isEditing: boolean
}

export function StepReview({ onSubmit, onBack, isSubmitting, isEditing }: StepReviewProps) {
  const { watch } = useFormContext<EventFormData>()
  const data = watch()

  const categoriesNeeded = data.categories_needed || []
  const categoriesCovered = data.categories_covered || []

  const coveredCount = categoriesCovered.length
  const pendingCount = categoriesNeeded.length - coveredCount
  const progressPercent = categoriesNeeded.length > 0
    ? Math.round((coveredCount / categoriesNeeded.length) * 100)
    : 0

  const locationLabel = data.location
    ? METRO_AREAS.find(a => a.value === data.location)?.label
    : null

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Review Your Event</h2>
        <p className="text-gray-500">Make sure everything looks right</p>
      </div>

      {/* Event Details Card */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">{data.event_name || 'Untitled Event'}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="w-4 h-4 text-[#0F4C5C]" />
              <span>
                {data.event_date
                  ? format(parseISO(data.event_date), 'PPP')
                  : 'No date set'
                }
              </span>
            </div>

            {locationLabel && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="w-4 h-4 text-[#0F4C5C]" />
                <span>{locationLabel}</span>
              </div>
            )}

            {data.guest_count && (
              <div className="flex items-center gap-2 text-sm">
                <Users className="w-4 h-4 text-[#0F4C5C]" />
                <span>{data.guest_count.toLocaleString()} guests</span>
              </div>
            )}

            {data.budget && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="w-4 h-4 text-[#0F4C5C]" />
                <span>${data.budget.toLocaleString()} budget</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Categories Progress */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center justify-between">
            <span>Vendor Categories</span>
            <span className="text-sm font-normal text-gray-500">
              {coveredCount} of {categoriesNeeded.length} covered
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress bar */}
          <div className="mb-4">
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {pendingCount === 0
                ? "All categories covered!"
                : `${pendingCount} ${pendingCount === 1 ? 'category' : 'categories'} pending — you can find vendors after creating your event`
              }
            </p>
          </div>

          {/* Category list */}
          <div className="space-y-2">
            {categoriesNeeded.map((categoryValue) => {
              const category = getCategoryByValue(categoryValue)
              if (!category) return null

              const Icon = LucideIcons[category.icon as keyof typeof LucideIcons] as React.ComponentType<{ className?: string }>
              const isCovered = categoriesCovered.includes(categoryValue)

              return (
                <div
                  key={categoryValue}
                  className={cn(
                    "flex items-center gap-3 p-2 rounded-md",
                    isCovered ? "bg-green-50" : "bg-gray-50"
                  )}
                >
                  {isCovered ? (
                    <Check className="w-4 h-4 text-green-600" />
                  ) : (
                    <Circle className="w-4 h-4 text-gray-400" />
                  )}
                  {Icon && <Icon className={cn(
                    "w-4 h-4",
                    isCovered ? "text-green-600" : "text-gray-500"
                  )} />}
                  <span className={cn(
                    "text-sm",
                    isCovered ? "text-green-700" : "text-gray-700"
                  )}>
                    {category.label}
                  </span>
                  {isCovered && (
                    <span className="ml-auto text-xs text-green-600">Covered</span>
                  )}
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={onBack} disabled={isSubmitting}>
          Back
        </Button>
        <Button onClick={onSubmit} disabled={isSubmitting}>
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            isEditing ? 'Update Event' : 'Create Event'
          )}
        </Button>
      </div>
    </div>
  )
}

import { useState, useRef, useEffect } from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { format, parseISO, startOfToday } from 'date-fns'
import { DayPicker } from 'react-day-picker'
import { CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { METRO_AREAS } from '@/lib/metro-areas'
import { cn } from '@/lib/utils'
import type { EventFormData } from './index'

interface StepDetailsProps {
  onNext: () => void
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { register, formState: { errors }, trigger, control, watch, setValue } = useFormContext<EventFormData>()
  const [dateOpen, setDateOpen] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const today = startOfToday()

  const handleNext = async () => {
    const valid = await trigger(['event_name', 'event_date'])
    if (valid) onNext()
  }

  // Handle budget input with $ prefix
  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setValue('budget', value ? parseInt(value, 10) : null)
  }

  const budgetValue = watch('budget')

  // Close date picker when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setDateOpen(false)
      }
    }
    if (dateOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [dateOpen])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Event Details</h2>
        <p className="text-gray-500">Tell us about your Arangetram</p>
      </div>

      <div className="space-y-4">
        {/* Event Name */}
        <div className="space-y-2">
          <Label htmlFor="event_name">Event Name *</Label>
          <Input
            id="event_name"
            {...register('event_name')}
            placeholder="e.g., Priya's Arangetram"
          />
          {errors.event_name && (
            <p className="text-sm text-red-500">{errors.event_name.message}</p>
          )}
        </div>

        {/* Event Date */}
        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Controller
            name="event_date"
            control={control}
            render={({ field }) => (
              <div className="relative" ref={popoverRef}>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDateOpen(!dateOpen)}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !field.value && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {field.value ? format(parseISO(field.value), 'PPP') : 'Select a date'}
                </Button>
                {dateOpen && (
                  <div className="absolute top-full left-0 z-50 mt-1 bg-white border rounded-md shadow-lg p-3">
                    <DayPicker
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM-dd'))
                          setDateOpen(false)
                        }
                      }}
                      disabled={{ before: today }}
                    />
                  </div>
                )}
              </div>
            )}
          />
          {errors.event_date && (
            <p className="text-sm text-red-500">{errors.event_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <select
            id="location"
            {...register('location')}
            className="w-full h-10 px-3 py-2 border border-gray-200 rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:ring-offset-2"
          >
            <option value="">Select a metro area</option>
            {METRO_AREAS.map((area) => (
              <option key={area.value} value={area.value}>
                {area.label}, {area.state}
              </option>
            ))}
          </select>
        </div>

        {/* Guest Count */}
        <div className="space-y-2">
          <Label htmlFor="guest_count">Expected Guest Count (optional)</Label>
          <Input
            id="guest_count"
            type="number"
            {...register('guest_count', { valueAsNumber: true })}
            placeholder="e.g., 200"
            min={1}
          />
        </div>

        {/* Budget */}
        <div className="space-y-2">
          <Label htmlFor="budget">Total Budget (optional)</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">$</span>
            <Input
              id="budget"
              type="text"
              value={budgetValue ? budgetValue.toLocaleString() : ''}
              onChange={handleBudgetChange}
              placeholder="e.g., 15000"
              className="pl-7"
            />
          </div>
        </div>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleNext}>Next</Button>
      </div>
    </div>
  )
}

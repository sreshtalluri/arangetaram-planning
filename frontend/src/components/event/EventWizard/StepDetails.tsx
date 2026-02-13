import React from 'react'
import { useFormContext, Controller } from 'react-hook-form'
import { format, parseISO, startOfToday } from 'date-fns'
import { CalendarIcon } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { METRO_AREAS } from '@/lib/metro-areas'
import { cn } from '@/lib/utils'
import type { EventFormData } from './index'

interface StepDetailsProps {
  onNext: () => void
}

export function StepDetails({ onNext }: StepDetailsProps) {
  const { register, formState: { errors }, trigger, control, watch, setValue } = useFormContext<EventFormData>()
  const today = startOfToday()

  const handleNext = async () => {
    const valid = await trigger(['event_name', 'event_date'])
    if (valid) onNext()
  }

  const handleBudgetChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '')
    setValue('budget', value ? parseInt(value, 10) : null)
  }

  const budgetValue = watch('budget')

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Event Details</h2>
        <p className="text-[#4A4A4A]">Tell us about your Arangetram</p>
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
            <p className="text-sm text-[#D32F2F]">{errors.event_name.message}</p>
          )}
        </div>

        {/* Event Date */}
        <div className="space-y-2">
          <Label>Event Date *</Label>
          <Controller
            name="event_date"
            control={control}
            render={({ field }) => {
              const [open, setOpen] = React.useState(false)
              return (
                <Popover open={open} onOpenChange={setOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal border-[#E5E5E5] hover:border-[#C5A059] transition-colors duration-200",
                        !field.value && "text-[#888888]"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4 text-[#C5A059]" />
                      {field.value ? format(parseISO(field.value), 'PPP') : 'Select a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={field.value ? parseISO(field.value) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          field.onChange(format(date, 'yyyy-MM-dd'))
                          setOpen(false)
                        }
                      }}
                      disabled={{ before: today }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              )
            }}
          />
          {errors.event_date && (
            <p className="text-sm text-[#D32F2F]">{errors.event_date.message}</p>
          )}
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location (optional)</Label>
          <select
            id="location"
            {...register('location')}
            className="w-full h-10 px-3 py-2 border border-[#E5E5E5] rounded-md bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#0F4C5C] focus:ring-offset-2"
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
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[#888888]">$</span>
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

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Settings, Info, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useBookingSettings, useUpdateBookingSettings } from '@/hooks/useBookingSettings'
import { CATEGORY_BOOKING_DEFAULTS, getCategoryByValue } from '@/lib/vendor-categories'
import { cn } from '@/lib/utils'

interface BookingSettingsPanelProps {
  vendorId: string
  vendorCategory: string
}

export function BookingSettingsPanel({ vendorId, vendorCategory }: BookingSettingsPanelProps) {
  const { data: settings, isLoading } = useBookingSettings(vendorId)
  const updateMutation = useUpdateBookingSettings()

  const categoryDefaults = CATEGORY_BOOKING_DEFAULTS[vendorCategory] ?? {
    booking_type: 'exclusive' as const,
    max_per_day: 1,
    buffer_days_before: 0,
    buffer_days_after: 0,
  }

  const [bookingType, setBookingType] = useState<'exclusive' | 'multi'>(categoryDefaults.booking_type)
  const [maxPerDay, setMaxPerDay] = useState(categoryDefaults.max_per_day)
  const [bufferBefore, setBufferBefore] = useState(categoryDefaults.buffer_days_before)
  const [bufferAfter, setBufferAfter] = useState(categoryDefaults.buffer_days_after)
  const [isDirty, setIsDirty] = useState(false)

  // Sync form state when settings data loads
  useEffect(() => {
    if (settings) {
      setBookingType(settings.booking_type)
      setMaxPerDay(settings.max_per_day)
      setBufferBefore(settings.buffer_days_before)
      setBufferAfter(settings.buffer_days_after)
      setIsDirty(false)
    }
  }, [settings])

  const handleResetToDefaults = () => {
    setBookingType(categoryDefaults.booking_type)
    setMaxPerDay(categoryDefaults.max_per_day)
    setBufferBefore(categoryDefaults.buffer_days_before)
    setBufferAfter(categoryDefaults.buffer_days_after)
    setIsDirty(true)
  }

  const handleSave = async () => {
    try {
      await updateMutation.mutateAsync({
        vendorId,
        settings: {
          booking_type: bookingType,
          max_per_day: bookingType === 'exclusive' ? 1 : maxPerDay,
          buffer_days_before: bufferBefore,
          buffer_days_after: bufferAfter,
        },
      })
      toast.success('Booking settings updated!')
      setIsDirty(false)
    } catch {
      toast.error('Failed to update booking settings')
    }
  }

  const markDirty = () => setIsDirty(true)

  const categoryLabel = getCategoryByValue(vendorCategory)?.label ?? vendorCategory

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-[#C5A059]" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#0F4C5C]" />
          <h3 className="text-lg font-semibold text-[#1A1A1A]">Booking Settings</h3>
        </div>
        <button
          onClick={handleResetToDefaults}
          className="text-sm text-[#0F4C5C] hover:text-[#093642] font-medium transition-colors duration-200"
        >
          Reset to category defaults
        </button>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-3 p-4 bg-[#0F4C5C]/5 border border-[#0F4C5C]/10 rounded-lg">
        <Info className="w-5 h-5 text-[#0F4C5C] mt-0.5 shrink-0" />
        <p className="text-sm text-[#4A4A4A]">
          These defaults are based on typical <span className="font-medium">{categoryLabel}</span> vendor
          needs. Adjust to match your workflow. Changes apply to future bookings only.
        </p>
      </div>

      {/* Booking type toggle */}
      <div className="space-y-3">
        <Label className="text-sm font-medium text-[#1A1A1A]">Booking Type</Label>
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => { setBookingType('exclusive'); markDirty() }}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-colors duration-200',
              bookingType === 'exclusive'
                ? 'border-[#0F4C5C] bg-[#0F4C5C]/5'
                : 'border-[#E5E5E5] hover:border-[#0F4C5C]/30'
            )}
          >
            <p className={cn(
              'font-medium text-sm',
              bookingType === 'exclusive' ? 'text-[#0F4C5C]' : 'text-[#1A1A1A]'
            )}>
              Exclusive
            </p>
            <p className="text-xs text-[#888888] mt-1">One event per day</p>
          </button>
          <button
            type="button"
            onClick={() => { setBookingType('multi'); markDirty() }}
            className={cn(
              'p-4 rounded-lg border-2 text-left transition-colors duration-200',
              bookingType === 'multi'
                ? 'border-[#0F4C5C] bg-[#0F4C5C]/5'
                : 'border-[#E5E5E5] hover:border-[#0F4C5C]/30'
            )}
          >
            <p className={cn(
              'font-medium text-sm',
              bookingType === 'multi' ? 'text-[#0F4C5C]' : 'text-[#1A1A1A]'
            )}>
              Multiple
            </p>
            <p className="text-xs text-[#888888] mt-1">Multiple events per day</p>
          </button>
        </div>
      </div>

      {/* Max bookings per day - only visible for multi */}
      {bookingType === 'multi' && (
        <div className="space-y-2">
          <Label htmlFor="maxPerDay" className="text-sm font-medium text-[#1A1A1A]">
            Max Bookings Per Day
          </Label>
          <Input
            id="maxPerDay"
            type="number"
            min={1}
            max={10}
            value={maxPerDay}
            onChange={(e) => {
              const val = Math.min(10, Math.max(1, parseInt(e.target.value) || 1))
              setMaxPerDay(val)
              markDirty()
            }}
            className="w-24 border-[#E5E5E5] focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
          />
        </div>
      )}

      {/* Prep days before / Teardown days after */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="bufferBefore" className="text-sm font-medium text-[#1A1A1A]">
            Prep Days Before
          </Label>
          <Input
            id="bufferBefore"
            type="number"
            min={0}
            max={14}
            value={bufferBefore}
            onChange={(e) => {
              const val = Math.min(14, Math.max(0, parseInt(e.target.value) || 0))
              setBufferBefore(val)
              markDirty()
            }}
            className="w-24 border-[#E5E5E5] focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
          />
          <p className="text-xs text-[#888888]">
            Days blocked before the event for setup/preparation
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="bufferAfter" className="text-sm font-medium text-[#1A1A1A]">
            Teardown Days After
          </Label>
          <Input
            id="bufferAfter"
            type="number"
            min={0}
            max={7}
            value={bufferAfter}
            onChange={(e) => {
              const val = Math.min(7, Math.max(0, parseInt(e.target.value) || 0))
              setBufferAfter(val)
              markDirty()
            }}
            className="w-24 border-[#E5E5E5] focus:border-[#0F4C5C] focus:ring-1 focus:ring-[#0F4C5C]"
          />
          <p className="text-xs text-[#888888]">
            Days blocked after the event for teardown/cleanup
          </p>
        </div>
      </div>

      {/* Save button - only shown when dirty */}
      {isDirty && (
        <div className="pt-2">
          <Button
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="bg-[#0F4C5C] text-white hover:bg-[#093642] rounded-full px-8 transition-colors duration-200"
          >
            {updateMutation.isPending ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Saving...
              </>
            ) : (
              'Save Settings'
            )}
          </Button>
        </div>
      )}
    </div>
  )
}

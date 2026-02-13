import { useState } from 'react'
import { useFormContext, useFieldArray } from 'react-hook-form'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { MapPin, Trash2 } from 'lucide-react'

interface StepServicesProps {
  onSubmit: () => void
  onBack: () => void
  isSubmitting: boolean
}

export function StepServices({ onSubmit, onBack, isSubmitting }: StepServicesProps) {
  const { register, control } = useFormContext()
  const { fields, append, remove } = useFieldArray({
    control,
    name: 'locations',
  })

  const [addressSearch, setAddressSearch] = useState('')
  const [isGeocoding, setIsGeocoding] = useState(false)
  const [geocodeError, setGeocodeError] = useState('')

  const handleAddressSearch = async () => {
    const input = addressSearch.trim()
    if (!input) return

    setIsGeocoding(true)
    setGeocodeError('')

    try {
      const res = await fetch(
        `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(input)}.json?access_token=${process.env.REACT_APP_MAPBOX_TOKEN}&types=place,postcode,address&country=US&limit=1`
      )
      const data = await res.json()

      if (data.features?.length > 0) {
        const feature = data.features[0]
        const [lng, lat] = feature.center

        // Extract address components from Mapbox context
        const context = feature.context || []
        const getContextValue = (type: string) =>
          context.find((c: { id: string; text: string }) => c.id.startsWith(type))?.text || ''

        // Determine address_line1 - use place_name for the main part, or text for address type
        let address_line1 = ''
        if (feature.place_type?.includes('address')) {
          address_line1 = feature.address
            ? `${feature.address} ${feature.text}`
            : feature.text
        } else {
          address_line1 = feature.text || ''
        }

        const city =
          feature.place_type?.includes('place')
            ? feature.text
            : getContextValue('place')
        const state = getContextValue('region')
        const zip_code =
          feature.place_type?.includes('postcode')
            ? feature.text
            : getContextValue('postcode')

        append({
          label: '',
          address_line1,
          city,
          state,
          zip_code,
          formatted_address: feature.place_name || input,
          latitude: lat,
          longitude: lng,
        })

        setAddressSearch('')
      } else {
        setGeocodeError('No results found. Try a different address.')
      }
    } catch (err) {
      console.error('Geocoding error:', err)
      setGeocodeError('Failed to look up address. Please try again.')
    } finally {
      setIsGeocoding(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-semibold mb-1">Service details</h2>
        <p className="text-gray-500">Where do you operate and what do you charge?</p>
      </div>

      <div className="space-y-4">
        {/* Locations section */}
        <div className="space-y-2">
          <Label>Service Locations</Label>
          <p className="text-sm text-gray-500">
            Add the addresses where you provide services (at least one required)
          </p>

          {/* Existing location cards */}
          {fields.length > 0 && (
            <div className="space-y-3">
              {fields.map((field, index) => (
                <Card key={field.id} className="relative">
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-start gap-3">
                      <MapPin className="w-5 h-5 text-gray-400 mt-0.5 shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium">
                            {(field as Record<string, unknown>).formatted_address as string}
                          </span>
                          {index === 0 && (
                            <Badge variant="secondary" className="text-xs">
                              Primary
                            </Badge>
                          )}
                        </div>
                        <div>
                          <Label htmlFor={`locations.${index}.label`} className="text-xs text-gray-500">
                            Label (e.g. &quot;Main Studio&quot;, &quot;Weekend Location&quot;)
                          </Label>
                          <Input
                            id={`locations.${index}.label`}
                            {...register(`locations.${index}.label`)}
                            placeholder="Optional label"
                            className="mt-1 h-8 text-sm"
                          />
                        </div>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="shrink-0 text-gray-400 hover:text-red-500"
                        onClick={() => remove(index)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Address search input */}
          <div className="space-y-1">
            <div className="flex gap-2">
              <Input
                type="text"
                value={addressSearch}
                onChange={(e) => setAddressSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault()
                    handleAddressSearch()
                  }
                }}
                placeholder="Enter an address, city, or zip code..."
                className="flex-1"
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleAddressSearch}
                disabled={isGeocoding || !addressSearch.trim()}
              >
                {isGeocoding ? 'Searching...' : 'Add'}
              </Button>
            </div>
            {geocodeError && (
              <p className="text-sm text-red-500">{geocodeError}</p>
            )}
          </div>
        </div>

        {/* Pricing section */}
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
        <Button onClick={onSubmit} disabled={isSubmitting || fields.length === 0}>
          {isSubmitting ? 'Creating Profile...' : 'Create Profile'}
        </Button>
      </div>
    </div>
  )
}

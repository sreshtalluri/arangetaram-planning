import { useMemo, useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

interface VendorLocation {
  id: string
  label: string | null
  city: string
  state: string
  latitude: number
  longitude: number
  is_primary: boolean | null
}

interface VendorMapProps {
  locations: VendorLocation[]
  className?: string
}

export function VendorMap({ locations, className = '' }: VendorMapProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const initialViewState = useMemo(() => {
    if (locations.length === 0) return null
    if (locations.length === 1) {
      return {
        latitude: locations[0].latitude,
        longitude: locations[0].longitude,
        zoom: 12,
      }
    }
    const lats = locations.map(l => l.latitude)
    const lngs = locations.map(l => l.longitude)
    return {
      latitude: (Math.min(...lats) + Math.max(...lats)) / 2,
      longitude: (Math.min(...lngs) + Math.max(...lngs)) / 2,
      zoom: 10,
    }
  }, [locations])

  if (!initialViewState || !MAPBOX_TOKEN) return null

  const selected = locations.find(l => l.id === selectedId)

  return (
    <div className={`rounded-xl overflow-hidden ${className}`}>
      <Map
        initialViewState={initialViewState}
        style={{ width: '100%', height: '100%' }}
        mapStyle="mapbox://styles/mapbox/light-v11"
        mapboxAccessToken={MAPBOX_TOKEN}
      >
        <NavigationControl position="top-right" />
        {locations.map((loc) => (
          <Marker
            key={loc.id}
            latitude={loc.latitude}
            longitude={loc.longitude}
            onClick={(e) => {
              e.originalEvent.stopPropagation()
              setSelectedId(loc.id)
            }}
          >
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center border-2 cursor-pointer ${
                loc.is_primary
                  ? 'bg-[#800020] border-[#C5A059]'
                  : 'bg-[#0F4C5C] border-white'
              }`}
            >
              <MapPin className="w-4 h-4 text-white" />
            </div>
          </Marker>
        ))}
        {selected && (
          <Popup
            latitude={selected.latitude}
            longitude={selected.longitude}
            onClose={() => setSelectedId(null)}
            closeButton
            closeOnClick={false}
          >
            <div className="p-1">
              <p className="font-medium text-sm">{selected.label || 'Location'}</p>
              <p className="text-xs text-gray-500">{selected.city}, {selected.state}</p>
            </div>
          </Popup>
        )}
      </Map>
    </div>
  )
}

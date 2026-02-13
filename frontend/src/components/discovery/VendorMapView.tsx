import { useState } from 'react'
import Map, { Marker, Popup, NavigationControl } from 'react-map-gl/mapbox'
import { MapPin } from 'lucide-react'
import { useNavigate } from 'react-router-dom'

const MAPBOX_TOKEN = process.env.REACT_APP_MAPBOX_TOKEN

interface VendorPin {
  id: string
  business_name: string
  category: string
  price_range: string
  location: string
  latitude?: number
  longitude?: number
}

interface VendorMapViewProps {
  vendors: VendorPin[]
  centerLat?: number
  centerLng?: number
}

export function VendorMapView({ vendors, centerLat, centerLng }: VendorMapViewProps) {
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const navigate = useNavigate()

  // Note: in the current implementation, vendors from the RPC don't have lat/lng on the vendor object directly.
  // The RPC returns nearest_city/nearest_state but not the actual coordinates.
  // For the map view to work properly, we'd need to either:
  // 1. Add lat/lng to the RPC return, or
  // 2. Fetch vendor_locations separately
  // For now, filter to vendors that have coordinates
  const mappableVendors = vendors.filter((v): v is VendorPin & { latitude: number; longitude: number } =>
    v.latitude != null && v.longitude != null
  )
  const selected = mappableVendors.find(v => v.id === selectedId)

  if (!MAPBOX_TOKEN || mappableVendors.length === 0) {
    return (
      <div className="flex items-center justify-center h-full bg-[#F9F8F4] rounded-xl">
        <p className="text-[#888888] text-sm">No vendors with locations to display on map</p>
      </div>
    )
  }

  return (
    <Map
      initialViewState={{
        latitude: centerLat || mappableVendors[0].latitude,
        longitude: centerLng || mappableVendors[0].longitude,
        zoom: 10,
      }}
      style={{ width: '100%', height: '100%' }}
      mapStyle="mapbox://styles/mapbox/light-v11"
      mapboxAccessToken={MAPBOX_TOKEN}
    >
      <NavigationControl position="top-right" />
      {mappableVendors.map((vendor) => (
        <Marker
          key={vendor.id}
          latitude={vendor.latitude}
          longitude={vendor.longitude}
          onClick={(e) => {
            e.originalEvent.stopPropagation()
            setSelectedId(vendor.id)
          }}
        >
          <div className="w-8 h-8 rounded-full bg-[#800020] border-2 border-[#C5A059] flex items-center justify-center cursor-pointer">
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
          <div
            className="p-2 cursor-pointer"
            onClick={() => navigate(`/vendors/${selected.id}`)}
          >
            <p className="font-medium text-sm">{selected.business_name}</p>
            <p className="text-xs text-gray-500">{selected.category}</p>
            <p className="text-xs text-[#0F4C5C]">{selected.price_range}</p>
          </div>
        </Popup>
      )}
    </Map>
  )
}

import { TruckIcon } from 'lucide-react'
import { Marker } from 'react-map-gl/maplibre'
import { TruckStatus, type TruckPosition } from '../types/truck'

// Tooltip and screen-reader text for each trip status.
const TRUCK_STATUS_LABELS: Record<TruckStatus, string> = {
  [TruckStatus.NOT_DEPARTED]: 'Truck: not departed yet',
  [TruckStatus.ON_THE_WAY]: 'Truck: on the way',
  [TruckStatus.ARRIVED]: 'Truck: arrived',
}

type TruckMarkerProps = {
  position: TruckPosition
}

// The truck on the selected route at the forecast slider's time.
export function TruckMarker({ position }: TruckMarkerProps) {
  const [lon, lat] = position.lonLat
  const label = TRUCK_STATUS_LABELS[position.status]

  return (
    // anchor="center" puts the middle of the icon on the road.
    <Marker longitude={lon} latitude={lat} anchor="center">
      {/* A near-black box with an ice-blue border stands out on every risk color. */}
      <div
        className="flex h-6 w-8 cursor-default items-center justify-center border-2 border-primary bg-asphalt text-primary drop-shadow-map-pin"
        title={label}
        role="img"
        aria-label={label}
      >
        <TruckIcon className="size-4" aria-hidden="true" />
      </div>
    </Marker>
  )
}

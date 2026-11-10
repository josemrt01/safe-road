import { Marker } from 'react-map-gl/maplibre'
import { RouteEndpoint } from '../types/routeEndpoint'
import type { Place } from '../types/tripPlan'

// Screen-reader and hover name for each end of the route.
const ENDPOINT_NAMES = {
  [RouteEndpoint.START]: 'Start',
  [RouteEndpoint.END]: 'Destination',
}

// Shape and colors of each end: an off-white dot at the start, an ice-blue square at the destination,
// both with a dark ring; the same shapes as the origin and destination fields of the form.
const ENDPOINT_CLASS_NAMES = {
  [RouteEndpoint.START]: 'rounded-full bg-foreground',
  [RouteEndpoint.END]: 'bg-primary',
}

type RouteEndpointMarkerProps = {
  place: Place
  endpoint: RouteEndpoint
}

// One end of the route on the map.
export function RouteEndpointMarker({ place, endpoint }: RouteEndpointMarkerProps) {
  const description = `${ENDPOINT_NAMES[endpoint]}: ${place.label}`

  return (
    // anchor="center" puts the middle of the shape on the place.
    <Marker longitude={place.lon} latitude={place.lat} anchor="center">
      <div
        className={`size-4 cursor-default border-[3px] border-asphalt drop-shadow-map-pin ${ENDPOINT_CLASS_NAMES[endpoint]}`}
        title={description}
        role="img"
        aria-label={description}
      />
    </Marker>
  )
}

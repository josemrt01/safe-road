import along from '@turf/along'
import { lineString } from '@turf/helpers'
import type { Feature, FeatureCollection, LineString, Point } from 'geojson'
import type { RiskLevel } from '../types/risk'
import type { Checkpoint, LonLat, RoutePlan } from '../types/tripPlan'
import { TruckStatus, type TruckPosition } from '../types/truck'

// Properties on each route segment feature; index N is the segment from checkpoint N to checkpoint N+1,
// and level is the risk level that colors it.
export type RouteSegmentProperties = { index: number; level: RiskLevel }

// The road line between two checkpoints: the start, the route points between them, and the end.
export function getSegmentCoordinates(geometry: LonLat[], start: Checkpoint, end: Checkpoint): LonLat[] {
  // The route points strictly between the two checkpoints: the ones after the start's previous point,
  // up to and including the end's previous point.
  const pointsBetween = geometry.slice(start.previous_point_index + 1, end.previous_point_index + 1)

  return [[start.lon, start.lat], ...pointsBetween, [end.lon, end.lat]]
}

// Cuts the route line into segments that run from one checkpoint to the next.
export function buildRouteSegments(
  geometry: LonLat[],
  checkpoints: Checkpoint[],
): FeatureCollection<LineString, RouteSegmentProperties> {
  const features: Feature<LineString, RouteSegmentProperties>[] = []

  for (let index = 0; index < checkpoints.length - 1; index++) {
    const start = checkpoints[index]
    const end = checkpoints[index + 1]

    // Same rule as the backend summary: a segment is as risky as its worse end.
    const level = getWorseCheckpoint(start, end).level

    features.push({
      type: 'Feature',
      properties: { index, level },
      geometry: { type: 'LineString', coordinates: getSegmentCoordinates(geometry, start, end) },
    })
  }

  return { type: 'FeatureCollection', features }
}

export function buildCheckpointPoints(checkpoints: Checkpoint[]): FeatureCollection<Point> {
  return {
    type: 'FeatureCollection',
    features: checkpoints.map((checkpoint) => ({
      type: 'Feature',
      properties: {},
      geometry: { type: 'Point', coordinates: [checkpoint.lon, checkpoint.lat] },
    })),
  }
}

// The end of a segment that gave it its color; on a tie, the start; used for the map colors, the risk strip,
// the hourly forecast bars and the segment details.
export function getWorseCheckpoint(start: Checkpoint, end: Checkpoint): Checkpoint {
  if (end.level > start.level) {
    return end
  }

  return start
}

// Properties on each unselected route line; id is "A", "B" or "C".
export type OtherRouteProperties = { id: string }

// One line per route except the selected one; drawn gray under the selected route.
export function buildOtherRouteLines(
  routes: RoutePlan[],
  selectedRouteId: string,
): FeatureCollection<LineString, OtherRouteProperties> {
  const features: Feature<LineString, OtherRouteProperties>[] = []

  for (const route of routes) {
    if (route.id === selectedRouteId) {
      continue
    }

    features.push({
      type: 'Feature',
      properties: { id: route.id },
      geometry: { type: 'LineString', coordinates: route.geometry },
    })
  }

  return { type: 'FeatureCollection', features }
}

// Where the truck is on the route at the given time: at the start before departure, at the end after arrival,
// otherwise along the road between the two checkpoints around that time.
export function getTruckPosition(route: RoutePlan, time: Date): TruckPosition {
  const checkpoints = route.checkpoints
  const first = checkpoints[0]
  const last = checkpoints[checkpoints.length - 1]

  if (time.getTime() <= new Date(first.eta_utc).getTime()) {
    return { lonLat: [first.lon, first.lat], status: TruckStatus.NOT_DEPARTED }
  }
  if (time.getTime() >= new Date(last.eta_utc).getTime()) {
    return { lonLat: [last.lon, last.lat], status: TruckStatus.ARRIVED }
  }

  // Not reachable (the checks above leave only times inside the trip); keeps TypeScript sure index is a number.
  const index = getSegmentIndexAtTime(checkpoints, time)
  if (index === null) {
    return { lonLat: [last.lon, last.lat], status: TruckStatus.ARRIVED }
  }

  const start = checkpoints[index]
  const end = checkpoints[index + 1]
  const startTime = new Date(start.eta_utc).getTime()
  const endTime = new Date(end.eta_utc).getTime()

  // Share of this segment's driving time already done: 0 = at its start, 1 = at its end.
  // Example: 13:00 to 14:00 with the slider at 13:30 gives 0.5, halfway.
  const fraction = (time.getTime() - startTime) / (endTime - startTime)
  const milesIntoSegment = fraction * (end.mile - start.mile)

  // along() walks that many miles down the road line, following its bends.
  const segmentLine = lineString(getSegmentCoordinates(route.geometry, start, end))
  const point = along(segmentLine, milesIntoSegment, { units: 'miles' })

  return { lonLat: point.geometry.coordinates as LonLat, status: TruckStatus.ON_THE_WAY }
}

// Index of the segment the truck is driving at the given time (N = from checkpoint N to N+1), or null before the
// first checkpoint's time and from the last one's on; used by getTruckPosition and the forecast band.
export function getSegmentIndexAtTime(checkpoints: Checkpoint[], time: Date): number | null {
  for (let index = 0; index < checkpoints.length - 1; index++) {
    const startTime = new Date(checkpoints[index].eta_utc).getTime()
    const endTime = new Date(checkpoints[index + 1].eta_utc).getTime()

    if (time.getTime() >= startTime && time.getTime() < endTime) {
      return index
    }
  }

  return null
}

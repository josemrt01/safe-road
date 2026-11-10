import type { RiskLevel } from '../types/risk'
import type { Checkpoint, MilesByLevel, RoutePlan } from '../types/tripPlan'
import { getWorseCheckpoint } from './routeGeometry'

// Miles at High or worse: the part of the trip worth worrying about.
export function getRiskyMiles(milesByLevel: MilesByLevel): number {
  return milesByLevel.high + milesByLevel.severe + milesByLevel.no_travel
}

// Risky miles as a whole percent of the trip, e.g. 7.
export function getRiskyPercent(riskyMiles: number, distanceMi: number): number {
  if (distanceMi === 0) return 0

  return Math.round((riskyMiles / distanceMi) * 100)
}

// Id of the quickest route; the card shows a "Fastest" pill on it when it isn't the recommended one.
export function getFastestRouteId(routes: RoutePlan[]): string {
  let fastestRoute = routes[0]
  for (const route of routes) {
    if (route.duration_s < fastestRoute.duration_s) {
      fastestRoute = route
    }
  }

  return fastestRoute.id
}

// One piece of a route's risk strip: neighboring segments with the same level, joined.
export type RiskStripPiece = {
  level: RiskLevel
  miles: number
}

// The route from start to end as pieces of one risk level each, e.g. 100 mi Low, 50 mi Severe, 368 mi Low;
// used by the risk strip on each route row.
export function getRiskStripPieces(checkpoints: Checkpoint[]): RiskStripPiece[] {
  const pieces: RiskStripPiece[] = []

  for (let index = 0; index < checkpoints.length - 1; index++) {
    const start = checkpoints[index]
    const end = checkpoints[index + 1]
    const level = getWorseCheckpoint(start, end).level
    const miles = end.mile - start.mile
    const lastPiece = pieces[pieces.length - 1]

    // Same level as the piece before: make that piece longer instead of starting a new one.
    if (lastPiece && lastPiece.level === level) {
      lastPiece.miles += miles
    } else {
      pieces.push({ level, miles })
    }
  }

  return pieces
}

import { RISK_LEVEL_LABELS } from '../config/riskConfig'
import type { RiskLevel } from '../types/risk'
import type { RoutePlan } from '../types/tripPlan'
import { getForecastHourTime } from './dateTime'
import { getSegmentIndexAtTime, getWorseCheckpoint } from './routeGeometry'

// The risk level where the truck is during one forecast hour; one bar under the forecast slider.
export type HourLevel = {
  hour: number
  level: RiskLevel
}

// The level of the segment the truck drives at each forecast hour from 0 to lastHour; hours before departure or
// after arrival are left out, so the bars show only the trip.
export function getTripHourLevels(route: RoutePlan, startHourUtc: string, lastHour: number): HourLevel[] {
  const hourLevels: HourLevel[] = []

  for (let hour = 0; hour <= lastHour; hour++) {
    const index = getSegmentIndexAtTime(route.checkpoints, getForecastHourTime(startHourUtc, hour))
    if (index === null) continue

    const level = getWorseCheckpoint(route.checkpoints[index], route.checkpoints[index + 1]).level
    hourLevels.push({ hour, level })
  }

  return hourLevels
}

// Where the truck is at the slider's time, in words: "Not on the road yet", "Miles 150–175 · Severe" or "Arrived".
export function getTruckProgressText(route: RoutePlan, time: Date): string {
  const checkpoints = route.checkpoints
  const index = getSegmentIndexAtTime(checkpoints, time)

  // No segment means before departure or from arrival on.
  if (index === null) {
    return time.getTime() < new Date(checkpoints[0].eta_utc).getTime() ? 'Not on the road yet' : 'Arrived'
  }

  const start = checkpoints[index]
  const end = checkpoints[index + 1]
  const level = getWorseCheckpoint(start, end).level

  return `Miles ${start.mile}–${end.mile} · ${RISK_LEVEL_LABELS[level]}`
}

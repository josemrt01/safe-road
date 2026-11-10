import { RiskCause, RiskLevel } from '../types/risk'
import type { Checkpoint } from '../types/tripPlan'

// A checkpoint for tests at mile 0 with calm weather; pass only the fields the test cares about.
export function makeCheckpoint(overrides: Partial<Checkpoint>): Checkpoint {
  return {
    mile: 0,
    lon: 0,
    lat: 0,
    eta_utc: '2026-10-13T13:00:00Z',
    previous_point_index: 0,
    forecast_hour_utc: '2026-10-13T13:00:00Z',
    wind_gust_mph: 0,
    wind_speed_mph: 0,
    rain_in_hr: 0,
    snow_in_hr: 0,
    level: RiskLevel.LOW,
    cause: RiskCause.NONE,
    // The given fields replace the defaults above.
    ...overrides,
  }
}

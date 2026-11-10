import { describe, expect, it } from 'vitest'
import { makeCheckpoint } from '../test/makeCheckpoint'
import { makeRoutePlan } from '../test/makeRoutePlan'
import { RiskLevel } from '../types/risk'
import { getTripHourLevels, getTruckProgressText } from './tripTimeline'

// A trip from 13:00 to 15:00: miles 0-25 Low, then miles 25-50 Severe (from the checkpoint at mile 50).
const route = makeRoutePlan({
  checkpoints: [
    makeCheckpoint({ mile: 0, eta_utc: '2026-10-13T13:00:00Z' }),
    makeCheckpoint({ mile: 25, eta_utc: '2026-10-13T14:00:00Z' }),
    makeCheckpoint({ mile: 50, eta_utc: '2026-10-13T15:00:00Z', level: RiskLevel.SEVERE }),
  ],
})

describe('getTripHourLevels', () => {
  it('gives one level per forecast hour on the road', () => {
    // Hour 0 is 12:00, so hours 1 and 2 are 13:00 and 14:00; 15:00 is the arrival, no longer on the road.
    expect(getTripHourLevels(route, '2026-10-13T12:00:00Z', 4)).toEqual([
      { hour: 1, level: RiskLevel.LOW },
      { hour: 2, level: RiskLevel.SEVERE },
    ])
  })

  it('is empty when the trip starts after the last forecast hour', () => {
    expect(getTripHourLevels(route, '2026-10-13T08:00:00Z', 2)).toEqual([])
  })
})

describe('getTruckProgressText', () => {
  it('says the truck has not left before departure', () => {
    expect(getTruckProgressText(route, new Date('2026-10-13T12:00:00Z'))).toBe('Not on the road yet')
  })

  it('names the miles and level of the segment being driven', () => {
    expect(getTruckProgressText(route, new Date('2026-10-13T14:30:00Z'))).toBe('Miles 25–50 · Severe')
  })

  it('says the truck arrived from the arrival time on', () => {
    expect(getTruckProgressText(route, new Date('2026-10-13T15:00:00Z'))).toBe('Arrived')
  })
})

import { describe, expect, it } from 'vitest'
import { makeCheckpoint } from '../test/makeCheckpoint'
import { makeRoutePlan } from '../test/makeRoutePlan'
import { RiskLevel } from '../types/risk'
import type { MilesByLevel } from '../types/tripPlan'
import { getFastestRouteId, getRiskStripPieces, getRiskyMiles, getRiskyPercent } from './routeRisk'

// 200 miles in all: mostly Low, some High and Severe, no Moderate or No Travel.
const milesByLevel: MilesByLevel = { low: 150, moderate: 0, high: 30, severe: 20, no_travel: 0 }

describe('getRiskyMiles', () => {
  it('adds High, Severe and No Travel miles', () => {
    expect(getRiskyMiles({ ...milesByLevel, no_travel: 5 })).toBe(55)
  })
})

describe('getRiskyPercent', () => {
  it('rounds the share of the trip to a whole percent', () => {
    expect(getRiskyPercent(16, 225)).toBe(7)
  })

  it('is 0 for a route without distance', () => {
    expect(getRiskyPercent(0, 0)).toBe(0)
  })
})

describe('getFastestRouteId', () => {
  it('returns the id of the shortest duration', () => {
    const routes = [
      makeRoutePlan({ id: 'A', duration_s: 12_000 }),
      makeRoutePlan({ id: 'B', duration_s: 11_000 }),
      makeRoutePlan({ id: 'C', duration_s: 15_000 }),
    ]

    expect(getFastestRouteId(routes)).toBe('B')
  })
})

describe('getRiskStripPieces', () => {
  it('joins neighboring segments of the same level into one piece', () => {
    const checkpoints = [
      makeCheckpoint({ mile: 0 }),
      makeCheckpoint({ mile: 25 }),
      makeCheckpoint({ mile: 50, level: RiskLevel.SEVERE }),
      makeCheckpoint({ mile: 75 }),
      makeCheckpoint({ mile: 100 }),
      makeCheckpoint({ mile: 110 }),
    ]

    // 25-50 and 50-75 take Severe from mile 50; the rest is Low.
    expect(getRiskStripPieces(checkpoints)).toEqual([
      { level: RiskLevel.LOW, miles: 25 },
      { level: RiskLevel.SEVERE, miles: 50 },
      { level: RiskLevel.LOW, miles: 35 },
    ])
  })

  it('is empty for a route with a single checkpoint', () => {
    expect(getRiskStripPieces([makeCheckpoint({})])).toEqual([])
  })
})

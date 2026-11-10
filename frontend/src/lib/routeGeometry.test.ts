import { describe, expect, it } from 'vitest'
import { RiskLevel } from '../types/risk'
import { makeCheckpoint } from '../test/makeCheckpoint'
import { makeRoutePlan } from '../test/makeRoutePlan'
import type { Checkpoint, LonLat } from '../types/tripPlan'
import { TruckStatus } from '../types/truck'
import {
  buildCheckpointPoints,
  buildOtherRouteLines,
  buildRouteSegments,
  getSegmentIndexAtTime,
  getTruckPosition,
  getWorseCheckpoint,
} from './routeGeometry'

// A checkpoint on the test route; position, previous_point_index and level matter, the weather is calm.
function makePlacedCheckpoint(
  lon: number,
  lat: number,
  previousPointIndex: number,
  level: RiskLevel = RiskLevel.LOW,
): Checkpoint {
  return makeCheckpoint({ lon, lat, previous_point_index: previousPointIndex, level })
}

describe('buildRouteSegments', () => {
  // Route points: 0 (0,0), 1 (10,0), 2 (20,0), 3 (30,0).
  const straightRoute: LonLat[] = [
    [0, 0],
    [10, 0],
    [20, 0],
    [30, 0],
  ]

  it('makes one segment per pair of neighboring checkpoints', () => {
    const checkpoints = [makePlacedCheckpoint(0, 0, 0), makePlacedCheckpoint(15, 0, 1), makePlacedCheckpoint(30, 0, 2)]

    const segments = buildRouteSegments(straightRoute, checkpoints)

    expect(segments.features.map((feature) => feature.properties.index)).toEqual([0, 1])
  })

  it('includes the route points between two checkpoints', () => {
    // The start lies after point 0 (between points 0 and 1), the end after point 2 (between points 2 and 3).
    const checkpoints = [makePlacedCheckpoint(5, 0, 0), makePlacedCheckpoint(25, 0, 2)]

    const segments = buildRouteSegments(straightRoute, checkpoints)

    expect(segments.features[0].geometry.coordinates).toEqual([
      [5, 0],
      [10, 0],
      [20, 0],
      [25, 0],
    ])
  })

  it('is a straight piece when both checkpoints lie between the same two route points', () => {
    const checkpoints = [makePlacedCheckpoint(12, 0, 1), makePlacedCheckpoint(18, 0, 1)]

    const segments = buildRouteSegments(straightRoute, checkpoints)

    expect(segments.features[0].geometry.coordinates).toEqual([
      [12, 0],
      [18, 0],
    ])
  })
})

describe('buildRouteSegments risk level', () => {
  it('colors a segment by the worse of its two ends', () => {
    const route: LonLat[] = [
      [0, 0],
      [10, 0],
    ]
    const checkpoints = [makePlacedCheckpoint(0, 0, 0, RiskLevel.LOW), makePlacedCheckpoint(10, 0, 0, RiskLevel.SEVERE)]

    const segments = buildRouteSegments(route, checkpoints)

    expect(segments.features[0].properties.level).toBe(RiskLevel.SEVERE)
  })
})

describe('getWorseCheckpoint', () => {
  it('returns the end when it is worse', () => {
    const start = makePlacedCheckpoint(0, 0, 0, RiskLevel.MODERATE)
    const end = makePlacedCheckpoint(10, 0, 0, RiskLevel.HIGH)

    expect(getWorseCheckpoint(start, end)).toBe(end)
  })

  it('returns the start on a tie', () => {
    const start = makePlacedCheckpoint(0, 0, 0, RiskLevel.HIGH)
    const end = makePlacedCheckpoint(10, 0, 0, RiskLevel.HIGH)

    expect(getWorseCheckpoint(start, end)).toBe(start)
  })
})

describe('buildCheckpointPoints', () => {
  it('makes one [lon, lat] point per checkpoint', () => {
    const points = buildCheckpointPoints([makePlacedCheckpoint(-96.8, 32.8, 0), makePlacedCheckpoint(-95.4, 29.8, 3)])

    expect(points.features.map((feature) => feature.geometry.coordinates)).toEqual([
      [-96.8, 32.8],
      [-95.4, 29.8],
    ])
  })
})

describe('buildOtherRouteLines', () => {
  const routeA = makeRoutePlan({
    id: 'A',
    geometry: [
      [0, 0],
      [10, 0],
    ],
  })
  const routeB = makeRoutePlan({
    id: 'B',
    geometry: [
      [0, 0],
      [5, 5],
      [10, 0],
    ],
  })
  const routeC = makeRoutePlan({
    id: 'C',
    geometry: [
      [0, 0],
      [5, -5],
      [10, 0],
    ],
  })

  it('makes one line per route except the selected one', () => {
    const lines = buildOtherRouteLines([routeA, routeB, routeC], 'B')

    expect(lines.features.map((feature) => feature.properties.id)).toEqual(['A', 'C'])
  })

  it("uses each route's own geometry", () => {
    const lines = buildOtherRouteLines([routeA, routeB, routeC], 'B')

    expect(lines.features[1].geometry.coordinates).toEqual(routeC.geometry)
  })

  it('is empty when the only route is the selected one', () => {
    expect(buildOtherRouteLines([routeA], 'A').features).toEqual([])
  })
})

describe('getTruckPosition', () => {
  // Miles in one degree along the equator (Earth radius 3958.8 mi), the unit along() measures in.
  const ONE_DEGREE_MI = (2 * Math.PI * 3958.8) / 360

  // A checkpoint with a given place, mile and arrival time; previous_point_index places it on the route.
  function makeTimedCheckpoint(lon: number, lat: number, previousPointIndex: number, mile: number, etaUtc: string) {
    return { ...makePlacedCheckpoint(lon, lat, previousPointIndex), mile, eta_utc: etaUtc }
  }

  // Straight route (0,0) -> (1,0), driven from 13:00 to 14:00.
  const straightRoute = makeRoutePlan({
    geometry: [
      [0, 0],
      [1, 0],
    ],
    checkpoints: [
      makeTimedCheckpoint(0, 0, 0, 0, '2026-10-13T13:00:00Z'),
      makeTimedCheckpoint(1, 0, 0, ONE_DEGREE_MI, '2026-10-13T14:00:00Z'),
    ],
  })

  it('waits at the start before departure', () => {
    const position = getTruckPosition(straightRoute, new Date('2026-10-13T12:00:00Z'))

    expect(position).toEqual({ lonLat: [0, 0], status: TruckStatus.NOT_DEPARTED })
  })

  it('stays at the end after arrival', () => {
    const position = getTruckPosition(straightRoute, new Date('2026-10-13T15:00:00Z'))

    expect(position).toEqual({ lonLat: [1, 0], status: TruckStatus.ARRIVED })
  })

  it('is halfway at half the driving time', () => {
    const position = getTruckPosition(straightRoute, new Date('2026-10-13T13:30:00Z'))

    expect(position.status).toBe(TruckStatus.ON_THE_WAY)
    expect(position.lonLat[0]).toBeCloseTo(0.5, 3)
    expect(position.lonLat[1]).toBeCloseTo(0, 3)
  })

  it('follows the road around a corner instead of cutting across', () => {
    // Road (0,0) -> (1,0) -> (1,1), with checkpoints only at its two ends.
    const cornerRoute = makeRoutePlan({
      geometry: [
        [0, 0],
        [1, 0],
        [1, 1],
      ],
      checkpoints: [
        makeTimedCheckpoint(0, 0, 0, 0, '2026-10-13T13:00:00Z'),
        makeTimedCheckpoint(1, 1, 1, 2 * ONE_DEGREE_MI, '2026-10-13T15:00:00Z'),
      ],
    })

    // Half the time = half the road = the corner, not the straight-line middle (0.5, 0.5).
    const position = getTruckPosition(cornerRoute, new Date('2026-10-13T14:00:00Z'))

    expect(position.lonLat[0]).toBeCloseTo(1, 2)
    expect(position.lonLat[1]).toBeCloseTo(0, 2)
  })

  it('is at a middle checkpoint at exactly its arrival time', () => {
    const route = makeRoutePlan({
      geometry: [
        [0, 0],
        [1, 0],
        [2, 0],
      ],
      checkpoints: [
        makeTimedCheckpoint(0, 0, 0, 0, '2026-10-13T13:00:00Z'),
        makeTimedCheckpoint(1, 0, 0, ONE_DEGREE_MI, '2026-10-13T14:00:00Z'),
        makeTimedCheckpoint(2, 0, 1, 2 * ONE_DEGREE_MI, '2026-10-13T15:00:00Z'),
      ],
    })

    const position = getTruckPosition(route, new Date('2026-10-13T14:00:00Z'))

    expect(position.lonLat[0]).toBeCloseTo(1, 3)
  })
})

describe('getSegmentIndexAtTime', () => {
  // Three checkpoints driven at 13:00, 14:00 and 15:00, so two segments.
  const checkpoints = [
    makeCheckpoint({ eta_utc: '2026-10-13T13:00:00Z' }),
    makeCheckpoint({ eta_utc: '2026-10-13T14:00:00Z' }),
    makeCheckpoint({ eta_utc: '2026-10-13T15:00:00Z' }),
  ]

  it('is null before departure', () => {
    expect(getSegmentIndexAtTime(checkpoints, new Date('2026-10-13T12:59:00Z'))).toBeNull()
  })

  it('finds the segment the time falls in', () => {
    expect(getSegmentIndexAtTime(checkpoints, new Date('2026-10-13T13:00:00Z'))).toBe(0)
    expect(getSegmentIndexAtTime(checkpoints, new Date('2026-10-13T14:30:00Z'))).toBe(1)
  })

  it('moves to the next segment at exactly a checkpoint time', () => {
    expect(getSegmentIndexAtTime(checkpoints, new Date('2026-10-13T14:00:00Z'))).toBe(1)
  })

  it('is null from arrival on', () => {
    expect(getSegmentIndexAtTime(checkpoints, new Date('2026-10-13T15:00:00Z'))).toBeNull()
  })
})

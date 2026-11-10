import { describe, expect, it } from 'vitest'
import { ROUTE_FIT_PADDING } from '../config/mapConfig'
import { getRouteFitPadding } from './routeFitPadding'

describe('getRouteFitPadding', () => {
  it('uses the fixed padding on wide screens', () => {
    expect(getRouteFitPadding(true, 900)).toEqual(ROUTE_FIT_PADDING)
  })

  it('leaves room at the bottom for the half-height drawer and the compact forecast band', () => {
    // 844 x 0.5 = 422 for the drawer, plus 140 for the band.
    expect(getRouteFitPadding(false, 844)).toEqual({ top: 60, right: 40, bottom: 562, left: 40 })
  })

  it('never leaves less than 120px of map on a short screen', () => {
    // 390 tall: 390 - 60 top - 120 map = 210 at most for the bottom.
    expect(getRouteFitPadding(false, 390).bottom).toBe(210)
  })
})

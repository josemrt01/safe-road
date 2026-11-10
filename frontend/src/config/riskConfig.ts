import { RiskCause, RiskLevel } from '../types/risk'

// Color per risk level, bright enough to read on the dark map and panel; a JS value because MapLibre paints on a
// canvas and can't read CSS variables; used by the map, the legend, the route rows, the risk strip, the hourly
// forecast bars, the segment details and the risk table.
export const RISK_LEVEL_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: '#45b061',
  [RiskLevel.MODERATE]: '#e3b53c',
  [RiskLevel.HIGH]: '#ee7b30',
  [RiskLevel.SEVERE]: '#e5404a',
  [RiskLevel.NO_TRAVEL]: '#a35bd1',
}

// Text color that stays readable on each level's color: near-black on the lighter green, yellow and orange,
// off-white on red and purple. CSS variables, since this is only used on page elements (not the map canvas);
// used by the route rows' number blocks, the segment details band and the risk table.
export const RISK_LEVEL_TEXT_COLORS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'var(--color-asphalt)',
  [RiskLevel.MODERATE]: 'var(--color-asphalt)',
  [RiskLevel.HIGH]: 'var(--color-asphalt)',
  [RiskLevel.SEVERE]: 'var(--color-foreground)',
  [RiskLevel.NO_TRAVEL]: 'var(--color-foreground)',
}

// Name shown for each risk level; used by RiskLegend, SegmentDetails, the route rows, the risk strip and table.
export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  [RiskLevel.LOW]: 'Low',
  [RiskLevel.MODERATE]: 'Moderate',
  [RiskLevel.HIGH]: 'High',
  [RiskLevel.SEVERE]: 'Severe',
  [RiskLevel.NO_TRAVEL]: 'No Travel',
}

// Text shown for what caused a level; used by SegmentDetails.
export const RISK_CAUSE_LABELS: Record<RiskCause, string> = {
  [RiskCause.NONE]: 'Calm weather',
  [RiskCause.WIND]: 'Wind gusts',
  [RiskCause.WIND_LOAD_RULE]: 'Wind gusts + heavy load',
  [RiskCause.RAIN]: 'Rain',
  [RiskCause.SNOW]: 'Snow',
}

// Levels in order from calm to worst; used by RiskLegend to list them.
export const RISK_LEVELS_IN_ORDER: RiskLevel[] = [
  RiskLevel.LOW,
  RiskLevel.MODERATE,
  RiskLevel.HIGH,
  RiskLevel.SEVERE,
  RiskLevel.NO_TRAVEL,
]

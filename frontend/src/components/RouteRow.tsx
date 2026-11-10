import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_TEXT_COLORS } from '../config/riskConfig'
import { formatDistance, formatDuration, formatEta } from '../lib/formatters'
import { getRiskyMiles, getRiskyPercent } from '../lib/routeRisk'
import { getRouteOptionName } from '../lib/tripPlanRoutes'
import type { RoutePlan } from '../types/tripPlan'
import { LabeledValue } from './LabeledValue'
import { RiskStrip } from './RiskStrip'

// Tailwind classes shared by the small tags next to the option name.
const TAG_CLASS_NAME = 'px-1.5 pt-0.5 font-display text-[10px] font-bold tracking-[0.12em] uppercase'

type RouteRowProps = {
  route: RoutePlan
  isRecommended: boolean
  // True on the quickest route; it gets a "Fastest" tag.
  isFastest: boolean
  // Why the recommended route wins; shown only on that row.
  reason: string
  isSelected: boolean
  // Called when the row is clicked; App then draws this route with risk colors.
  onSelect: () => void
}

// One route option as a row: its rank in a block of its worst risk color, then the name, four facts, the risk strip
// and, on the recommended route, why it wins.
export function RouteRow({ route, isRecommended, isFastest, reason, isSelected, onSelect }: RouteRowProps) {
  const riskyMiles = getRiskyMiles(route.miles_by_level)

  // Selected: dark teal with an ice-blue line on the right. Options that are neither recommended nor selected fade
  // back, so the recommended route leads the list; hovering brings them up.
  let rowStateClassName = 'opacity-55 hover:bg-muted/40 hover:opacity-100'
  if (isSelected) {
    rowStateClassName = 'bg-surface shadow-[inset_-3px_0_0_var(--color-primary)]'
  } else if (isRecommended) {
    rowStateClassName = 'hover:bg-muted/40'
  }

  return (
    // A button, so the row works with the mouse, the keyboard (Tab + Enter) and screen readers.
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isSelected}
      className={`grid w-full cursor-pointer grid-cols-[2.75rem_minmax(0,1fr)] border-b border-border text-left ${rowStateClassName}`}
    >
      {/* Colors come from config at runtime, so inline style. */}
      <span
        className="flex items-center justify-center font-display text-2xl font-extrabold"
        style={{ backgroundColor: RISK_LEVEL_COLORS[route.worst_level], color: RISK_LEVEL_TEXT_COLORS[route.worst_level] }}
      >
        {route.rank}
        <span className="sr-only">, worst risk {RISK_LEVEL_LABELS[route.worst_level]}</span>
      </span>

      <span className="flex min-w-0 flex-col gap-3 px-3.5 py-3">
        <span className="flex flex-wrap items-center gap-2">
          <span className="font-display text-sm font-bold tracking-[0.1em] uppercase">{getRouteOptionName(route)}</span>
          {isRecommended && <span className={`${TAG_CLASS_NAME} bg-primary text-primary-foreground`}>Recommended</span>}
          {isFastest && <span className={`${TAG_CLASS_NAME} border border-muted-foreground`}>Fastest</span>}
        </span>

        <span className="grid grid-cols-2 gap-x-3 gap-y-2">
          <LabeledValue label="Time" valueClassName="text-base font-bold">
            {formatDuration(route.duration_s)}
          </LabeledValue>
          <LabeledValue label="Arrives">{formatEta(route.arrival_utc)}</LabeledValue>
          <LabeledValue label="Distance">{formatDistance(route.distance_mi)}</LabeledValue>
          {/* "Risky" means High or worse. */}
          <LabeledValue label="Risky">
            {riskyMiles > 0
              ? `${formatDistance(riskyMiles)} · ${getRiskyPercent(riskyMiles, route.distance_mi)}%`
              : 'None'}
          </LabeledValue>
        </span>

        <RiskStrip checkpoints={route.checkpoints} distanceMi={route.distance_mi} />

        {isRecommended && (
          <span className="border-l-2 border-primary bg-primary/10 px-2.5 py-1.5 text-xs">
            <span className="mr-1.5 font-display font-bold tracking-[0.12em] text-primary uppercase">Why</span>
            {reason}
          </span>
        )}
      </span>
    </button>
  )
}

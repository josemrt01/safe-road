import { getFastestRouteId } from '../lib/routeRisk'
import { getRoutesInRankOrder } from '../lib/tripPlanRoutes'
import type { TripPlan } from '../types/tripPlan'
import { AlertMessage } from './AlertMessage'
import { RouteRow } from './RouteRow'
import { SectionHeading } from './SectionHeading'

type RouteListProps = {
  tripPlan: TripPlan
  selectedRouteId: string
  // Called with "A", "B" or "C" when a row is clicked.
  onSelectRoute: (routeId: string) => void
}

// The route options, recommended first, with the plan's warning and notes above them.
export function RouteList({ tripPlan, selectedRouteId, onSelectRoute }: RouteListProps) {
  const fastestRouteId = getFastestRouteId(tripPlan.routes)

  return (
    <section aria-labelledby="route-options-heading" className="flex flex-col">
      <div className="flex flex-col gap-3 px-4 pt-4 pb-3">
        <SectionHeading id="route-options-heading" strongText="Route" text="options" note="safest first" />

        {/* Every route crosses No Travel: the most important message, so it comes first. */}
        {tripPlan.warning && <AlertMessage title="No safe route">{tripPlan.warning}</AlertMessage>}

        {/* e.g. "Only 2 routes found between these places." */}
        {tripPlan.notes.map((note) => (
          <p key={note} className="text-muted-foreground">
            {note}
          </p>
        ))}
      </div>

      {/* Rows run edge to edge, each closed by its own bottom line. */}
      <div className="border-t border-border">
        {getRoutesInRankOrder(tripPlan.routes).map((route) => (
          <RouteRow
            key={route.id}
            route={route}
            isRecommended={route.id === tripPlan.recommended_route_id}
            isFastest={route.id === fastestRouteId}
            reason={tripPlan.reason}
            isSelected={route.id === selectedRouteId}
            onSelect={() => onSelectRoute(route.id)}
          />
        ))}
      </div>
    </section>
  )
}

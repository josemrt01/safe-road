import type { ElementType } from 'react'
import { BackendStatus } from '../types/backendStatus'
import { PanelView } from '../types/panelView'
import type { TripPlan, TripSettings } from '../types/tripPlan'
import { AlertMessage } from './AlertMessage'
import { PanelTabs } from './PanelTabs'
import { RouteList } from './RouteList'
import { TripForm } from './TripForm'
import { TripSummary } from './TripSummary'

type PanelContentProps = {
  panelView: PanelView
  backendStatus: BackendStatus
  tripPlan: TripPlan | null
  tripSettings: TripSettings | null
  selectedRouteId: string | null
  // Changing it makes React build a new, empty form; Clear adds 1 to it.
  formResetCount: number
  onTripPlanned: (tripPlan: TripPlan, tripSettings: TripSettings) => void
  // Clear, in the form and in the trip summary.
  onClearTrip: () => void
  // The "1 Trip" tab.
  onShowForm: () => void
  // The "2 Routes" tab.
  onShowResults: () => void
  onSelectRoute: (routeId: string) => void
  // Element that scrolls the form and the routes: a plain div in the side panel, Drawer.Content in the drawer,
  // so the drawer can tell scrolling from dragging.
  ScrollArea?: ElementType
}

// What the panel shows, in both layouts: the Trip / Routes tabs, the trip summary, then the form or the route list
// in a scrolling area.
export function PanelContent({
  panelView,
  backendStatus,
  tripPlan,
  tripSettings,
  selectedRouteId,
  formResetCount,
  onTripPlanned,
  onClearTrip,
  onShowForm,
  onShowResults,
  onSelectRoute,
  ScrollArea = 'div',
}: PanelContentProps) {
  return (
    <>
      {/* The tabs stay put while the content under them scrolls. */}
      <PanelTabs
        panelView={panelView}
        areRoutesAvailable={tripPlan !== null}
        onShowForm={onShowForm}
        onShowResults={onShowResults}
      />

      {/* The trip the user entered sits outside the scrolling area, under the tabs. */}
      {panelView === PanelView.RESULTS && tripPlan && tripSettings && (
        <TripSummary tripPlan={tripPlan} tripSettings={tripSettings} onClear={onClearTrip} />
      )}

      {/* overscroll-contain and touch-auto let the list scroll by touch inside the drawer; no effect on desktop. */}
      <ScrollArea className="flex min-h-0 flex-1 flex-col overflow-y-auto overscroll-contain touch-auto">
        {/* Silent while the backend is fine; only a problem is worth the user's attention. */}
        {backendStatus === BackendStatus.UNREACHABLE && (
          <div className="px-4 pt-4">
            <AlertMessage title="Server unreachable">Safe Road can't reach its server. Try again in a minute.</AlertMessage>
          </div>
        )}

        {/* The form stays in the page while hidden, so the Trip tab brings it back with every value still filled in. */}
        <div className={panelView === PanelView.FORM ? 'p-4' : 'hidden'}>
          <TripForm key={formResetCount} onTripPlanned={onTripPlanned} onClear={onClearTrip} />
        </div>

        {panelView === PanelView.RESULTS && tripPlan && selectedRouteId && (
          <RouteList tripPlan={tripPlan} selectedRouteId={selectedRouteId} onSelectRoute={onSelectRoute} />
        )}
      </ScrollArea>
    </>
  )
}

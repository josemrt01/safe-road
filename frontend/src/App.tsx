import { Drawer } from '@base-ui/react/drawer'
import { useEffect, useState, type ElementType } from 'react'
import { getBackendStatus } from './api/healthApi'
import { getHeatmap } from './api/heatmapApi'
import { DrawerSegmentDetails } from './components/DrawerSegmentDetails'
import { ForecastSlider } from './components/ForecastSlider'
import { InfoDialog } from './components/InfoDialog'
import { MapView } from './components/MapView'
import { PanelContent } from './components/PanelContent'
import { TopBar } from './components/TopBar'
import { TripDrawer } from './components/TripDrawer'
import { getRouteById } from './lib/tripPlanRoutes'
import { useIsWideScreen } from './lib/useIsWideScreen'
import { BackendStatus } from './types/backendStatus'
import { DrawerStop } from './types/drawerStop'
import { HeatmapStatus, type Heatmap } from './types/heatmap'
import type { InfoTopic } from './types/infoTopic'
import { PanelView } from './types/panelView'
import type { SegmentClick, SelectedSegment } from './types/selectedSegment'
import type { RoutePlan, TripPlan, TripSettings } from './types/tripPlan'

// The heatmap and the plan it belongs to; a heatmap for an older plan that answers late is ignored.
type HeatmapResult = {
  tripPlan: TripPlan
  status: HeatmapStatus
  heatmap: Heatmap | null
}

function App() {
  const [backendStatus, setBackendStatus] = useState<BackendStatus>(BackendStatus.CHECKING)
  const [tripPlan, setTripPlan] = useState<TripPlan | null>(null)
  // Truck settings the current plan was made with; set together with tripPlan.
  const [tripSettings, setTripSettings] = useState<TripSettings | null>(null)
  // The form until a plan arrives, then the results; the Trip and Routes tabs switch between them.
  const [panelView, setPanelView] = useState<PanelView>(PanelView.FORM)
  // Changing the form's key makes React build a new, empty form; Clear adds 1 to it.
  const [formResetCount, setFormResetCount] = useState(0)
  // The route drawn with risk colors; starts as the recommended one, the route cards change it.
  const [selectedRouteId, setSelectedRouteId] = useState<string | null>(null)
  const [heatmapResult, setHeatmapResult] = useState<HeatmapResult | null>(null)
  // Forecast hour the heatmap shows: 0 = now, up to 48; the forecast slider changes it.
  const [forecastHour, setForecastHour] = useState(0)
  // The truck shows only after the user plays or drags the forecast slider; each new plan hides it again.
  const [isTruckVisible, setIsTruckVisible] = useState(false)
  // Where the drawer rests on narrow screens; starts full, with the form.
  const [drawerStop, setDrawerStop] = useState<DrawerStop>(DrawerStop.FULL)
  // The clicked route segment; MapView highlights it, and its details show in the popup or the drawer.
  const [selectedSegment, setSelectedSegment] = useState<SelectedSegment | null>(null)
  // Side panel from 1024px up, drawer below.
  const isWideScreen = useIsWideScreen()
  // Wide screens: the side panel can be hidden to give the map the whole width.
  const [isPanelOpen, setIsPanelOpen] = useState(true)
  // The reference page open over the map ("How risk works" or "About"), or null.
  const [infoTopic, setInfoTopic] = useState<InfoTopic | null>(null)

  const selectedRoute = tripPlan && selectedRouteId ? getRouteById(tripPlan, selectedRouteId) : null

  // Only the heatmap of the current plan counts (same "hide instead of reset" idea as the map popup).
  const currentHeatmap = heatmapResult?.tripPlan === tripPlan ? heatmapResult : null

  // A segment from an older plan or another route is hidden instead of reset (same idea as the heatmap).
  const visibleSegment =
    selectedSegment?.tripPlan === tripPlan && selectedSegment.routeId === selectedRouteId ? selectedSegment : null
  // The checkpoints at both ends of the visible segment.
  const segmentStart = visibleSegment && selectedRoute ? selectedRoute.checkpoints[visibleSegment.index] : null
  const segmentEnd = visibleSegment && selectedRoute ? selectedRoute.checkpoints[visibleSegment.index + 1] : null
  // True only when both ends of the segment exist, so the drawer shows its details instead of the panel.
  const isSegmentShown = segmentStart != null && segmentEnd != null

  // Check the backend once, when the page first loads.
  useEffect(() => {
    getBackendStatus().then(setBackendStatus)
  }, [])

  function handleTripPlanned(newTripPlan: TripPlan, newTripSettings: TripSettings) {
    setTripPlan(newTripPlan)
    setTripSettings(newTripSettings)
    setPanelView(PanelView.RESULTS)
    // Narrow screens: half the screen, so the cards and the routes are both visible.
    setDrawerStop(DrawerStop.MIDDLE)
    setSelectedRouteId(newTripPlan.recommended_route_id)
    setHeatmapResult({ tripPlan: newTripPlan, status: HeatmapStatus.LOADING, heatmap: null })
    // Each new plan starts at "now", without the truck.
    setForecastHour(0)
    setIsTruckVisible(false)

    // The routes are already on screen; the heatmap arrives after, so routes never wait for it.
    getHeatmap(newTripPlan.corridor_points, newTripSettings.weightLb)
      .then((heatmap) => setHeatmapResult({ tripPlan: newTripPlan, status: HeatmapStatus.READY, heatmap }))
      .catch(() => setHeatmapResult({ tripPlan: newTripPlan, status: HeatmapStatus.FAILED, heatmap: null }))
  }

  // Clear (form) and X (summary): back to an empty form and an empty map.
  function handleClearTrip() {
    setTripPlan(null)
    setTripSettings(null)
    setSelectedRouteId(null)
    setHeatmapResult(null)
    setForecastHour(0)
    setIsTruckVisible(false)
    setPanelView(PanelView.FORM)
    setDrawerStop(DrawerStop.FULL)
    setFormResetCount((previousCount) => previousCount + 1)
  }

  // The Trip tab: back to the form, with the drawer full on narrow screens.
  function handleShowForm() {
    setPanelView(PanelView.FORM)
    setDrawerStop(DrawerStop.FULL)
  }

  // The Routes tab: back to the route list, with the drawer in the middle so the list and the map show together.
  function handleShowResults() {
    setPanelView(PanelView.RESULTS)
    setDrawerStop(DrawerStop.MIDDLE)
  }

  function handleSelectSegment(segmentClick: SegmentClick | null) {
    if (segmentClick === null || tripPlan === null || selectedRouteId === null) {
      setSelectedSegment(null)
      return
    }

    setSelectedSegment({
      tripPlan,
      routeId: selectedRouteId,
      index: segmentClick.index,
      lon: segmentClick.lon,
      lat: segmentClick.lat,
    })

    // Narrow screens: the details open in the drawer at half height.
    if (!isWideScreen) {
      setDrawerStop(DrawerStop.MIDDLE)
    }
  }

  // The same panel content in both layouts; only its scrolling container changes.
  function renderPanelContent(scrollArea: ElementType) {
    return (
      <PanelContent
        panelView={panelView}
        backendStatus={backendStatus}
        tripPlan={tripPlan}
        tripSettings={tripSettings}
        selectedRouteId={selectedRouteId}
        formResetCount={formResetCount}
        onTripPlanned={handleTripPlanned}
        onClearTrip={handleClearTrip}
        onShowForm={handleShowForm}
        onShowResults={handleShowResults}
        onSelectRoute={setSelectedRouteId}
        ScrollArea={scrollArea}
      />
    )
  }

  // The forecast band for the selected route; compact on the drawer, full under the map.
  function renderForecastSlider(isCompact: boolean, plan: TripPlan, route: RoutePlan) {
    return (
      <ForecastSlider
        isCompact={isCompact}
        hour={forecastHour}
        onHourChange={setForecastHour}
        onUse={() => setIsTruckVisible(true)}
        heatmap={currentHeatmap?.heatmap ?? null}
        heatmapStatus={currentHeatmap?.status ?? null}
        route={route}
        departureUtc={plan.departure_utc}
      />
    )
  }

  return (
    // The top bar, then the map area. Wide screens: the side panel, then the map with the forecast band under it.
    // Narrow screens: the map alone, with the panel as a bottom drawer over it.
    // isolate keeps the app's own layers (top bar, panel, forecast band) inside the app, so the dialog and the
    // drawer, drawn after it at the end of the page, always cover all of it.
    <div className="isolate flex h-dvh flex-col">
      <TopBar onOpenInfo={setInfoTopic} />

      <main className="flex min-h-0 flex-1">
        {isWideScreen && (
          // Hidden, not removed, while closed, so the form keeps its values. Above the map, so its shadow falls on it.
          <aside
            className={`relative z-10 w-95 shrink-0 flex-col border-r border-border bg-panel text-sm shadow-side-panel ${isPanelOpen ? 'flex' : 'hidden'}`}
          >
            {renderPanelContent('div')}
          </aside>
        )}

        <div className="flex min-w-0 flex-1 flex-col">
          <div className="relative min-h-0 flex-1">
            {/* Pinned to the box's edges, so MapLibre gets an exact size that follows the window and the panel. */}
            <div className="absolute inset-0">
              <MapView
                tripPlan={tripPlan}
                selectedRouteId={selectedRouteId}
                heatmap={currentHeatmap?.heatmap ?? null}
                forecastHour={forecastHour}
                isTruckVisible={isTruckVisible}
                selectedSegment={visibleSegment}
                onSelectSegment={handleSelectSegment}
                isPopupEnabled={isWideScreen}
              />
            </div>

            {isWideScreen && (
              // A tab on the map's left edge; written top to bottom so it stays narrow.
              <button
                type="button"
                onClick={() => setIsPanelOpen(!isPanelOpen)}
                aria-expanded={isPanelOpen}
                className="absolute top-3 left-0 cursor-pointer border border-l-0 border-border bg-asphalt px-2 py-3 shadow-floating-panel font-display text-[11px] font-bold tracking-[0.14em] text-muted-foreground uppercase [writing-mode:vertical-rl] hover:text-primary"
              >
                {isPanelOpen ? 'Hide panel' : 'Show panel'}
              </button>
            )}
          </div>

          {isWideScreen && tripPlan && selectedRoute && renderForecastSlider(false, tripPlan, selectedRoute)}
        </div>

        {!isWideScreen && (
          <TripDrawer
            stop={drawerStop}
            onStopChange={setDrawerStop}
            aboveContent={tripPlan && selectedRoute ? renderForecastSlider(true, tripPlan, selectedRoute) : null}
          >
            {isSegmentShown && (
              <DrawerSegmentDetails start={segmentStart} end={segmentEnd} onBack={() => setSelectedSegment(null)} />
            )}
            {/* Hidden, not removed, while a segment shows, so the form keeps its values for the Trip tab. */}
            <div className={isSegmentShown ? 'hidden' : 'flex min-h-0 flex-1 flex-col'}>
              {renderPanelContent(Drawer.Content)}
            </div>
          </TripDrawer>
        )}
      </main>

      <InfoDialog topic={infoTopic} onClose={() => setInfoTopic(null)} />
    </div>
  )
}

export default App

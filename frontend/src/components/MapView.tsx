import { useEffect, useMemo, useRef, useState } from 'react'
import Map, { AttributionControl, Layer, Popup, Source, type MapLayerMouseEvent, type MapRef } from 'react-map-gl/maplibre'
import { LngLatBounds } from 'maplibre-gl'
import 'maplibre-gl/dist/maplibre-gl.css'
import {
  CHECKPOINT_DOT_COLOR,
  CHECKPOINT_DOT_RADIUS,
  CHECKPOINT_LAYER_ID,
  CHECKPOINT_SOURCE_ID,
  FIT_ANIMATION_MS,
  HEATMAP_LAYER_ID,
  HEATMAP_SOURCE_ID,
  HEATMAP_SOURCE_MAX_ZOOM,
  CONTIGUOUS_US_BOUNDS,
  INITIAL_FIT_PADDING,
  MAP_LABEL_HALO_COLOR,
  MAP_LABEL_LAYER_ID,
  MAP_PLACE_LABEL_LAYER_IDS,
  MAP_STYLE_COLOR_OVERRIDES,
  MAP_STYLE_URL,
  MAX_ROUTE_FIT_ZOOM,
  OTHER_ROUTE_COLOR,
  OTHER_ROUTE_WIDTH,
  OTHER_ROUTES_LAYER_ID,
  OTHER_ROUTES_SOURCE_ID,
  ROUTE_CASING_COLOR,
  ROUTE_CASING_LAYER_ID,
  ROUTE_CASING_WIDTH,
  ROUTE_LINE_WIDTH,
  ROUTE_SEGMENT_COLOR_EXPRESSION,
  ROUTE_SEGMENT_HIGHLIGHT_LAYER_ID,
  ROUTE_SEGMENT_HIGHLIGHT_WIDTH,
  ROUTE_SEGMENT_LAYER_ID,
  ROUTE_SEGMENT_SOURCE_ID,
  SEGMENT_POPUP_OFFSET,
} from '../config/mapConfig'
import { NARROW_SCREEN_QUERY } from '../config/layoutConfig'
import {
  buildHeatmapPoints,
  getHeatmapColorExpression,
  getHeatmapOpacityExpression,
  getHeatmapRadiusExpression,
} from '../lib/heatmapGeometry'
import { getForecastHourTime } from '../lib/dateTime'
import { getRouteFitPadding } from '../lib/routeFitPadding'
import { useIsWideScreen } from '../lib/useIsWideScreen'
import { buildCheckpointPoints, buildOtherRouteLines, buildRouteSegments, getTruckPosition } from '../lib/routeGeometry'
import { getRouteById } from '../lib/tripPlanRoutes'
import { RouteEndpoint } from '../types/routeEndpoint'
import type { Heatmap } from '../types/heatmap'
import type { MapLayerVisibility } from '../types/mapLayers'
import type { SegmentClick, SelectedSegment } from '../types/selectedSegment'
import type { TripPlan } from '../types/tripPlan'
import { MapControls } from './MapControls'
import { RouteEndpointMarker } from './RouteEndpointMarker'
import { SegmentDetails } from './SegmentDetails'
import { TruckMarker } from './TruckMarker'
// Runs once to tell MapLibre where its worker file is; must load before any map is created.
import '../lib/maplibreWorker'

// Highlight filter value that matches no segment; segment indexes start at 0.
const NO_SEGMENT_INDEX = -1

// The first camera fits the US; the map reads this only once, when it loads.
const INITIAL_VIEW_STATE = { bounds: CONTIGUOUS_US_BOUNDS, fitBoundsOptions: { padding: INITIAL_FIT_PADDING } }

// Every optional layer starts visible; the layer checkboxes change it.
const ALL_LAYERS_VISIBLE: MapLayerVisibility = {
  isWeatherVisible: true,
  areOtherRoutesVisible: true,
  areCheckpointsVisible: true,
}

// Only the route segments react to the mouse; MapLibre reports which one was hit.
const INTERACTIVE_LAYER_IDS = [ROUTE_SEGMENT_LAYER_ID]

type MapViewProps = {
  // The planned trip to draw; null before the first plan.
  tripPlan: TripPlan | null
  // The route drawn with risk colors ("A", "B" or "C"); the others are drawn gray.
  selectedRouteId: string | null
  // Weather risk around the routes; null while loading, on failure, or before the first plan.
  heatmap: Heatmap | null
  // Forecast hour the heatmap shows: 0 = now, up to 48; set by the forecast slider.
  forecastHour: number
  // False until the user plays or drags the forecast slider, so the truck doesn't clutter the map before then.
  isTruckVisible: boolean
  // The clicked segment of the current plan and route, or null; App keeps it so the drawer can show it too.
  selectedSegment: SelectedSegment | null
  // Called with the clicked segment, or null on a click on empty map or the popup's close button.
  onSelectSegment: (segmentClick: SegmentClick | null) => void
  // True on wide screens, where the details open in a popup; narrow screens show them in the drawer.
  isPopupEnabled: boolean
}

export function MapView({
  tripPlan,
  selectedRouteId,
  heatmap,
  forecastHour,
  isTruckVisible,
  selectedSegment,
  onSelectSegment,
  isPopupEnabled,
}: MapViewProps) {
  // The map credits sit top-left on narrow screens, where the drawer covers the bottom of the map.
  const isWideScreen = useIsWideScreen()
  // Handle to the MapLibre map, so we can move its camera.
  const mapRef = useRef<MapRef>(null)
  // True once the teal colors are on the map style; the style loads once, so they are applied once.
  const areStyleColorsAppliedRef = useRef(false)
  const [hoveredSegmentIndex, setHoveredSegmentIndex] = useState<number | null>(null)
  // The map style's first label layer once the map has loaded; every layer of ours is drawn under it.
  // Until then (or if the style has no such layer) our layers go on top.
  const [labelLayerId, setLabelLayerId] = useState<string | undefined>(undefined)
  const [layerVisibility, setLayerVisibility] = useState<MapLayerVisibility>(ALL_LAYERS_VISIBLE)

  const selectedRoute = tripPlan && selectedRouteId ? getRouteById(tripPlan, selectedRouteId) : null

  // Rebuild the map data only when the route changes, not on every render.
  const routeSegments = useMemo(
    () => (selectedRoute ? buildRouteSegments(selectedRoute.geometry, selectedRoute.checkpoints) : null),
    [selectedRoute],
  )
  const checkpointPoints = useMemo(
    () => (selectedRoute ? buildCheckpointPoints(selectedRoute.checkpoints) : null),
    [selectedRoute],
  )
  // The truck at the slider's time; it needs the heatmap's hour 0, so it appears once the heatmap is loaded.
  const sliderTime = heatmap ? getForecastHourTime(heatmap.start_hour_utc, forecastHour) : null
  const truckPosition = selectedRoute && sliderTime ? getTruckPosition(selectedRoute, sliderTime) : null

  const heatmapPoints = useMemo(() => (heatmap ? buildHeatmapPoints(heatmap) : null), [heatmap])
  const otherRouteLines = useMemo(
    () => (tripPlan && selectedRouteId ? buildOtherRouteLines(tripPlan.routes, selectedRouteId) : null),
    [tripPlan, selectedRouteId],
  )

  // Fly the camera so every route of a new plan is visible; selecting another route doesn't move it.
  useEffect(() => {
    if (!tripPlan || !mapRef.current) return

    // Checked here instead of using the hook's value, so the camera moves only when the plan changes.
    const isWideScreenNow = !window.matchMedia(NARROW_SCREEN_QUERY).matches
    const padding = getRouteFitPadding(isWideScreenNow, window.innerHeight)

    // Start a box at the first point, then grow it until it contains every point of every route.
    const firstPoint = tripPlan.routes[0].geometry[0]
    const allRoutesBounds = new LngLatBounds(firstPoint, firstPoint)
    for (const route of tripPlan.routes) {
      for (const point of route.geometry) {
        allRoutesBounds.extend(point)
      }
    }

    mapRef.current.fitBounds(allRoutesBounds, {
      padding,
      maxZoom: MAX_ROUTE_FIT_ZOOM,
      duration: FIT_ANIMATION_MS,
    })
  }, [tripPlan])

  const highlightedSegmentIndex = hoveredSegmentIndex ?? selectedSegment?.index ?? NO_SEGMENT_INDEX

  // Runs as soon as the style is read, before the tiles draw, so the map never shows its original blue first.
  function handleStyleData() {
    const map = mapRef.current
    if (!map || areStyleColorsAppliedRef.current) return
    areStyleColorsAppliedRef.current = true

    // A style without one of these layers keeps its own color there instead of failing.
    for (const override of MAP_STYLE_COLOR_OVERRIDES) {
      if (map.getLayer(override.layerId)) {
        map.getMap().setPaintProperty(override.layerId, override.property, override.color)
      }
    }
    for (const layerId of MAP_PLACE_LABEL_LAYER_IDS) {
      if (map.getLayer(layerId)) {
        map.getMap().setPaintProperty(layerId, 'text-halo-color', MAP_LABEL_HALO_COLOR)
      }
    }
  }

  function handleLoad() {
    // Placing a layer under one the style doesn't have would fail, so check it exists first.
    if (mapRef.current?.getLayer(MAP_LABEL_LAYER_ID)) {
      setLabelLayerId(MAP_LABEL_LAYER_ID)
    }

    // North stays up: there is no compass to turn the map back, so two-finger turning is off too.
    mapRef.current?.getMap().touchZoomRotate.disableRotation()
  }

  function handleMouseMove(event: MapLayerMouseEvent) {
    // features holds the segment under the mouse (only INTERACTIVE_LAYER_IDS are checked), or nothing.
    const segmentIndex = event.features?.[0]?.properties?.index
    setHoveredSegmentIndex(typeof segmentIndex === 'number' ? segmentIndex : null)
  }

  function handleClick(event: MapLayerMouseEvent) {
    const segmentIndex = event.features?.[0]?.properties?.index

    // A click on empty map closes the details.
    if (typeof segmentIndex !== 'number') {
      onSelectSegment(null)
      return
    }

    onSelectSegment({ index: segmentIndex, lon: event.lngLat.lng, lat: event.lngLat.lat })
  }

  // The two checkpoints at the ends of the clicked segment.
  const segmentStart = selectedSegment && selectedRoute ? selectedRoute.checkpoints[selectedSegment.index] : null
  const segmentEnd = selectedSegment && selectedRoute ? selectedRoute.checkpoints[selectedSegment.index + 1] : null

  return (
    <Map
      ref={mapRef}
      initialViewState={INITIAL_VIEW_STATE}
      mapStyle={MAP_STYLE_URL}
      style={{ width: '100%', height: '100%' }}
      interactiveLayerIds={INTERACTIVE_LAYER_IDS}
      // Our own AttributionControl below, so its corner can change with the layout.
      attributionControl={false}
      // North stays up (see handleLoad).
      dragRotate={false}
      pitchWithRotate={false}
      onStyleData={handleStyleData}
      onLoad={handleLoad}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => setHoveredSegmentIndex(null)}
      onClick={handleClick}
      // Pointer over a segment tells the user it can be clicked.
      cursor={hoveredSegmentIndex !== null ? 'pointer' : 'grab'}
    >
      {/* Darkened edges over the map; before the controls, so they stay bright on top of it. */}
      <div className="pointer-events-none absolute inset-0 shadow-map-recess" aria-hidden="true" />
      <MapControls layerVisibility={layerVisibility} onLayerVisibilityChange={setLayerVisibility} />

      {/* The key makes React add a new control when the corner changes; MapLibre can't move an existing one. */}
      <AttributionControl
        key={isWideScreen ? 'wide' : 'narrow'}
        position={isWideScreen ? 'bottom-right' : 'top-left'}
        compact={!isWideScreen}
      />

      {/* Layers draw in the order listed: gray other routes, then the selected route's dark outline,
          risk-colored segments and highlight, then the dots on top; all under the map's place and road names. */}
      {/* The layer checkboxes hide layers instead of removing them: a layer added again would land on top of the
          routes. */}
      {/* Weather heatmap at the bottom: each grid point a soft circle in its risk color (Low is fainter). It arrives
          after the routes, so it goes under the other routes' layer instead of under the labels (above the routes). */}
      {heatmapPoints && tripPlan && (
        <Source id={HEATMAP_SOURCE_ID} type="geojson" data={heatmapPoints} maxzoom={HEATMAP_SOURCE_MAX_ZOOM}>
          <Layer
            id={HEATMAP_LAYER_ID}
            beforeId={OTHER_ROUTES_LAYER_ID}
            type="circle"
            layout={{ visibility: getLayerVisibility(layerVisibility.isWeatherVisible) }}
            paint={{
              // Only this rule changes when the slider moves; the points themselves stay loaded.
              'circle-color': getHeatmapColorExpression(forecastHour),
              'circle-radius': getHeatmapRadiusExpression(tripPlan.corridor_cell_size_deg),
              // Soft edges, so neighboring circles blend into one colored area.
              'circle-blur': 1,
              'circle-opacity': getHeatmapOpacityExpression(forecastHour),
            }}
          />
        </Source>
      )}

      {otherRouteLines && (
        <Source id={OTHER_ROUTES_SOURCE_ID} type="geojson" data={otherRouteLines}>
          <Layer
            id={OTHER_ROUTES_LAYER_ID}
            beforeId={labelLayerId}
            type="line"
            layout={{
              'line-join': 'round',
              'line-cap': 'round',
              visibility: getLayerVisibility(layerVisibility.areOtherRoutesVisible),
            }}
            paint={{ 'line-color': OTHER_ROUTE_COLOR, 'line-width': OTHER_ROUTE_WIDTH }}
          />
        </Source>
      )}

      {routeSegments && (
        <Source id={ROUTE_SEGMENT_SOURCE_ID} type="geojson" data={routeSegments}>
          <Layer
            id={ROUTE_CASING_LAYER_ID}
            beforeId={labelLayerId}
            type="line"
            // Round joins and caps keep corners and segment ends smooth.
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': ROUTE_CASING_COLOR, 'line-width': ROUTE_CASING_WIDTH }}
          />
          <Layer
            id={ROUTE_SEGMENT_LAYER_ID}
            beforeId={labelLayerId}
            type="line"
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            // Each segment takes the color of its risk level.
            paint={{ 'line-color': ROUTE_SEGMENT_COLOR_EXPRESSION, 'line-width': ROUTE_LINE_WIDTH }}
          />
          <Layer
            id={ROUTE_SEGMENT_HIGHLIGHT_LAYER_ID}
            beforeId={labelLayerId}
            type="line"
            // Draw only the segment whose index matches the hovered or selected one, thicker in its own color.
            filter={['==', ['get', 'index'], highlightedSegmentIndex]}
            layout={{ 'line-join': 'round', 'line-cap': 'round' }}
            paint={{ 'line-color': ROUTE_SEGMENT_COLOR_EXPRESSION, 'line-width': ROUTE_SEGMENT_HIGHLIGHT_WIDTH }}
          />
        </Source>
      )}

      {checkpointPoints && (
        <Source id={CHECKPOINT_SOURCE_ID} type="geojson" data={checkpointPoints}>
          <Layer
            id={CHECKPOINT_LAYER_ID}
            beforeId={labelLayerId}
            type="circle"
            layout={{ visibility: getLayerVisibility(layerVisibility.areCheckpointsVisible) }}
            paint={{ 'circle-color': CHECKPOINT_DOT_COLOR, 'circle-radius': CHECKPOINT_DOT_RADIUS }}
          />
        </Source>
      )}

      {/* Start and end markers, drawn above the route. */}
      {tripPlan && (
        <>
          <RouteEndpointMarker place={tripPlan.origin} endpoint={RouteEndpoint.START} />
          <RouteEndpointMarker place={tripPlan.destination} endpoint={RouteEndpoint.END} />
        </>
      )}

      {/* After the start and end markers, so the truck is drawn on top of them. */}
      {isTruckVisible && truckPosition && <TruckMarker position={truckPosition} />}

      {/* Miles, times, risk and weather for the clicked segment. */}
      {isPopupEnabled && selectedSegment && segmentStart && segmentEnd && (
        <Popup
          longitude={selectedSegment.lon}
          latitude={selectedSegment.lat}
          // No anchor given, so MapLibre opens it on whichever side of the click fits inside the map
          // (below a segment near the top edge, instead of cut off).
          offset={SEGMENT_POPUP_OFFSET}
          // Room for the 256px content and its border; MapLibre's default (240px) would squeeze it.
          maxWidth="320px"
          // Our own onClick already closes it on empty-map clicks, and SegmentDetails has its own close button.
          closeOnClick={false}
          closeButton={false}
        >
          <div className="w-64">
            <SegmentDetails start={segmentStart} end={segmentEnd} onClose={() => onSelectSegment(null)} />
          </div>
        </Popup>
      )}

    </Map>
  )
}

// MapLibre's layout value that shows or hides a layer without removing it, so the layer keeps its place in the
// drawing order.
function getLayerVisibility(isVisible: boolean): 'visible' | 'none' {
  return isVisible ? 'visible' : 'none'
}

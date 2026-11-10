import type { ExpressionSpecification } from 'maplibre-gl'
import { RiskLevel } from '../types/risk'
import { RISK_LEVEL_COLORS } from './riskConfig'

// Map look (OpenFreeMap "fiord" vector style: dark slate blue, no API key); used by MapView.
export const MAP_STYLE_URL = 'https://tiles.openfreemap.org/styles/fiord'

// One paint color of the map style to replace; used by MAP_STYLE_COLOR_OVERRIDES.
export type MapStyleColorOverride = {
  layerId: string
  // The paint property that holds the layer's color, by layer type (background, area, line).
  property: 'background-color' | 'fill-color' | 'line-color'
  color: string
}

// Land, water, parks, buildings, roads and state lines of the "fiord" style, moved from its slate blue to the app's
// dark teal so the map and the panels look like one piece. Darker than the panels, so the map reads as the back
// layer; applied when the style loads; used by MapView.
// Plain values, since MapLibre paints on a canvas and can't read CSS variables.
export const MAP_STYLE_COLOR_OVERRIDES: MapStyleColorOverride[] = [
  { layerId: 'background', property: 'background-color', color: '#132e34' },
  { layerId: 'water', property: 'fill-color', color: '#0a1f23' },
  { layerId: 'waterway', property: 'line-color', color: '#0a1f23' },
  { layerId: 'landcover_wood', property: 'fill-color', color: 'rgba(8, 22, 26, 0.4)' },
  { layerId: 'park', property: 'fill-color', color: '#173a3d' },
  { layerId: 'building', property: 'fill-color', color: 'rgba(10, 26, 30, 0.6)' },
  { layerId: 'highway_minor', property: 'line-color', color: '#28494f' },
  { layerId: 'highway_major_casing', property: 'line-color', color: '#335a60' },
  { layerId: 'highway_major_inner', property: 'line-color', color: '#1e3e44' },
  { layerId: 'highway_motorway_casing', property: 'line-color', color: '#3a6369' },
  { layerId: 'highway_motorway_inner', property: 'line-color', color: '#1e3e44' },
  { layerId: 'boundary_state', property: 'line-color', color: 'rgba(143, 224, 230, 0.2)' },
]

// Place-name layers of the "fiord" style, whose blue glow around the letters clashes with the teal; used by MapView
// with MAP_LABEL_HALO_COLOR.
export const MAP_PLACE_LABEL_LAYER_IDS = ['place_village', 'place_town', 'place_city', 'place_city_large', 'place_state']

// Near-black glow around the place names instead (--color-asphalt at 70%); used by MapView.
export const MAP_LABEL_HALO_COLOR = 'rgba(10, 26, 30, 0.7)'

// First label layer (water names) of the map style, above its roads and buildings; our layers go under it,
// so place and road names stay readable on top of the route; used by MapView.
export const MAP_LABEL_LAYER_ID = 'water_name'

// Zoom levels and width multipliers for lines and dots that grow as the map zooms in: thinner zoomed out,
// the base width at a whole-route view, and much wider at street level; used by getZoomScaledWidth.
const ZOOMED_OUT_ZOOM = 5
const ZOOMED_OUT_WIDTH_FACTOR = 0.6
const BASE_WIDTH_ZOOM = 9
const STREET_ZOOM = 15
const STREET_WIDTH_FACTOR = 2.4

// Width rule that grows a pixel width with the zoom (base width at zoom 9), so the route reads like a road
// at every zoom; used for the route, outline, highlight, other routes and checkpoint dots.
function getZoomScaledWidth(baseWidthPx: number): ExpressionSpecification {
  return [
    'interpolate',
    ['linear'],
    ['zoom'],
    ZOOMED_OUT_ZOOM,
    baseWidthPx * ZOOMED_OUT_WIDTH_FACTOR,
    BASE_WIDTH_ZOOM,
    baseWidthPx,
    STREET_ZOOM,
    baseWidthPx * STREET_WIDTH_FACTOR,
  ]
}

// The lower 48 states as [[west, south], [east, north]]; the starting camera fits them; used by MapView.
export const CONTIGUOUS_US_BOUNDS: [[number, number], [number, number]] = [
  [-124.8, 24.4],
  [-66.9, 49.4],
]

// Pixels kept around the US on the first view; the side panel sits beside the map, not over it, so the same on
// every side; used by MapView.
export const INITIAL_FIT_PADDING = 30

// Name of the route data (one line per segment between checkpoints) inside MapLibre; used by MapView.
export const ROUTE_SEGMENT_SOURCE_ID = 'route-segments'

// Layer that draws every route segment; clickable; used by MapView.
export const ROUTE_SEGMENT_LAYER_ID = 'route-segments-line'

// Layer that draws the hovered or selected segment on top, thicker; used by MapView.
export const ROUTE_SEGMENT_HIGHLIGHT_LAYER_ID = 'route-segment-highlight'

// Name of the heatmap grid points inside MapLibre; used by MapView.
export const HEATMAP_SOURCE_ID = 'heatmap-points'

// Layer that draws each heatmap point as a soft circle in its risk color, under the routes; used by MapView.
export const HEATMAP_LAYER_ID = 'heatmap-circles'

// Highest zoom the heatmap points are cut into map tiles for; beyond it MapLibre stretches these tiles instead.
// MapLibre draws a circle only while the tile holding its center is on screen, and zoomed in that tile can be
// off screen while the circle still reaches in (the heatmap vanished). Tiles this big (about 22 degrees wide)
// almost always include the centers of the circles on screen; used by MapView.
export const HEATMAP_SOURCE_MAX_ZOOM = 4

// Heatmap circle radius as a share of a grid cell's width; above 1 so the blurred edges of neighbors overlap
// and blend into one area instead of separate dots; used by getHeatmapRadiusAtZoom0.
export const HEATMAP_CELL_COVERAGE = 1.25

// Heatmap circle opacity for Moderate and worse; low enough that the map and routes stay readable underneath and the
// warm colors tint the area instead of pulling the eye away from the routes;
// used by getHeatmapOpacityExpression.
export const HEATMAP_RISK_OPACITY = 0.28

// Fainter opacity for Low cells: the corridor stays visible as "checked, calm" without covering the map;
// used by getHeatmapOpacityExpression.
export const HEATMAP_LOW_OPACITY = 0.1

// Name of the unselected route lines inside MapLibre; used by MapView.
export const OTHER_ROUTES_SOURCE_ID = 'other-routes'

// Layer that draws the unselected routes as thin gray lines under the selected route; used by MapView.
export const OTHER_ROUTES_LAYER_ID = 'other-routes-line'

// Color of the unselected routes, a pale gray-teal apart from the risk colors that shows on the dark map;
// used by MapView.
export const OTHER_ROUTE_COLOR = '#a9c3c6'

// Thickness of the unselected routes (4px at zoom 9, growing with zoom), thinner than the selected one; used by MapView.
export const OTHER_ROUTE_WIDTH = getZoomScaledWidth(4)

// Name of the checkpoint points inside MapLibre; used by MapView.
export const CHECKPOINT_SOURCE_ID = 'checkpoints'

// Layer that draws a small dot at each checkpoint; used by MapView.
export const CHECKPOINT_LAYER_ID = 'checkpoint-dots'

// Layer that draws a dark outline under the route; used by MapView.
export const ROUTE_CASING_LAYER_ID = 'route-casing'

// Color of the line for a level the frontend doesn't know (shouldn't happen); used by ROUTE_SEGMENT_COLOR_EXPRESSION.
const UNKNOWN_LEVEL_COLOR = '#8c959f'

// MapLibre picks each segment's color from its "level" property, like a switch statement with a default;
// used by MapView for the route and the highlight.
export const ROUTE_SEGMENT_COLOR_EXPRESSION: ExpressionSpecification = [
  'match',
  ['get', 'level'],
  RiskLevel.LOW,
  RISK_LEVEL_COLORS[RiskLevel.LOW],
  RiskLevel.MODERATE,
  RISK_LEVEL_COLORS[RiskLevel.MODERATE],
  RiskLevel.HIGH,
  RISK_LEVEL_COLORS[RiskLevel.HIGH],
  RiskLevel.SEVERE,
  RISK_LEVEL_COLORS[RiskLevel.SEVERE],
  RiskLevel.NO_TRAVEL,
  RISK_LEVEL_COLORS[RiskLevel.NO_TRAVEL],
  UNKNOWN_LEVEL_COLOR,
]

// Near-black outline under the route, so every risk color stands out from the dark map; the same value as
// --color-asphalt in index.css (MapLibre paints on a canvas and can't read CSS variables); used by MapView.
export const ROUTE_CASING_COLOR = '#0a1a1e'

// Outline thickness (7px at zoom 9, growing with zoom); wider than ROUTE_LINE_WIDTH so a thin border shows on each
// side; used by MapView.
export const ROUTE_CASING_WIDTH = getZoomScaledWidth(7)

// Route line thickness (5px at zoom 9, growing with zoom); used by MapView.
export const ROUTE_LINE_WIDTH = getZoomScaledWidth(5)

// Thickness of the hovered or selected route segment (9px at zoom 9, growing with zoom), drawn in its own risk color;
// used by MapView.
export const ROUTE_SEGMENT_HIGHLIGHT_WIDTH = getZoomScaledWidth(9)

// Checkpoint dot color, white so it shows on any route color; used by MapView.
export const CHECKPOINT_DOT_COLOR = '#ffffff'

// Checkpoint dot radius (3px at zoom 9, growing with zoom like the line), small enough to sit inside it;
// used by MapView.
export const CHECKPOINT_DOT_RADIUS = getZoomScaledWidth(3)

// Pixels between a clicked point and the segment popup next to it; used by MapView.
export const SEGMENT_POPUP_OFFSET = 10

// Milliseconds the camera takes to fly to a new route; used by MapView.
export const FIT_ANIMATION_MS = 1000

// Pixels kept around the route when zooming to it, so the start and end markers aren't at the edge; the panel and
// the forecast band sit beside the map, so only the map controls (top right) need extra room; used by MapView.
export const ROUTE_FIT_PADDING = { top: 60, right: 140, bottom: 60, left: 60 }

// Top and side padding when zooming to a route on narrow screens; the bottom comes from the drawer's height
// (getRouteFitPadding).
export const ROUTE_FIT_PADDING_NARROW_SIDES = { top: 60, right: 40, left: 40 }

// Smallest map height in pixels left for the route when the drawer and forecast band cover the rest (short landscape
// phones); used by getRouteFitPadding.
export const MIN_ROUTE_FIT_HEIGHT = 120

// Closest zoom when fitting a route, so short trips keep their surroundings in view; used by MapView.
export const MAX_ROUTE_FIT_ZOOM = 9

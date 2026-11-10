// Which optional layers the map draws; the layer checkboxes over the map change them; used by MapView and
// MapControls.
export type MapLayerVisibility = {
  // The weather heatmap around the routes.
  isWeatherVisible: boolean
  // The unselected routes, in gray.
  areOtherRoutesVisible: boolean
  // The dots where the weather is checked on the selected route.
  areCheckpointsVisible: boolean
}

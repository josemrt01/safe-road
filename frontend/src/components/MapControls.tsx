import { MinusIcon, PlusIcon } from 'lucide-react'
import { useMap } from 'react-map-gl/maplibre'
import type { MapLayerVisibility } from '../types/mapLayers'

// Tailwind classes for the square zoom buttons.
const ZOOM_BUTTON_CLASS_NAME = 'flex size-9 cursor-pointer items-center justify-center hover:text-primary'

type MapControlsProps = {
  layerVisibility: MapLayerVisibility
  onLayerVisibilityChange: (layerVisibility: MapLayerVisibility) => void
}

// The map's top-right corner: zoom buttons, then a box of checkboxes to hide or show the optional layers
// (wide screens only; on narrow ones the map is too small to give it the room). Rendered inside the map, so useMap()
// reaches it.
export function MapControls({ layerVisibility, onLayerVisibilityChange }: MapControlsProps) {
  const { current: map } = useMap()

  return (
    <div className="absolute top-3 right-3 flex flex-col items-end gap-2">
      <div className="flex flex-col border border-border bg-asphalt shadow-floating-panel">
        <button type="button" aria-label="Zoom in" onClick={() => map?.zoomIn()} className={ZOOM_BUTTON_CLASS_NAME}>
          <PlusIcon className="size-4" />
        </button>
        <button
          type="button"
          aria-label="Zoom out"
          onClick={() => map?.zoomOut()}
          className={`border-t border-border ${ZOOM_BUTTON_CLASS_NAME}`}
        >
          <MinusIcon className="size-4" />
        </button>
      </div>

      <fieldset className="hidden flex-col gap-1.5 border border-border bg-asphalt px-2.5 py-2 shadow-floating-panel lg:flex">
        <legend className="sr-only">Map layers</legend>
        <LayerCheckbox
          label="Weather"
          isChecked={layerVisibility.isWeatherVisible}
          onChange={(isChecked) => onLayerVisibilityChange({ ...layerVisibility, isWeatherVisible: isChecked })}
        />
        <LayerCheckbox
          label="All routes"
          isChecked={layerVisibility.areOtherRoutesVisible}
          onChange={(isChecked) => onLayerVisibilityChange({ ...layerVisibility, areOtherRoutesVisible: isChecked })}
        />
        <LayerCheckbox
          label="Checkpoints"
          isChecked={layerVisibility.areCheckpointsVisible}
          onChange={(isChecked) => onLayerVisibilityChange({ ...layerVisibility, areCheckpointsVisible: isChecked })}
        />
      </fieldset>
    </div>
  )
}

type LayerCheckboxProps = {
  label: string
  isChecked: boolean
  onChange: (isChecked: boolean) => void
}

// One layer's checkbox with its name; clicking the name toggles it too.
function LayerCheckbox({ label, isChecked, onChange }: LayerCheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 font-display text-[11px] font-bold tracking-[0.14em] uppercase">
      <input
        type="checkbox"
        checked={isChecked}
        onChange={(event) => onChange(event.target.checked)}
        className="cursor-pointer accent-primary"
      />
      <span className="pt-0.5">{label}</span>
    </label>
  )
}

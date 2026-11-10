import { PanelView } from '../types/panelView'

// Tailwind classes for one tab: muted when off; panel color with an ice-blue line on top when on.
const TAB_CLASS_NAME =
  'flex-1 cursor-pointer border-r border-border px-3 pt-3 pb-2.5 font-display text-xs font-bold tracking-[0.14em] text-muted-foreground uppercase last:border-r-0 hover:text-foreground disabled:cursor-default disabled:opacity-50 disabled:hover:text-muted-foreground aria-pressed:bg-panel aria-pressed:text-foreground aria-pressed:shadow-[inset_0_3px_0_var(--color-primary)]'

type PanelTabsProps = {
  panelView: PanelView
  // False until a plan exists; the Routes tab is disabled before that.
  areRoutesAvailable: boolean
  onShowForm: () => void
  onShowResults: () => void
}

// The two steps of the panel, in order: fill in the trip, then compare its routes.
export function PanelTabs({ panelView, areRoutesAvailable, onShowForm, onShowResults }: PanelTabsProps) {
  return (
    <div className="flex shrink-0 border-b border-border bg-asphalt">
      <button type="button" onClick={onShowForm} aria-pressed={panelView === PanelView.FORM} className={TAB_CLASS_NAME}>
        1&nbsp; Trip
      </button>
      <button
        type="button"
        onClick={onShowResults}
        disabled={!areRoutesAvailable}
        aria-pressed={panelView === PanelView.RESULTS}
        className={TAB_CLASS_NAME}
      >
        2&nbsp; Routes
      </button>
    </div>
  )
}

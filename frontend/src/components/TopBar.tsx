import { InfoTopic } from '../types/infoTopic'

// Tailwind classes shared by the items of the navigation band (each item adds its own display).
const NAV_ITEM_CLASS_NAME =
  'items-center px-3 pt-0.5 font-display text-xs font-bold tracking-[0.14em] whitespace-nowrap uppercase sm:px-4'

type TopBarProps = {
  // Called with the topic of the pressed link; App opens the info dialog on it.
  onOpenInfo: (topic: InfoTopic) => void
}

// The bar across the top: the logo and name on near-black, then the teal navigation band.
// The map is the only page, so "Map" is always the current item; the other two open the info dialog.
// Phones: "Map" is left out and "How risk works" shortens to "Risk", so the band fits without scrolling.
export function TopBar({ onOpenInfo }: TopBarProps) {
  return (
    // Above the panel and the map, so its shadow falls on them.
    <header className="relative z-20 flex h-12 shrink-0 shadow-top-bar">
      <div className="flex shrink-0 items-center gap-3 bg-asphalt px-3 sm:px-4">
        {/* The same file as the browser tab icon, so the logo is drawn once. */}
        <img src="/favicon.svg" alt="" className="size-8" />
        <h1 className="pt-1 font-display text-xl leading-none tracking-[0.08em] uppercase">
          <span className="font-extrabold">Safe</span> <span className="font-light">Road</span>
        </h1>
      </div>

      <nav aria-label="Main" className="flex min-w-0 flex-1 overflow-x-auto bg-band">
        <span aria-current="page" className={`${NAV_ITEM_CLASS_NAME} hidden bg-surface text-primary sm:flex`}>
          Map
        </span>
        <button
          type="button"
          onClick={() => onOpenInfo(InfoTopic.RISK)}
          className={`${NAV_ITEM_CLASS_NAME} flex cursor-pointer hover:bg-band-dark`}
        >
          <span className="sm:hidden">Risk</span>
          <span className="hidden sm:inline">How risk works</span>
        </button>
        <button
          type="button"
          onClick={() => onOpenInfo(InfoTopic.ABOUT)}
          className={`${NAV_ITEM_CLASS_NAME} flex cursor-pointer hover:bg-band-dark`}
        >
          About
        </button>
      </nav>
    </header>
  )
}

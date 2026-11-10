import { PauseIcon, PlayIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { SECONDARY_BUTTON_CLASS_NAME } from '../config/buttonStyles'
import { RISK_LEVEL_COLORS } from '../config/riskConfig'
import { getForecastHourTime, getTripHourRange } from '../lib/dateTime'
import { formatEta, formatForecastTime, formatHourMark, formatHoursFromNow } from '../lib/formatters'
import { getTripHourLevels, getTruckProgressText } from '../lib/tripTimeline'
import { getRouteOptionName } from '../lib/tripPlanRoutes'
import { HeatmapStatus, type Heatmap } from '../types/heatmap'
import type { RoutePlan } from '../types/tripPlan'
import { RiskLegend } from './RiskLegend'
import { SectionHeading } from './SectionHeading'

// Milliseconds between steps while playing: 250 ms = 4 forecast hours per second.
const PLAY_STEP_MS = 250

// Hours labeled under the slider, from now to the last forecast hour.
const HOUR_MARKS = [0, 12, 24, 36, 48]

// Height in pixels of an hourly bar at Low; each level up adds the same again, so No Travel is five times as tall.
const BAR_STEP_PX = 6

// Tailwind classes for the native range input: no track of its own (the ticks and bars under it are the track)
// and a thin, tall off-white thumb that works as the time cursor. The thumb is styled for both browser engines.
const RANGE_INPUT_CLASS_NAME =
  'absolute inset-0 h-full w-full cursor-pointer appearance-none bg-transparent focus-visible:outline-2 focus-visible:outline-primary disabled:cursor-default [&::-moz-range-thumb]:h-10 [&::-moz-range-thumb]:w-1 [&::-moz-range-thumb]:rounded-none [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:bg-foreground [&::-moz-range-track]:bg-transparent [&::-webkit-slider-thumb]:h-10 [&::-webkit-slider-thumb]:w-1 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:bg-foreground'

type ForecastSliderProps = {
  // Narrow screens: no heading, and the legend behind a "Risk" button.
  isCompact: boolean
  // Forecast hour the heatmap shows: 0 = now, up to 48.
  hour: number
  onHourChange: (hour: number) => void
  // Called when the user presses play or drags the slider; App then shows the truck on the map.
  onUse: () => void
  // null while loading or after a failure; the slider is disabled then.
  heatmap: Heatmap | null
  heatmapStatus: HeatmapStatus | null
  // The selected route; its trip is marked on the slider, with the risk where the truck is at each hour.
  route: RoutePlan
  // Departure of the plan (ISO, UTC).
  departureUtc: string
}

// Forecast band: play/pause, the 0-48 h slider with the trip's hours and their risk, and the time shown as a clock.
// App places it: under the map on wide screens, on top of the drawer (compact) on narrow ones.
export function ForecastSlider({
  isCompact,
  hour,
  onHourChange,
  onUse,
  heatmap,
  heatmapStatus,
  route,
  departureUtc,
}: ForecastSliderProps) {
  const [isPlaying, setIsPlaying] = useState(false)
  // Compact band only: whether the color legend is open.
  const [isLegendOpen, setIsLegendOpen] = useState(false)

  // Until the heatmap is loaded there is nothing to slide through.
  const isDisabled = heatmap === null
  // The backend sends 49 hours, so the last one is 48.
  const lastHour = heatmap ? heatmap.hours - 1 : 0
  // Which hours of the slider the truck is on the road; null before the heatmap or when the trip starts later.
  const tripHourRange = heatmap ? getTripHourRange(heatmap.start_hour_utc, departureUtc, route.arrival_utc, lastHour) : null
  const tripHourLevels = heatmap ? getTripHourLevels(route, heatmap.start_hour_utc, lastHour) : []
  const routeName = getRouteOptionName(route)

  // While playing: wait one step, then move one hour forward; stop at the last hour.
  // Every new hour runs this again, like scheduling the next tick in Java.
  useEffect(() => {
    if (!isPlaying || isDisabled) return

    const timeoutId = window.setTimeout(() => {
      if (hour >= lastHour) {
        setIsPlaying(false)
      } else {
        onHourChange(hour + 1)
      }
    }, PLAY_STEP_MS)

    // Cancel the pending step if the user pauses or drags the slider first.
    return () => window.clearTimeout(timeoutId)
  }, [isPlaying, isDisabled, hour, lastHour, onHourChange])

  function handlePlayClick() {
    onUse()

    // Play at the end starts over from now.
    if (!isPlaying && hour >= lastHour) {
      onHourChange(0)
    }
    setIsPlaying(!isPlaying)
  }

  // A share of the 0-lastHour track as a CSS percentage, for placing the trip band and the bars.
  function getTrackPercent(trackHour: number): string {
    return `${(trackHour / lastHour) * 100}%`
  }

  // The time the map shows as a clock, with how far ahead it is and where the truck is then;
  // or why there is nothing to show yet.
  const readout = heatmap ? (
    <div className={`flex flex-col gap-1 font-mono ${isCompact ? '' : 'items-end text-right'}`}>
      <span className={`leading-none font-bold text-primary uppercase ${isCompact ? 'text-lg' : 'text-2xl'}`}>
        {formatForecastTime(heatmap.start_hour_utc, hour)}
      </span>
      <span className="text-xs text-muted-foreground uppercase">
        {formatHoursFromNow(hour)} · {getTruckProgressText(route, getForecastHourTime(heatmap.start_hour_utc, hour))}
      </span>
    </div>
  ) : (
    <span className="font-mono text-sm text-muted-foreground uppercase">
      {heatmapStatus === HeatmapStatus.FAILED ? 'Weather map unavailable' : 'Loading weather…'}
    </span>
  )

  const playButton = (
    <button
      type="button"
      onClick={handlePlayClick}
      disabled={isDisabled}
      aria-label={isPlaying ? 'Pause' : 'Play'}
      className="flex size-10 shrink-0 cursor-pointer items-center justify-center border border-primary bg-band hover:bg-band-dark disabled:cursor-default disabled:opacity-50"
    >
      {isPlaying ? <PauseIcon className="size-5" /> : <PlayIcon className="ml-0.5 size-5" />}
    </button>
  )

  // The slider over its track: hour ticks, the trip's hours as a dashed band, and one bar per trip hour, as tall
  // and in the color of the risk where the truck is then; the hour marks under it.
  const track = (
    <div className="flex min-w-0 flex-1 flex-col gap-1">
      <div className="relative h-10">
        {/* The thumb's center stops half a thumb (2px) short of each end, so the drawings use the same inset area. */}
        <div className="absolute inset-y-0 inset-x-0.5" aria-hidden="true">
          <div className="absolute inset-x-0 bottom-0 flex h-1.5 justify-between border-b border-border">
            {heatmap && Array.from({ length: lastHour + 1 }, (_, tickHour) => <span key={tickHour} className="w-px bg-border" />)}
          </div>

          {/* Positions and colors come from data, so inline style. */}
          {tripHourRange && (
            <div
              className="absolute inset-y-0 border-x border-dashed border-primary bg-primary/10"
              style={{ left: getTrackPercent(tripHourRange.startHour), width: getTrackPercent(tripHourRange.endHour - tripHourRange.startHour) }}
            />
          )}
          {tripHourLevels.map((hourLevel) => (
            <span
              key={hourLevel.hour}
              className="absolute bottom-1.5 -translate-x-1/2"
              style={{
                left: getTrackPercent(hourLevel.hour),
                width: `calc(${getTrackPercent(1)} - 2px)`,
                height: `${(hourLevel.level + 1) * BAR_STEP_PX}px`,
                backgroundColor: RISK_LEVEL_COLORS[hourLevel.level],
              }}
            />
          ))}
        </div>

        <input
          type="range"
          min={0}
          max={lastHour}
          step={1}
          value={hour}
          disabled={isDisabled}
          aria-label="Forecast hour"
          onChange={(event) => {
            onUse()
            onHourChange(Number(event.target.value))
          }}
          className={RANGE_INPUT_CLASS_NAME}
        />
      </div>

      {heatmap && (
        <div className="flex justify-between font-mono text-[10px] text-muted-foreground uppercase" aria-hidden="true">
          {HOUR_MARKS.map((hourMark) => (
            <span key={hourMark}>{formatHourMark(heatmap.start_hour_utc, hourMark)}</span>
          ))}
        </div>
      )}
    </div>
  )

  if (isCompact) {
    return (
      <section aria-label="Weather forecast" className="flex flex-col gap-2 border border-border bg-asphalt/95 p-3 text-sm shadow-floating-panel">
        <div className="flex items-start justify-between gap-3">
          {readout}
          <button
            type="button"
            onClick={() => setIsLegendOpen(!isLegendOpen)}
            aria-expanded={isLegendOpen}
            className={`shrink-0 px-2.5 py-1 ${SECONDARY_BUTTON_CLASS_NAME}`}
          >
            Risk
          </button>
        </div>
        <div className="flex items-center gap-3">
          {playButton}
          {track}
        </div>
        {isLegendOpen && <RiskLegend />}
      </section>
    )
  }

  return (
    // Above the map, so its shadow falls on it.
    <section
      aria-label="Weather forecast"
      className="relative z-10 flex flex-col gap-2 border-t border-border bg-asphalt px-5 pt-3 pb-3.5 text-sm shadow-forecast-band"
    >
      <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2">
        <SectionHeading strongText="Forecast" text="hour by hour" note={getTripNote(routeName, heatmap !== null && tripHourRange === null, departureUtc, route.arrival_utc)} />
        <RiskLegend />
      </div>
      <div className="flex items-center gap-5">
        {playButton}
        {track}
        <div className="shrink-0">{readout}</div>
      </div>
    </section>
  )
}

// Note next to the heading: when the selected route's trip runs, in local days and times,
// e.g. "Option 1: Thu 8:54 PM → Fri 12:30 PM", or that it starts after the forecast ends.
function getTripNote(routeName: string, isTripAfterForecast: boolean, departureUtc: string, arrivalUtc: string): string {
  if (isTripAfterForecast) {
    return `${routeName} leaves after this forecast`
  }

  return `${routeName}: ${formatEta(departureUtc)} → ${formatEta(arrivalUtc)}`
}

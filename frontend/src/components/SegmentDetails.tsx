import { XIcon } from 'lucide-react'
import { RISK_CAUSE_LABELS, RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_TEXT_COLORS } from '../config/riskConfig'
import { LABEL_CLASS_NAME } from '../config/textStyles'
import { formatEta, formatPrecipitationRate, formatSpeed } from '../lib/formatters'
import { getWorseCheckpoint } from '../lib/routeGeometry'
import { RiskCause } from '../types/risk'
import type { Checkpoint } from '../types/tripPlan'

type SegmentDetailsProps = {
  // The checkpoints at both ends of the clicked segment.
  start: Checkpoint
  end: Checkpoint
  // Shows a close button on the risk band; given by the map popup, left out in the drawer (it has a back button).
  onClose?: () => void
}

// Details for a clicked segment of the route, in plain words: how risky it is and why, when the truck passes,
// and the weather there. The weather comes from the end that gave the segment its color.
// Shown in the map popup on wide screens and in the bottom drawer on narrow screens.
export function SegmentDetails({ start, end, onClose }: SegmentDetailsProps) {
  const worse = getWorseCheckpoint(start, end)
  const levelColor = RISK_LEVEL_COLORS[worse.level]
  const isWindCause = worse.cause === RiskCause.WIND || worse.cause === RiskCause.WIND_LOAD_RULE

  return (
    <div className="flex w-full flex-col text-sm">
      {/* A band in the level's color; colors come from config at runtime, so inline style. */}
      <div
        className="flex items-center justify-between gap-2 px-3 py-1.5 font-display text-xs font-extrabold tracking-[0.16em] uppercase"
        style={{ backgroundColor: levelColor, color: RISK_LEVEL_TEXT_COLORS[worse.level] }}
      >
        <span className="pt-0.5">{RISK_LEVEL_LABELS[worse.level]} risk</span>
        {onClose && (
          <button type="button" onClick={onClose} aria-label="Close" className="-mr-1 cursor-pointer p-0.5 hover:bg-asphalt/20">
            <XIcon className="size-4" />
          </button>
        )}
      </div>

      <div className="flex flex-col gap-3 p-3">
        <div className="flex flex-col gap-1">
          <h3 className="font-display text-base leading-tight font-bold">{RISK_CAUSE_LABELS[worse.cause]}</h3>
          {worse.cause === RiskCause.WIND_LOAD_RULE && (
            <p className="text-xs text-muted-foreground">Strong gusts are more dangerous for a heavy truck.</p>
          )}
        </div>

        <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-1.5 border-t border-border pt-2.5">
          <DetailRow label="Miles" value={`${start.mile}–${end.mile} of your trip`} />
          <DetailRow label="You pass" value={`${formatEta(start.eta_utc)} – ${formatEta(end.eta_utc)}`} />
          <DetailRow
            label="Wind"
            value={`${formatSpeed(worse.wind_speed_mph)}, gusts ${formatSpeed(worse.wind_gust_mph)}`}
            causeColor={isWindCause ? levelColor : null}
          />
          {/* Rain and snow only when there is some, so calm segments stay short. */}
          {worse.rain_in_hr > 0 && (
            <DetailRow
              label="Rain"
              value={formatPrecipitationRate(worse.rain_in_hr)}
              causeColor={worse.cause === RiskCause.RAIN ? levelColor : null}
            />
          )}
          {worse.snow_in_hr > 0 && (
            <DetailRow
              label="Snow"
              value={formatPrecipitationRate(worse.snow_in_hr)}
              causeColor={worse.cause === RiskCause.SNOW ? levelColor : null}
            />
          )}
        </dl>

        <p className="text-xs text-muted-foreground">
          Forecast for {formatEta(worse.forecast_hour_utc)} at mile {worse.mile}
        </p>
      </div>
    </div>
  )
}

type DetailRowProps = {
  label: string
  value: string
  // The risk color when this condition caused the risk (its value turns bold, in that color); else null.
  causeColor?: string | null
}

// One line of the details: a small capital label on the left, the value on the right.
function DetailRow({ label, value, causeColor = null }: DetailRowProps) {
  return (
    <>
      <dt className={LABEL_CLASS_NAME}>{label}</dt>
      <dd
        className={`font-display tabular-nums ${causeColor ? 'font-bold' : ''}`}
        style={{ color: causeColor ?? undefined }}
      >
        {value}
      </dd>
    </>
  )
}

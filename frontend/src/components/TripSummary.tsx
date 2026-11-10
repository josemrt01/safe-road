import { SECONDARY_BUTTON_CLASS_NAME } from '../config/buttonStyles'
import { formatEta, formatWeight } from '../lib/formatters'
import type { TripPlan, TripSettings } from '../types/tripPlan'
import { LabeledValue } from './LabeledValue'

type TripSummaryProps = {
  tripPlan: TripPlan
  tripSettings: TripSettings
  // "Clear": App removes the plan and shows an empty form.
  onClear: () => void
}

// The trip the user entered, above the route list: From → To in bold, then the departure and truck settings.
export function TripSummary({ tripPlan, tripSettings, onClear }: TripSummaryProps) {
  return (
    <section className="flex shrink-0 flex-col gap-3 border-b border-border px-4 py-4">
      <div className="flex items-start justify-between gap-3">
        <p className="min-w-0 font-display text-base leading-snug font-bold">
          {tripPlan.origin.label} <span className="text-primary">→</span> {tripPlan.destination.label}
        </p>
        <button type="button" onClick={onClear} className={`shrink-0 px-3 py-1.5 ${SECONDARY_BUTTON_CLASS_NAME}`}>
          Clear
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <LabeledValue label="Leaves">{formatEta(tripPlan.departure_utc)}</LabeledValue>
        <LabeledValue label="Weight">{formatWeight(tripSettings.weightLb)}</LabeledValue>
        <LabeledValue label="Checks">Every {tripSettings.spacingMi} mi</LabeledValue>
      </div>
    </section>
  )
}

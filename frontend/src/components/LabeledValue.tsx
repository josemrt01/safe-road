import type { ReactNode } from 'react'
import { LABEL_CLASS_NAME } from '../config/textStyles'

type LabeledValueProps = {
  label: string
  // Extra Tailwind classes for the value, e.g. a bigger, bolder size for the driving time.
  valueClassName?: string
  children: ReactNode
}

// A small capital label with its value under it, e.g. "ARRIVES" over "Tue 4:18 PM"; spans only, so it can sit
// inside a button. Used by TripSummary and RouteRow.
export function LabeledValue({ label, valueClassName = '', children }: LabeledValueProps) {
  return (
    <span className="flex min-w-0 flex-col gap-0.5">
      <span className={LABEL_CLASS_NAME}>{label}</span>
      <span className={`font-display tabular-nums ${valueClassName}`}>{children}</span>
    </span>
  )
}

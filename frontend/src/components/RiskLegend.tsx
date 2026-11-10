import { RISK_LEVEL_LABELS, RISK_LEVELS_IN_ORDER } from '../config/riskConfig'
import { LABEL_CLASS_NAME } from '../config/textStyles'
import { RiskColorSwatch } from './RiskColorSwatch'

// The route and heatmap colors with their names; shown in the forecast band.
export function RiskLegend() {
  return (
    <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
      {RISK_LEVELS_IN_ORDER.map((level) => (
        <span key={level} className={`flex items-center gap-1.5 ${LABEL_CLASS_NAME}`}>
          <RiskColorSwatch level={level} />
          <span className="pt-0.5">{RISK_LEVEL_LABELS[level]}</span>
        </span>
      ))}
    </div>
  )
}

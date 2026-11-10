import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS } from '../config/riskConfig'
import { formatDistance } from '../lib/formatters'
import { getRiskStripPieces } from '../lib/routeRisk'
import type { Checkpoint } from '../types/tripPlan'

type RiskStripProps = {
  checkpoints: Checkpoint[]
  distanceMi: number
}

// A thin bar from the start of the route to its end, each piece as long as its miles and in its risk color,
// so the dangerous part of a route shows at a glance; used by RouteRow.
export function RiskStrip({ checkpoints, distanceMi }: RiskStripProps) {
  const pieces = getRiskStripPieces(checkpoints)

  // Screen readers get the pieces in words, e.g. "Low 100.0 mi, Severe 50.0 mi, Low 368.4 mi".
  const pieceDescriptions: string[] = []
  for (const piece of pieces) {
    pieceDescriptions.push(`${RISK_LEVEL_LABELS[piece.level]} ${formatDistance(piece.miles)}`)
  }

  return (
    <span className="flex flex-col gap-1">
      <span
        role="img"
        aria-label={`Risk along the route: ${pieceDescriptions.join(', ')}`}
        className="flex h-2 gap-px bg-asphalt"
      >
        {pieces.map((piece, index) => (
          // Lengths and colors come from data, so inline style; flexGrow shares the width by miles.
          <span key={index} style={{ flexGrow: piece.miles, backgroundColor: RISK_LEVEL_COLORS[piece.level] }} />
        ))}
      </span>
      <span className="flex justify-between text-[11px] text-muted-foreground tabular-nums" aria-hidden="true">
        <span>0 mi</span>
        <span>{formatDistance(distanceMi)}</span>
      </span>
    </span>
  )
}

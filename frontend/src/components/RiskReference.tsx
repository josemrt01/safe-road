import { RISK_LEVEL_COLORS, RISK_LEVEL_LABELS, RISK_LEVEL_TEXT_COLORS } from '../config/riskConfig'
import { LABEL_CLASS_NAME } from '../config/textStyles'
import { RiskLevel } from '../types/risk'
import { SectionHeading } from './SectionHeading'

// One row of the risk table: what a level means and the weather that reaches it.
type RiskThresholdRow = {
  level: RiskLevel
  meaning: string
  gustsMph: string
  rainInHr: string
  snowInHr: string
}

// The rules of backend/trips/logic/risk_calculator.py written out for people; change both together.
const RISK_THRESHOLD_ROWS: RiskThresholdRow[] = [
  { level: RiskLevel.LOW, meaning: 'Normal driving', gustsMph: '< 25', rainInHr: '< 0.10', snowInHr: '< 0.5' },
  { level: RiskLevel.MODERATE, meaning: 'Drive with care', gustsMph: '25–35', rainInHr: '0.10–0.25', snowInHr: '0.5–1.0' },
  { level: RiskLevel.HIGH, meaning: 'Slow down, stay alert', gustsMph: '35–45', rainInHr: '0.25–0.50', snowInHr: '1.0–2.0' },
  { level: RiskLevel.SEVERE, meaning: 'Avoid if possible', gustsMph: '45–55', rainInHr: '0.50–1.00', snowInHr: '2.0–3.0' },
  { level: RiskLevel.NO_TRAVEL, meaning: 'Do not drive through', gustsMph: '55 or more', rainInHr: '> 1.00', snowInHr: '> 3.0' },
]

// Tailwind classes for a header cell of the risk table.
const TABLE_HEADER_CLASS_NAME = 'bg-band-dark px-3 py-2 text-left font-display text-[11px] font-bold tracking-[0.14em] uppercase'

// "How risk works": the level table, the heavy-load rules and how the recommended route is picked.
export function RiskReference() {
  return (
    <div className="grid gap-8 md:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
      <section className="flex flex-col gap-3">
        <SectionHeading strongText="Risk" text="levels" note="checked at every checkpoint" />
        <p className="text-muted-foreground">
          At each checkpoint the app reads the forecast for the hour the truck gets there. Wind gusts, rain and snow
          each get a level, and the checkpoint takes the worst one.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse tabular-nums">
            <thead>
              <tr>
                <th className={TABLE_HEADER_CLASS_NAME}>Level</th>
                <th className={TABLE_HEADER_CLASS_NAME}>Means</th>
                <th className={TABLE_HEADER_CLASS_NAME}>Gusts mph</th>
                <th className={TABLE_HEADER_CLASS_NAME}>Rain in/hr</th>
                <th className={TABLE_HEADER_CLASS_NAME}>Snow in/hr</th>
              </tr>
            </thead>
            <tbody>
              {RISK_THRESHOLD_ROWS.map((row) => (
                <tr key={row.level} className="border-b border-border even:bg-surface">
                  {/* The level's own color, the same as on the map and the route rows. */}
                  <td
                    className="px-3 py-2 font-display font-bold whitespace-nowrap"
                    style={{ backgroundColor: RISK_LEVEL_COLORS[row.level], color: RISK_LEVEL_TEXT_COLORS[row.level] }}
                  >
                    {RISK_LEVEL_LABELS[row.level]}
                  </td>
                  <td className="px-3 py-2">{row.meaning}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.gustsMph}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.rainInHr}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{row.snowInHr}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="flex flex-col gap-8">
        <section className="flex flex-col gap-3">
          <SectionHeading strongText="Heavy" text="loads" />
          <p className="text-muted-foreground">
            A loaded truck is harder to steer and needs more distance to stop, so strong gusts count more. Over{' '}
            <strong className="text-foreground">40,000 lb</strong>, gusts of 35–45 mph are Severe. Over{' '}
            <strong className="text-foreground">30,000 lb</strong>, gusts of 45–55 mph are No Travel.
          </p>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeading strongText="The" text="pick" note="first difference wins" />
          <ol className="flex list-decimal flex-col gap-1 pl-5 text-muted-foreground">
            <li>Fewest miles at No Travel</li>
            <li>Fewest miles at Severe</li>
            <li>Fewest miles at High</li>
            <li>Lowest average risk over the whole route</li>
            <li>Shortest driving time</li>
          </ol>
        </section>

        <section className="flex flex-col gap-2">
          <h3 className={LABEL_CLASS_NAME}>Not checked</h3>
          <p className="text-muted-foreground">
            Ice, fog, traffic and road closures. Routes are car routes, so they don't avoid low bridges or roads
            closed to trucks.
          </p>
        </section>
      </div>
    </div>
  )
}

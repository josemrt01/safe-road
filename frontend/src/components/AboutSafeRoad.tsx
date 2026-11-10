import { LABEL_CLASS_NAME } from '../config/textStyles'
import { SectionHeading } from './SectionHeading'

// Tailwind classes for the links to the data sources.
const LINK_CLASS_NAME = 'font-bold text-primary underline'

// Tailwind classes for the words that carry each sentence, so a quick read still gets the point.
const KEY_WORDS_CLASS_NAME = 'font-bold text-foreground'

// "About": what Safe Road does, how to use it, what each part of the screen shows, and where the data comes from.
export function AboutSafeRoad() {
  return (
    <div className="flex flex-col gap-8">
      <section className="flex max-w-[68ch] flex-col gap-3">
        <h2 className="font-display text-2xl leading-tight font-light tracking-[0.03em] text-balance uppercase">
          Every mile of your route, <strong className="font-extrabold">checked against the hour you drive it.</strong>
        </h2>
        <p className="text-base text-muted-foreground">
          Safe Road compares <strong className={KEY_WORDS_CLASS_NAME}>up to three truck routes</strong>, reads the
          forecast <strong className={KEY_WORDS_CLASS_NAME}>where and when your truck will be</strong>, and recommends
          the <strong className={KEY_WORDS_CLASS_NAME}>safest one</strong>.
        </p>
      </section>

      <div className="grid gap-8 md:grid-cols-2">
        <section className="flex flex-col gap-3">
          <SectionHeading strongText="How" text="to use it" />
          <ol className="flex list-decimal flex-col gap-2.5 pl-5 text-muted-foreground marker:font-bold marker:text-primary">
            <li>
              <strong className={KEY_WORDS_CLASS_NAME}>Fill in the trip.</strong> Origin, destination, departure, how
              often to check the weather, and the truck weight.
            </li>
            <li>
              <strong className={KEY_WORDS_CLASS_NAME}>Press Plan route.</strong> The recommended route comes first,
              with the reason it wins.
            </li>
            <li>
              <strong className={KEY_WORDS_CLASS_NAME}>Click a colored piece of a route</strong> to see its risk, when
              you pass there and the weather.
            </li>
            <li>
              <strong className={KEY_WORDS_CLASS_NAME}>Press play under the map</strong> to watch the weather and your
              truck hour by hour.
            </li>
          </ol>
        </section>

        <section className="flex flex-col gap-3">
          <SectionHeading strongText="What" text="you see" />
          <dl className="flex flex-col gap-2.5 text-muted-foreground">
            <div>
              <dt className={KEY_WORDS_CLASS_NAME}>Route rows</dt>
              <dd>Driving time, arrival, distance and miles at High risk or worse, safest route first.</dd>
            </div>
            <div>
              <dt className={KEY_WORDS_CLASS_NAME}>Risk strip</dt>
              <dd>The route from start to end, colored by risk, so the dangerous part shows at a glance.</dd>
            </div>
            <div>
              <dt className={KEY_WORDS_CLASS_NAME}>Weather map</dt>
              <dd>The risk around the routes for each of the next 48 hours.</dd>
            </div>
            <div>
              <dt className={KEY_WORDS_CLASS_NAME}>Forecast band</dt>
              <dd>The hours your truck is on the road, with the risk where it is at each hour.</dd>
            </div>
          </dl>
        </section>
      </div>

      <section className="flex flex-col gap-2 border-t border-border pt-5">
        <h3 className={LABEL_CLASS_NAME}>Data</h3>
        <p className="max-w-[68ch] text-muted-foreground">
          Forecasts from{' '}
          <a href="https://open-meteo.com" target="_blank" rel="noreferrer" className={LINK_CLASS_NAME}>
            Open-Meteo
          </a>
          . Routes and place search from{' '}
          <a href="https://www.graphhopper.com" target="_blank" rel="noreferrer" className={LINK_CLASS_NAME}>
            GraphHopper
          </a>
          . Map from{' '}
          <a href="https://openfreemap.org" target="_blank" rel="noreferrer" className={LINK_CLASS_NAME}>
            OpenFreeMap
          </a>
          , with{' '}
          <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noreferrer" className={LINK_CLASS_NAME}>
            OpenStreetMap
          </a>{' '}
          data. <strong className={KEY_WORDS_CLASS_NAME}>US routes only.</strong>
        </p>
      </section>
    </div>
  )
}

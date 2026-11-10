type SectionHeadingProps = {
  // First word, in extra-bold, e.g. "Route".
  strongText: string
  // The rest of the heading, in light weight, e.g. "options".
  text: string
  // Short italic note after the heading, in ice blue, e.g. "safest first".
  note?: string
  // Lets a section name itself after this heading with aria-labelledby.
  id?: string
}

// A section heading in capitals that mixes an extra-bold and a light word, with an optional note;
// used by the route list, the forecast band and the info dialog.
export function SectionHeading({ strongText, text, note, id }: SectionHeadingProps) {
  return (
    <h2 id={id} className="font-display text-base font-light tracking-[0.08em] uppercase">
      <strong className="font-extrabold">{strongText}</strong> {text}
      {note && <em className="ml-2 text-sm font-normal tracking-normal text-primary normal-case">{note}</em>}
    </h2>
  )
}

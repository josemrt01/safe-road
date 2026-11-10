// Tailwind classes for the main action of a view (Plan route): solid ice blue with dark capital letters.
export const PRIMARY_BUTTON_CLASS_NAME =
  'cursor-pointer border border-primary bg-primary font-display text-sm font-bold tracking-[0.12em] text-primary-foreground uppercase hover:brightness-110 disabled:cursor-wait disabled:opacity-60'

// Tailwind classes for secondary actions (Clear, Back, Risk): dark teal with a thin outline that turns ice blue
// on hover.
export const SECONDARY_BUTTON_CLASS_NAME =
  'cursor-pointer border border-border bg-surface font-display text-xs font-bold tracking-[0.12em] text-foreground uppercase hover:border-primary disabled:cursor-wait disabled:opacity-60'

// Tailwind classes for one option of a segmented control (a row of joined buttons where one is picked):
// dark teal when off, ice blue when picked. transition-none removes shadcn's 150 ms fade, so a press shows at once;
// the hover rules keep the picked option's colors. Used by the departure and checkpoint groups.
export const SEGMENTED_OPTION_CLASS_NAME =
  'h-10 flex-1 bg-surface font-display text-sm font-bold transition-none aria-pressed:border-primary aria-pressed:bg-primary aria-pressed:text-primary-foreground aria-pressed:hover:bg-primary aria-pressed:hover:text-primary-foreground'

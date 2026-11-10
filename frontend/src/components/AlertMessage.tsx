import { TriangleAlertIcon } from 'lucide-react'
import type { ReactNode } from 'react'
import { LABEL_CLASS_NAME } from '../config/textStyles'
import { cn } from '../lib/utils'

type AlertMessageProps = {
  // What went wrong in a few words, e.g. "Couldn't plan the trip".
  title: string
  // The full message: what happened and what to do.
  children: ReactNode
}

// A problem the user needs to see: a red bar on the left, a warning sign and a small capital title in red, then the
// message. role="alert" makes screen readers read it out as soon as it appears. Used by the trip form, the panel
// and the route list.
export function AlertMessage({ title, children }: AlertMessageProps) {
  return (
    <div role="alert" className="flex gap-2.5 border border-l-[3px] border-error/40 border-l-error bg-error/10 px-3 py-2.5">
      <TriangleAlertIcon className="mt-px size-4 shrink-0 text-error" aria-hidden="true" />
      <div className="flex min-w-0 flex-col gap-1">
        {/* cn lets the red replace the label's usual gray. */}
        <p className={cn(LABEL_CLASS_NAME, 'pt-0.5 text-error')}>{title}</p>
        <p className="text-foreground">{children}</p>
      </div>
    </div>
  )
}

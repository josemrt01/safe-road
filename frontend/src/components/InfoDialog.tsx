import { Dialog } from '@base-ui/react/dialog'
import { XIcon } from 'lucide-react'
import { InfoTopic } from '../types/infoTopic'
import { AboutSafeRoad } from './AboutSafeRoad'
import { RiskReference } from './RiskReference'

// Title shown in the dialog's band for each topic.
const INFO_TOPIC_TITLES: Record<InfoTopic, string> = {
  [InfoTopic.RISK]: 'How risk works',
  [InfoTopic.ABOUT]: 'About Safe Road',
}

type InfoDialogProps = {
  // The topic to show, or null when the dialog is closed.
  topic: InfoTopic | null
  // Called by the close button, Escape or a click outside; App sets the topic back to null.
  onClose: () => void
}

// Reference pages over the map, opened from the top bar, so the app stays one screen with the map.
export function InfoDialog({ topic, onClose }: InfoDialogProps) {
  return (
    <Dialog.Root
      open={topic !== null}
      onOpenChange={(isOpen) => {
        if (!isOpen) onClose()
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 bg-asphalt/70" />
        <Dialog.Popup className="fixed top-1/2 left-1/2 flex max-h-[85dvh] w-[min(56rem,calc(100vw-2rem))] -translate-1/2 flex-col border border-border bg-panel text-sm shadow-floating-panel outline-none">
          {topic && (
            <>
              <div className="flex shrink-0 items-center justify-between gap-3 bg-band px-4 py-2">
                <Dialog.Title className="pt-0.5 font-display text-xs font-bold tracking-[0.14em] uppercase">
                  {INFO_TOPIC_TITLES[topic]}
                </Dialog.Title>
                <Dialog.Close aria-label="Close" className="cursor-pointer p-1 hover:bg-band-dark">
                  <XIcon className="size-4" />
                </Dialog.Close>
              </div>

              <div className="overflow-y-auto p-5">
                {topic === InfoTopic.RISK ? <RiskReference /> : <AboutSafeRoad />}
              </div>
            </>
          )}
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  )
}

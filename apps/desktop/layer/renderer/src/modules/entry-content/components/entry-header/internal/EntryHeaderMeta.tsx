import { AnimatePresence, m } from "motion/react"
import { memo } from "react"

import { useEntryContentScrollToTop, useEntryTitleMeta } from "../../../atoms"

function EntryHeaderMetaImpl() {
  const entryTitleMeta = useEntryTitleMeta()
  const isAtTop = useEntryContentScrollToTop()
  const shouldShowMeta = !isAtTop && !!entryTitleMeta?.entryTitle
  return (
    <div className="flex min-w-0 shrink grow">
      <AnimatePresence>
        {shouldShowMeta && entryTitleMeta && (
          <m.div
            initial={{ opacity: 0.01, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0.01, y: 30 }}
            className="text-text text-title3 flex min-w-0 flex-1 shrink items-end gap-2 truncate leading-tight"
          >
            <span className="shrink truncate font-bold">{entryTitleMeta.entryTitle}</span>
            <i className="i-mgc-line-cute-re text-text-secondary size-[10px] shrink-0 translate-y-[-3px] rotate-[-25deg]" />
            <span className="text-text-secondary text-headline shrink -translate-y-px truncate">
              {entryTitleMeta.feedTitle}
            </span>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export const EntryHeaderMeta = memo(EntryHeaderMetaImpl)

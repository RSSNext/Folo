import { memo } from "react"

import { useEntryContentScrollToTop } from "../../atoms"
import { EntryHeaderRoot } from "./internal/context"
import { EntryHeaderActionsContainer } from "./internal/EntryHeaderActionsContainer"
import { EntryHeaderBreadcrumb } from "./internal/EntryHeaderBreadcrumb"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ entryId, className, compact }: EntryHeaderProps) {
  const isAtTop = useEntryContentScrollToTop()
  return (
    <EntryHeaderRoot entryId={entryId} className={className} compact={compact}>
      <div
        className="bg-background h-top-header relative z-10 flex w-full items-center justify-between gap-3 px-4"
        data-at-top={isAtTop}
        data-hide-in-print
      >
        <EntryHeaderBreadcrumb />
        <EntryHeaderActionsContainer />
      </div>
    </EntryHeaderRoot>
  )
}

export const AIEntryHeader = memo(EntryHeaderImpl)

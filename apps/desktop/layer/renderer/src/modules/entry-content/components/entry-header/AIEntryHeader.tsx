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
        className="bg-background border-border relative z-10 flex h-12 w-full items-center justify-between gap-3 px-2 data-[at-top='false']:border-b"
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

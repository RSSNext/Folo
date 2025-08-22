import { memo } from "react"

import { EntryHeaderRoot } from "./internal/context"
import { EntryHeaderActionsContainer } from "./internal/EntryHeaderActionsContainer"
import { EntryHeaderMeta } from "./internal/EntryHeaderMeta"
import { EntryHeaderReadHistory } from "./internal/EntryHeaderReadHistory"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ entryId, className, compact }: EntryHeaderProps) {
  return (
    <EntryHeaderRoot entryId={entryId} className={className} compact={compact}>
      <EntryHeaderReadHistory />
      <div
        className="relative z-10 flex w-full items-center justify-between gap-3"
        data-hide-in-print
      >
        <EntryHeaderMeta />
        <EntryHeaderActionsContainer />
      </div>
    </EntryHeaderRoot>
  )
}

export const EntryHeader = memo(EntryHeaderImpl)

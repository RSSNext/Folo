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
        // Fixed height(3.25rem)(52px) to align with the sidebar padding(pt-2.5)(10px)
        // (52 - 32) / 2 = 10
        className="bg-background relative z-10 flex h-[3.25rem] w-full items-center justify-between gap-3 px-4"
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

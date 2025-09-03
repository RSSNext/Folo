import { cn } from "@follow/utils"
import { memo } from "react"

import { EntryHeaderRoot } from "./internal/context"
import { EntryHeaderActionsContainer } from "./internal/EntryHeaderActionsContainer"
import { EntryHeaderMeta } from "./internal/EntryHeaderMeta"
import { EntryHeaderReadHistory } from "./internal/EntryHeaderReadHistory"
import type { EntryHeaderProps } from "./types"

function EntryHeaderImpl({ entryId, className, compact }: EntryHeaderProps) {
  return (
    <>
      <EntryHeaderRoot
        entryId={entryId}
        className={cn(
          className,
          "@container bg-background z-10 h-[55px] shrink-0 flex-col gap-0 px-3",
        )}
        compact={compact}
      >
        <div className={cn("center relative h-[55px] w-full")}>
          <EntryHeaderReadHistory className="left-0" />
          <div
            className={cn("relative z-10 flex w-full items-center justify-between gap-3")}
            data-hide-in-print
          >
            <EntryHeaderMeta />
            <EntryHeaderActionsContainer />
          </div>
        </div>
      </EntryHeaderRoot>
    </>
  )
}

export const AIEntryHeader = memo(EntryHeaderImpl)

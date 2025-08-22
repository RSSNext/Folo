import { views } from "@follow/constants"
import { cn } from "@follow/utils/utils"
import { memo } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { useEntryContentScrollToTop } from "../../../atoms"
import { EntryReadHistory } from "../../entry-read-history"
import { useEntryHeaderContext } from "./context"

function EntryHeaderReadHistoryImpl() {
  const { entryId } = useEntryHeaderContext()
  const { view } = useRouteParams()
  const isAtTop = useEntryContentScrollToTop()
  const isWide = views[view]?.wideMode
  if (!isAtTop) return null

  return (
    <div
      className={cn(
        "zen-mode-macos:left-12 text-body absolute left-5 top-0 flex h-full items-center gap-2 leading-none",
        "visible z-[11]",
        isWide && "static",
      )}
    >
      <EntryReadHistory entryId={entryId} />
    </div>
  )
}

export const EntryHeaderReadHistory = memo(EntryHeaderReadHistoryImpl)

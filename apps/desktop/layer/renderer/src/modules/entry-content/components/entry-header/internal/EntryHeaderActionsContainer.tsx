import { views } from "@follow/constants"
import { memo } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { EntryHeaderActions } from "../../../actions/header-actions"
import { MoreActions } from "../../../actions/more-actions"
import { useEntryContentScrollToTop } from "../../../atoms"
import { useEntryHeaderContext } from "./context"

function EntryHeaderActionsContainerImpl() {
  const { entryId, compact } = useEntryHeaderContext()
  const { view } = useRouteParams()
  const isAtTop = useEntryContentScrollToTop()
  const isWide = views[view]?.wideMode
  const shouldShowActions = !isWide || !isAtTop
  if (!shouldShowActions) return null

  return (
    <div className="relative flex shrink-0 items-center justify-end gap-2">
      <EntryHeaderActions entryId={entryId} view={view} compact={compact} />
      <MoreActions entryId={entryId} view={view} />
    </div>
  )
}

export const EntryHeaderActionsContainer = memo(EntryHeaderActionsContainerImpl)

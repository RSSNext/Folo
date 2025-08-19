import { memo } from "react"

import { useRouteParams } from "~/hooks/biz/useRouteParams"

import { EntryHeaderActions } from "../../../actions/header-actions"
import { MoreActions } from "../../../actions/more-actions"
import { useEntryHeaderContext } from "./context"

function EntryHeaderActionsContainerImpl() {
  const { entryId, compact } = useEntryHeaderContext()
  const { view } = useRouteParams()

  return (
    <div className="relative flex shrink-0 items-center justify-end gap-2">
      <EntryHeaderActions entryId={entryId} view={view} compact={compact} />
      <MoreActions entryId={entryId} view={view} />
    </div>
  )
}

export const EntryHeaderActionsContainer = memo(EntryHeaderActionsContainerImpl)

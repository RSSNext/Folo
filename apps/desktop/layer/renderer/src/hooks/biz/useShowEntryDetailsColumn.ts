import { getView } from "@follow/constants"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export const useShowEntryDetailsColumn = () => {
  const { view, isInEntry } = useRouteParamsSelector((s) => ({
    view: s.view,
    isInEntry: s.entryId && !s.isPendingEntry,
  }))
  const aiPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()

  return (
    !getView(view).wideMode &&
    (aiPanelStyle === AIChatPanelStyle.Floating || !isAIPanelVisible) &&
    isInEntry
  )
}

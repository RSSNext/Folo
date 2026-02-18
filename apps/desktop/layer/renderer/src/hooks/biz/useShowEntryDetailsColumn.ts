import { getView } from "@follow/constants"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export const useShowEntryDetailsColumn = () => {
  const { view } = useRouteParamsSelector((s) => ({
    view: s.view,
  }))
  const aiPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()

  return (
    !getView(view).wideMode && (aiPanelStyle === AIChatPanelStyle.Floating || !isAIPanelVisible)
  )
}

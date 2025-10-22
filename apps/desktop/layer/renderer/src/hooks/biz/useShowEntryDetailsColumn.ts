import { FeedViewType } from "@follow/constants"

import { AIChatPanelStyle, useAIChatPanelStyle, useAIPanelVisibility } from "~/atoms/settings/ai"
import { useRouteParamsSelector } from "~/hooks/biz/useRouteParams"

export const useShowEntryDetailsColumn = () => {
  const { view } = useRouteParamsSelector((s) => ({
    view: s.view,
  }))
  const aiPanelStyle = useAIChatPanelStyle()
  const isAIPanelVisible = useAIPanelVisibility()

  return (
    (view === FeedViewType.All || view === FeedViewType.Articles) &&
    (aiPanelStyle === AIChatPanelStyle.Floating || !isAIPanelVisible)
  )
}

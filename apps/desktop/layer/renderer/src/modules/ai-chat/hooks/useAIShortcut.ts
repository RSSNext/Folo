import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"

import {
  AIChatPanelStyle,
  getAIPanelVisibility,
  getAISettings,
  setAIPanelVisibility,
} from "~/atoms/settings/ai"
import { FocusablePresets } from "~/components/common/Focusable"
import { getRouteParams } from "~/hooks/biz/useRouteParams"

import { useChatActions } from "../store/hooks"
import { isTimelineSummaryAutoContext } from "./useTimelineSummaryAutoContext"

export const useAIShortcut = () => {
  const isFocus = useGlobalFocusableScopeSelector(FocusablePresets.isAIChat)

  const chatActions = useChatActions()
  useEffect(() => {
    if (!isFocus) return
    return tinykeys(document.documentElement, {
      "$mod+n": (e) => {
        e.preventDefault()
        // New chat
        const { view, entryId } = getRouteParams()
        if (isTimelineSummaryAutoContext({ view, entryId })) {
          chatActions.setTimelineSummaryManualOverride(true)
        }
        chatActions.newChat()
      },
      "$mod+w": (e) => {
        if (getAISettings().panelStyle === AIChatPanelStyle.Floating && getAIPanelVisibility()) {
          e.preventDefault()
          // close AI chat
          setAIPanelVisibility(false)
        }
      },
    })
  }, [chatActions, isFocus])
}

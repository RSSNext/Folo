import { useGlobalFocusableScopeSelector } from "@follow/components/common/Focusable/hooks.js"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"

import { setAIPanelVisibility } from "~/atoms/settings/ai"
import { FocusablePresets } from "~/components/common/Focusable"

import { useChatActions } from "../store/hooks"

export const useAIShortcut = () => {
  const isFocus = useGlobalFocusableScopeSelector(FocusablePresets.isAIChat)

  const chatActions = useChatActions()
  useEffect(() => {
    if (!isFocus) return
    return tinykeys(document.documentElement, {
      "$mod+n": (e) => {
        e.preventDefault()
        // New chat
        chatActions.newChat()
      },
      "$mod+w": (e) => {
        e.preventDefault()
        // close AI chat
        setAIPanelVisibility(false)
      },
    })
  }, [chatActions, isFocus])
}

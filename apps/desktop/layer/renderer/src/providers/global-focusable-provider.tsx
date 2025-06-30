import {
  useGlobalFocusableScopeSelector,
  useSetGlobalFocusableScope,
} from "@follow/components/common/Focusable/hooks.js"
import { useRefValue } from "@follow/hooks"
import type { EnhanceSet } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { useEffect } from "react"

import { useHasModal } from "~/components/ui/modal/stacked/hooks"
import { HotkeyScope } from "~/constants"
import { getRouteParams } from "~/hooks/biz/useRouteParams"
import { COMMAND_ID } from "~/modules/command/commands/id"

const checkIsFocusInIframe = (): boolean => {
  const { activeElement } = document
  if (!activeElement) return false

  // Check if active element is an iframe or webview
  if (activeElement.tagName === "IFRAME" || activeElement.tagName === "WEBVIEW") {
    return true
  }

  // Check if active element is inside an iframe or webview
  let parent = activeElement.parentElement
  while (parent) {
    if (parent.tagName === "IFRAME" || parent.tagName === "WEBVIEW") {
      return true
    }
    parent = parent.parentElement
  }

  return false
}

const selector = (s: EnhanceSet<string>) => s.size === 0
export const FocusableGuardProvider = () => {
  const hasNoFocusable = useGlobalFocusableScopeSelector(selector)
  const setGlobalFocusableScope = useSetGlobalFocusableScope()
  const hasModal = useHasModal()
  const hasModalRef = useRefValue(hasModal)

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout(() => {
      if (checkIsFocusInIframe()) {
        return
      }

      if (hasNoFocusable) {
        if (hasModalRef.current) {
          setGlobalFocusableScope(HotkeyScope.Modal, "append")
        } else {
          const { timelineId } = getRouteParams()

          if (timelineId) {
            EventBus.dispatch(COMMAND_ID.layout.focusToSubscription, { highlightBoundary: false })
          }
        }
      }
    }, 100)
    return () => clearTimeout(timer)
  }, [hasModalRef, hasNoFocusable, setGlobalFocusableScope])
  return null
}

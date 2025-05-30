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

const selector = (s: EnhanceSet<string>) => s.size === 0
export const FocusableGuardProvider = () => {
  const hasNoFocusable = useGlobalFocusableScopeSelector(selector)
  const setGlobalFocusableScope = useSetGlobalFocusableScope()
  const hasModal = useHasModal()
  const hasModalRef = useRefValue(hasModal)

  useEffect(() => {
    const timer: NodeJS.Timeout = setTimeout(() => {
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

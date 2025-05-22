import { useFocusable, useFocusActions } from "@follow/components/common/Focusable/hooks.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { useRefValue } from "@follow/hooks"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import type { FC } from "react"
import { memo, useEffect } from "react"

import { HotkeyScope } from "~/constants"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteEntryId } from "~/hooks/biz/useRouteParams"
import { useConditionalHotkeyScope } from "~/hooks/common"
import { useHotkeyScope } from "~/providers/hotkey-provider"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"
import { useCommandHotkey } from "../command/hooks/use-register-hotkey"

export const EntryColumnShortcutHandler: FC<{
  refetch: () => void
  data: readonly string[]
  handleScrollTo: (index: number) => void
}> = memo(({ data, refetch, handleScrollTo }) => {
  const dataRef = useRefValue(data!)

  const activeScope = useHotkeyScope()

  const when =
    activeScope.includes(HotkeyScope.Timeline) && !activeScope.includes(HotkeyScope.EntryRender)

  useCommandBinding({
    commandId: COMMAND_ID.timeline.switchToNext,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.timeline.switchToPrevious,
    when,
  })

  useCommandBinding({
    commandId: COMMAND_ID.timeline.refetch,
    when,
  })

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToEntryRender,
    shortcut: "Enter, L, ArrowRight",
    when,
  })

  useCommandHotkey({
    commandId: COMMAND_ID.layout.focusToSubscription,
    shortcut: "Backspace, Escape, H, ArrowLeft",
    when,
  })

  const currentEntryIdRef = useRefValue(useRouteEntryId())
  const navigate = useNavigateEntry()

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.timeline.switchToNext, () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex = Math.min(currentActiveEntryIndex + 1, data.length - 1)

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]

      navigate({
        entryId: nextId,
      })
    })
  }, [currentEntryIdRef, dataRef, handleScrollTo, navigate, when])

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.timeline.switchToPrevious, () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex =
        currentActiveEntryIndex === -1 ? data.length - 1 : Math.max(0, currentActiveEntryIndex - 1)

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]

      navigate({
        entryId: nextId,
      })
    })
  }, [currentEntryIdRef, dataRef, handleScrollTo, navigate])

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.timeline.refetch, () => {
      refetch()
    })
  }, [refetch])

  const $scrollArea = useScrollViewElement()
  const { highlightBoundary } = useFocusActions()
  useEffect(() => {
    return EventBus.subscribe(
      COMMAND_ID.layout.focusToTimeline,
      ({ highlightBoundary: highlight }) => {
        $scrollArea?.focus()
        if (highlight) {
          nextFrame(highlightBoundary)
        }
      },
    )
  }, [$scrollArea, highlightBoundary])

  const isFocusIn = useFocusable()

  useConditionalHotkeyScope(HotkeyScope.Timeline, isFocusIn, true)

  return null
})

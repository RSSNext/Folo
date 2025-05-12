import { useRefValue } from "@follow/hooks"
import { EventBus } from "@follow/utils/event-bus"
import type { FC } from "react"
import { memo, useEffect, useLayoutEffect, useState } from "react"

import { useMainContainerElement } from "~/atoms/dom"
import { HotkeyScope } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteEntryId } from "~/hooks/biz/useRouteParams"
import { useConditionalHotkeyScope } from "~/hooks/common"
import { useHotkeyScope } from "~/providers/hotkey-provider"

import { COMMAND_ID } from "../command/commands/id"
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

  useCommandHotkey({
    shortcut: shortcuts.entries.next.key,
    commandId: COMMAND_ID.timeline.switchToNext,
    when,
  })

  useCommandHotkey({
    shortcut: shortcuts.entries.previous.key,
    commandId: COMMAND_ID.timeline.switchToPrevious,
    when,
  })

  useCommandHotkey({
    shortcut: shortcuts.entries.refetch.key,
    commandId: COMMAND_ID.timeline.refetch,
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
  }, [currentEntryIdRef, dataRef, handleScrollTo, navigate])

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

  const $mainContainer = useMainContainerElement()
  const [isFocusIn, setIsFocusIn] = useState(false)

  useConditionalHotkeyScope(HotkeyScope.Timeline, isFocusIn, true)

  // Enable arrow key navigation shortcuts only when focus is on entryContent or entryList,
  // entryList shortcuts should not be triggered in the feed col
  useLayoutEffect(() => {
    if (!$mainContainer) return
    const handler = () => {
      const target = document.activeElement

      const isFocusIn = $mainContainer.contains(target) || $mainContainer === target

      setIsFocusIn(isFocusIn)
    }

    handler()
    // NOTE: focusin event will bubble to the document
    document.addEventListener("focusin", handler)
    document.addEventListener("focusout", handler)
    return () => {
      document.removeEventListener("focusin", handler)
      document.removeEventListener("focusout", handler)
    }
  }, [$mainContainer])

  return null
})

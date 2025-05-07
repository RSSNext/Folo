import { useRefValue } from "@follow/hooks"
import type { FC } from "react"
import { memo, useLayoutEffect, useState } from "react"
import { useHotkeys } from "react-hotkeys-hook"

import { useMainContainerElement } from "~/atoms/dom"
import { HotKeyScopeMap } from "~/constants"
import { shortcuts } from "~/constants/shortcuts"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { useRouteEntryId } from "~/hooks/biz/useRouteParams"

export const EntryColumnShortcutHandler: FC<{
  refetch: () => void
  data: readonly string[]
  handleScrollTo: (index: number) => void
}> = memo(({ data, refetch, handleScrollTo }) => {
  const dataRef = useRefValue(data!)

  useHotkeys(
    shortcuts.entries.refetch.key,
    () => {
      refetch()
    },
    { scopes: HotKeyScopeMap.Home },
  )
  const currentEntryIdRef = useRefValue(useRouteEntryId())

  const navigate = useNavigateEntry()

  const $mainContainer = useMainContainerElement()
  const [enabledArrowKey, setEnabledArrowKey] = useState(false)

  // Enable arrow key navigation shortcuts only when focus is on entryContent or entryList,
  // entryList shortcuts should not be triggered in the feed col
  useLayoutEffect(() => {
    if (!$mainContainer) return
    const handler = () => {
      const target = document.activeElement
      const isFocusIn = $mainContainer.contains(target) || $mainContainer === target

      setEnabledArrowKey(isFocusIn)
    }

    handler()
    // NOTE: focusin event will bubble to the document
    document.addEventListener("focusin", handler)
    return () => {
      document.removeEventListener("focusin", handler)
    }
  }, [$mainContainer])

  useHotkeys(
    shortcuts.entries.next.key,
    () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex = Math.min(currentActiveEntryIndex + 1, data.length - 1)

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]

      navigate({
        entryId: nextId,
      })
    },
    { scopes: HotKeyScopeMap.Home, enabled: enabledArrowKey, preventDefault: true },
  )
  useHotkeys(
    shortcuts.entries.previous.key,
    () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex =
        currentActiveEntryIndex === -1 ? data.length - 1 : Math.max(0, currentActiveEntryIndex - 1)

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]

      navigate({
        entryId: nextId,
      })
    },
    { scopes: HotKeyScopeMap.Home, enabled: enabledArrowKey, preventDefault: true },
  )
  return null
})

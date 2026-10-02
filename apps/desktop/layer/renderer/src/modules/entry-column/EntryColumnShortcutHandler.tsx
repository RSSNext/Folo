import {
  useFocusActions,
  useGlobalFocusableScopeSelector,
} from "@follow/components/common/Focusable/hooks.js"
import { useScrollViewElement } from "@follow/components/ui/scroll-area/hooks.js"
import { useRefValue } from "@follow/hooks"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import type { FC } from "react"
import { memo, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "sonner"

import { FocusablePresets } from "~/components/common/Focusable"
import { useNavigateEntry } from "~/hooks/biz/useNavigateEntry"
import { getRouteParams, useRouteEntryId } from "~/hooks/biz/useRouteParams"

import { COMMAND_ID } from "../command/commands/id"
import { useCommandBinding } from "../command/hooks/use-command-binding"
import { useCommandHotkey } from "../command/hooks/use-register-hotkey"

export const EntryColumnShortcutHandler: FC<{
  refetch: () => void
  data: readonly string[]
  handleScrollTo: (index: number) => void
}> = memo(({ data, refetch, handleScrollTo }) => {
  const { t } = useTranslation()
  const dataRef = useRefValue(data!)

  const when = useGlobalFocusableScopeSelector(FocusablePresets.isTimeline)

  const currentEntryIdRef = useRefValue(useRouteEntryId())
  const navigate = useNavigateEntry()

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

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.timeline.switchToNext, () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex = Math.min(currentActiveEntryIndex + 1, data.length - 1)

      if (currentActiveEntryIndex === nextIndex) {
        toast.info(t("entry_list.already_at_last_entry"))
        return
      }

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]
      const { view } = getRouteParams()

      navigate({
        entryId: nextId,
        view,
      })
    })
  }, [currentEntryIdRef, dataRef, handleScrollTo, navigate, t, when])

  useEffect(() => {
    return EventBus.subscribe(COMMAND_ID.timeline.switchToPrevious, () => {
      const data = dataRef.current
      const currentActiveEntryIndex = data.indexOf(currentEntryIdRef.current || "")

      const nextIndex =
        currentActiveEntryIndex === -1 ? data.length - 1 : Math.max(0, currentActiveEntryIndex - 1)

      if (currentActiveEntryIndex === nextIndex) {
        toast.info(t("entry_list.already_at_first_entry"))
        return
      }

      handleScrollTo(nextIndex)
      const nextId = data![nextIndex]

      const { view } = getRouteParams()

      navigate({
        entryId: nextId,
        view,
      })
    })
  }, [currentEntryIdRef, dataRef, handleScrollTo, navigate, t])

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

  return null
})

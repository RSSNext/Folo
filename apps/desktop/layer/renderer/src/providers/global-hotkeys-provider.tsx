import { highlightElement } from "@follow/components/common/Focusable/utils.js"
import { nextFrame } from "@follow/utils/dom"
import { EventBus } from "@follow/utils/event-bus"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"
import { useEventListener } from "usehooks-ts"

import { HotkeyScope } from "~/constants/hotkeys"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-command-binding"

import { useHotkeyScope } from "./hotkey-provider"

export const GlobalHotkeysProvider = () => {
  const activeScopes = useHotkeyScope()

  useCommandBinding({
    commandId: COMMAND_ID.global.showShortcuts,
  })

  useEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      nextFrame(() => {
        if (
          document.activeElement instanceof HTMLInputElement ||
          document.activeElement instanceof HTMLTextAreaElement
        ) {
          return
        }
        highlightElement(document.activeElement as HTMLElement)
      })
    }
  })

  // Re force to sidebar focusable
  useEventListener("focusin", (e) => {
    if (
      activeScopes.length === 1 &&
      activeScopes[0] === HotkeyScope.Home &&
      e.target === document.body
    ) {
      EventBus.dispatch(COMMAND_ID.layout.focusToTimeline)
    }
  })
  // Re force to sidebar focusable
  useEventListener("focusout", () => {
    const { activeElement } = document
    if (
      activeElement === document.body &&
      activeScopes.length === 1 &&
      activeScopes[0] === HotkeyScope.Home
    ) {
      EventBus.dispatch(COMMAND_ID.layout.focusToTimeline)
    }
  })

  // Show current focused element
  useEffect(() => {
    return tinykeys(window, {
      "$mod+Period": () => {
        highlightElement(document.activeElement as HTMLElement)
      },
    })
  }, [])

  return null
}

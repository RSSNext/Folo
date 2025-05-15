import { highlightElement } from "@follow/components/common/Focusable/utils.js"
import { nextFrame } from "@follow/utils/dom"
import { useEventListener } from "usehooks-ts"

import { HotkeyScope } from "~/constants/hotkeys"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandBinding } from "~/modules/command/hooks/use-register-hotkey"

import { useHotkeyScope } from "./hotkey-provider"

export const GlobalHotkeysProvider = () => {
  const activeScopes = useHotkeyScope()

  useCommandBinding({
    commandId: COMMAND_ID.global.showShortcuts,
    when:
      activeScopes.includes(HotkeyScope.Home) && !activeScopes.includes(HotkeyScope.EntryRender),
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

  return null
}

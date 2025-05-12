import { HotkeyScope } from "~/constants/hotkeys"
import { shortcuts } from "~/constants/shortcuts"
import { COMMAND_ID } from "~/modules/command/commands/id"
import { useCommandHotkey } from "~/modules/command/hooks/use-register-hotkey"

import { useHotkeyScope } from "./hotkey-provider"

export const GlobalHotkeysProvider = () => {
  const activeScopes = useHotkeyScope()

  useCommandHotkey({
    commandId: COMMAND_ID.global.showShortcuts,
    shortcut: shortcuts.layout.showShortcuts.key,
    when: activeScopes.includes(HotkeyScope.Home),
  })

  return null
}

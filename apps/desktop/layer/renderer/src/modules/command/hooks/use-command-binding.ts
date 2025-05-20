import type { BindingCommandId } from "./use-command-shortcut"
import { useCommandShortcut } from "./use-command-shortcut"
import type { RegisterHotkeyOptions } from "./use-register-hotkey"
import { useCommandHotkey } from "./use-register-hotkey"

export const useCommandBinding = <T extends BindingCommandId>({
  commandId,
  when = true,
  args,
}: Omit<RegisterHotkeyOptions<T>, "shortcut">) => {
  const commandShortcut = useCommandShortcut(commandId)

  return useCommandHotkey({
    shortcut: commandShortcut,
    commandId,
    when,
    args,
  })
}

import { useHotkeys } from "react-hotkeys-hook"

import type { FollowCommand, FollowCommandId } from "../types"
import { getCommand } from "./use-command"

interface RegisterHotkeyOptions<T extends FollowCommandId> {
  shortcut: string
  commandId: T
  args?: Parameters<Extract<FollowCommand, { id: T }>["run"]>
  when?: boolean
  // hotkeyOptions?: Options
}

export const useCommandHotkey = <T extends FollowCommandId>({
  shortcut,
  commandId,
  when,
  args,
}: RegisterHotkeyOptions<T>) => {
  useHotkeys(
    shortcut,
    () => {
      const command = getCommand(commandId)

      if (!command) return
      if (Array.isArray(args)) {
        // It should be safe to spread the args here because we are checking if it is an array
        // @ts-expect-error - A spread argument must either have a tuple type or be passed to a rest parameter.ts(2556)
        command.run(...args)
        return
      }
      if (args === undefined) {
        // @ts-expect-error
        command.run()
        return
      }
      console.error("Invalid args", typeof args, args)
    },
    {
      enabled: when,
    },
  )
}

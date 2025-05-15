import { useEffect } from "react"
import { tinykeys } from "tinykeys"

import type { FollowCommand, FollowCommandId } from "../types"
import { getCommand } from "./use-command"
import type { BindingCommandId } from "./use-command-shortcut"
import { useCommandShortcut } from "./use-command-shortcut"

interface RegisterHotkeyOptions<T extends FollowCommandId> {
  shortcut: string
  commandId: T
  args?: Parameters<Extract<FollowCommand, { id: T }>["run"]>
  when?: boolean
}

export const useCommandHotkey = <T extends FollowCommandId>({
  shortcut,
  commandId,
  when,
  args,
}: RegisterHotkeyOptions<T>) => {
  useEffect(() => {
    if (!when) {
      return
    }

    if (!shortcut) {
      return
    }

    // Handle comma-separated shortcuts
    const shortcuts = shortcut.split(",").map((s) => s.trim())
    const keyMap: Record<string, (event: KeyboardEvent) => void> = {}

    // Create a handler for each shortcut
    shortcuts.forEach((key) => {
      keyMap[key] = (event) => {
        event.preventDefault()
        event.stopPropagation()

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
      }
    })

    return tinykeys(document.documentElement, keyMap)
  }, [shortcut, commandId, when, args])
}

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

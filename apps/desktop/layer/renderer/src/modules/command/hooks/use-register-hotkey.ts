import { useRefValue } from "@follow/hooks"
import { checkIsEditableElement } from "@follow/utils/dom"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"

import type { FollowCommand, FollowCommandId } from "../types"
import { getCommand } from "./use-command"

export interface HotkeyOptions {
  forceInputElement?: true
}
export interface RegisterHotkeyOptions<T extends FollowCommandId> {
  shortcut: string
  commandId: T
  args?: Parameters<Extract<FollowCommand, { id: T }>["run"]>
  when?: boolean

  options?: HotkeyOptions
}

const SPECIAL_KEYS_MAPPINGS = {
  "?": "Shift+Slash",
}

export const useCommandHotkey = <T extends FollowCommandId>({
  shortcut,
  commandId,
  when,
  args,
  options,
}: RegisterHotkeyOptions<T>) => {
  const argsRef = useRefValue(args)
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
      let nextKey = key

      if (SPECIAL_KEYS_MAPPINGS[key]) {
        nextKey = SPECIAL_KEYS_MAPPINGS[key]
      }

      keyMap[nextKey] = (event) => {
        const { target } = event

        if (!options?.forceInputElement && checkIsEditableElement(target as HTMLElement)) {
          return
        }

        event.preventDefault()
        event.stopPropagation()

        const command = getCommand(commandId)
        if (!command) return
        const args = argsRef.current
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
  }, [shortcut, commandId, when, argsRef, options?.forceInputElement])
}

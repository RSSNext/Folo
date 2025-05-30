import { highlightElement } from "@follow/components/common/Focusable/utils.js"
import {
  checkIsEditableElement,
  nextFrame,
  preventDefault,
  stopPropagation,
} from "@follow/utils/dom"
import { useEffect } from "react"
import { tinykeys } from "tinykeys"
import { useEventListener } from "usehooks-ts"

import { COMMAND_ID } from "~/modules/command/commands/id"
import { useRunCommandFn } from "~/modules/command/hooks/use-command"
import { useCommandBinding, useCommandShortcuts } from "~/modules/command/hooks/use-command-binding"

export const GlobalHotkeysProvider = () => {
  useCommandBinding({
    commandId: COMMAND_ID.global.showShortcuts,
  })

  useEventListener("keydown", (e) => {
    if (e.key === "Tab") {
      nextFrame(() => {
        if (checkIsEditableElement(e.target as HTMLElement)) {
          return
        }
        highlightElement(document.activeElement as HTMLElement)
      })
    }
  })

  const commandShortcuts = useCommandShortcuts()

  const runCommandFn = useRunCommandFn()
  useEffect(() => {
    const preHandler = (e: Event) => {
      stopPropagation(e)
      preventDefault(e)
    }
    return tinykeys(window, {
      // Show current focused element
      "$mod+Period": (e) => {
        preHandler(e)
        highlightElement(document.activeElement as HTMLElement)
      },
      [commandShortcuts[COMMAND_ID.layout.toggleZenMode]]: (e) => {
        preHandler(e)
        runCommandFn(COMMAND_ID.layout.toggleZenMode, [])()
      },
    })
  }, [commandShortcuts, runCommandFn])

  return null
}

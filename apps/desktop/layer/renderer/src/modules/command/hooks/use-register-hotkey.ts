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

// Elements the browser itself acts on with Space or Enter: it presses them or types into them
const KEY_HANDLING_ELEMENTS =
  "button, input, select, summary, textarea, [contenteditable]:not([contenteditable='false'])"
// A link follows Enter only. Space does nothing to it, so the app's Space shortcut keeps working
// while a link has the focus, such as a timeline entry that was just clicked.
const ENTER_HANDLING_ELEMENTS = "a[href]"
// Controls that Tab and Shift+Tab move the focus away from, so keyboard users can go from one to
// the next. The draggable rows of the subscription list only look like buttons to assistive
// technology and keep Tab for switching views.
const TAB_HANDLING_ELEMENTS = [
  KEY_HANDLING_ELEMENTS,
  ENTER_HANDLING_ELEMENTS,
  ...[
    "link",
    "menuitem",
    "menuitemcheckbox",
    "menuitemradio",
    "switch",
    "checkbox",
    "radio",
    "tab",
    "option",
    "slider",
    "spinbutton",
    "combobox",
    "textbox",
    "searchbox",
  ].map((role) => `[role='${role}']`),
].join(", ")

// Key presses a shortcut of this module ran a command for
const commandEvents = new WeakSet<Event>()

/**
 * Space, Enter or Tab on a focused control or field belongs to it. A single-key shortcut on those
 * keys would otherwise press the wrong thing, such as toggling the audio player instead of opening
 * the focused menu button, or switching the timeline view instead of moving the focus to the next
 * control. Controls built from other elements count once they handled the key themselves.
 */
export const isKeyForFocusedControl = (event: KeyboardEvent) => {
  const { key } = event
  if (key !== " " && key !== "Enter" && key !== "Tab") return false
  if (event.metaKey || event.ctrlKey || event.altKey) return false
  if (event.defaultPrevented && !commandEvents.has(event)) return true
  const { target } = event
  if (!(target instanceof Element)) return false
  if (key === "Tab") return target.matches(TAB_HANDLING_ELEMENTS)
  if (target.matches(KEY_HANDLING_ELEMENTS)) return true
  return key === "Enter" && target.matches(ENTER_HANDLING_ELEMENTS)
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

        if (
          !options?.forceInputElement &&
          (checkIsEditableElement(target as HTMLElement) || isKeyForFocusedControl(event))
        ) {
          return
        }

        commandEvents.add(event)
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

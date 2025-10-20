import { getAISettings } from "~/atoms/settings/ai"

import type { ShortcutData } from "../types"

export function getShortcutTextValue(shortcutData: ShortcutData): string {
  return `<shortcut id="${shortcutData.id}"></shortcut>`
}

export function getShortcutDisplayTextValue(shortcutData: ShortcutData): string {
  const allShortcuts = getAISettings().shortcuts ?? []
  const matchedShortcut = allShortcuts.find((shortcut) => shortcut.id === shortcutData.id)
  return matchedShortcut?.name ?? shortcutData.name
}

export function getShortcutMarkdownValue(shortcutId: string): string {
  const allShortcuts = getAISettings().shortcuts ?? []
  const matchedShortcut = allShortcuts.find((shortcut) => shortcut.id === shortcutId)
  return matchedShortcut ? `#${matchedShortcut.name}` : `#${shortcutId}`
}

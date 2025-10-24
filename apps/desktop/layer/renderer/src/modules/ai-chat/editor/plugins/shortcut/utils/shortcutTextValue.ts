import { getAISettings, getShortcutEffectivePrompt } from "~/atoms/settings/ai"

import type { ShortcutData } from "../types"

export function getShortcutTextValue(shortcutData: ShortcutData): string {
  const allShortcuts = getAISettings().shortcuts ?? []
  const matchedShortcut = allShortcuts.find((shortcut) => shortcut.id === shortcutData.id)
  if (matchedShortcut) {
    return getShortcutEffectivePrompt(matchedShortcut)
  }
  return shortcutData.prompt
}

export function getShortcutDisplayTextValue(shortcutData: ShortcutData): string {
  const allShortcuts = getAISettings().shortcuts ?? []
  const matchedShortcut = allShortcuts.find((shortcut) => shortcut.id === shortcutData.id)
  return matchedShortcut?.name ?? shortcutData.name
}

export function getShortcutMarkdownValue(shortcutId: string): string {
  const allShortcuts = getAISettings().shortcuts ?? []
  const matchedShortcut = allShortcuts.find((shortcut) => shortcut.id === shortcutId)
  return matchedShortcut ? `/${matchedShortcut.name}` : `/${shortcutId}`
}

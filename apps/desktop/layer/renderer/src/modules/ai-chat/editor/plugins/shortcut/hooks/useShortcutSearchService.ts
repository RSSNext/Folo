import { useMemo } from "react"

import { getShortcutEffectivePrompt, useAISettingValue } from "~/atoms/settings/ai"

import type { ShortcutData } from "../types"

export const useShortcutSearchService = () => {
  const aiSettings = useAISettingValue()

  const searchShortcuts = useMemo(() => {
    const shortcuts = (aiSettings.shortcuts ?? []).filter((shortcut) => shortcut.enabled)

    const normalizedShortcuts: ShortcutData[] = shortcuts.map((shortcut) => ({
      id: shortcut.id,
      name: shortcut.name,
      prompt: getShortcutEffectivePrompt(shortcut),
      hotkey: shortcut.hotkey,
      displayTargets: shortcut.displayTargets,
    }))

    return async (query: string): Promise<ShortcutData[]> => {
      const trimmedQuery = query.trim().toLowerCase()

      if (!trimmedQuery) {
        return normalizedShortcuts
      }

      return normalizedShortcuts.filter((shortcut) => {
        const normalizedName = shortcut.name.toLowerCase()
        return normalizedName.includes(trimmedQuery)
      })
    }
  }, [aiSettings.shortcuts])

  return { searchShortcuts }
}

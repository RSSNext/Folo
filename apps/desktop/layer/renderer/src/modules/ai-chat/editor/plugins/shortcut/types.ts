import type { AIShortcutTarget } from "@follow/shared/settings/interface"

export interface ShortcutData {
  id: string
  name: string
  prompt: string

  hotkey?: string
  displayTargets?: readonly AIShortcutTarget[]
}

export interface ShortcutMetadata {
  id: string
  name: string
}

export interface ShortcutMatch {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

export interface ShortcutSearchState {
  suggestions: ShortcutData[]
  selectedIndex: number
  isLoading: boolean
}

export interface ShortcutTriggerState {
  shortcutMatch: ShortcutMatch | null
  isActive: boolean
}

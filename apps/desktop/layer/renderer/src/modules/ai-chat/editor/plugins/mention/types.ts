export type MentionType = "entry" | "feed" | "date" | "category" | "view" | "shortcut"

export type MentionLabelValue = string | number | boolean | MentionLabelDescriptor

export interface MentionLabelDescriptor {
  key: I18nKeysForAi
  values?: Record<string, MentionLabelValue>
}

export interface MentionData {
  id: string
  name: string
  type: MentionType
  value: unknown
  label?: MentionLabelDescriptor
  labelOptions?: {
    appendRange?: boolean
  }
}

export interface MentionMatch {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

export interface MentionDropdownPosition {
  top: number
  left: number
}

export interface MentionSearchState {
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
}

export interface MentionTriggerState {
  mentionMatch: MentionMatch | null
  isActive: boolean
}

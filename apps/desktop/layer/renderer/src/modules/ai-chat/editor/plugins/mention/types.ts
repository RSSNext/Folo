export type MentionType = "entry" | "feed"

export interface MentionData {
  id: string
  name: string
  type: MentionType
  value: unknown
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

import type { LexicalEditor } from "lexical"

export type MentionType = "entry" | "feed"

export interface MentionData {
  id: string
  name: string
  type: MentionType
}

export interface MentionMatch {
  leadOffset: number
  matchingString: string
  replaceableString: string
}

export interface MentionPluginProps {
  onSearch?: (query: string, type: MentionType) => Promise<MentionData[]> | MentionData[]

  maxSuggestions?: number
  triggerFn?: (text: string, editor: LexicalEditor) => MentionMatch | null
  onMentionInsert?: (mention: MentionData) => void
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

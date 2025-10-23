import type { FeedViewType } from "@follow-app/client-sdk"

export type MentionLabelValue = string | number | boolean | MentionLabelDescriptor

export interface MentionLabelDescriptor {
  key: I18nKeysForAi
  values?: Record<string, MentionLabelValue>
}

export interface MentionBaseData {
  id: string
  name: string
  text: string
  label?: MentionLabelDescriptor
}

export interface EntryMentionData extends MentionBaseData {
  type: "entry"
  value: string
}

export interface FeedMentionData extends MentionBaseData {
  type: "feed"
  value: string
}

export interface DateMentionData extends MentionBaseData {
  type: "date"
  value: string
  labelOptions?: {
    appendRange?: boolean
  }
}

export interface CategoryMentionData extends MentionBaseData {
  type: "category"
  value: string
}

export interface ViewMentionData extends MentionBaseData {
  type: "view"
  value: FeedViewType
}

export type MentionData =
  | EntryMentionData
  | FeedMentionData
  | DateMentionData
  | CategoryMentionData
  | ViewMentionData

export type MentionType = MentionData["type"]

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

import type { LexicalEditor } from "lexical"

// Mention functionality moved to desktop app
// import type { MentionData, MentionType } from "../plugins/mention"

// Temporary type definitions to avoid breaking imports
export type MentionType = "entry" | "feed"
export interface MentionData {
  id: string
  name: string
  type: MentionType
  value: unknown
}

/**
 * Configuration for mention system
 */
export interface MentionConfig {
  /** Enabled mention types */
  enabledTypes: MentionType[]
  /** Maximum number of suggestions to show */
  maxSuggestions: number
  /** Minimum characters to trigger search */
  minSearchLength: number
  /** Search debounce delay in milliseconds */
  searchDebounce: number
  /** Custom trigger patterns */
  triggerPatterns?: Record<MentionType, RegExp>
  /** Enable avatars in suggestions */
  showAvatars: boolean
  /** Enable descriptions in suggestions */
  showDescriptions: boolean
  /** Custom CSS classes */
  classNames?: {
    dropdown?: string
    suggestion?: string
    selectedSuggestion?: string
    mention?: string
  }
}

/**
 * Search function for finding mention candidates
 */
export type MentionSearchFunction = (
  query: string,
  type: MentionType,
  context?: {
    editor: LexicalEditor
    currentSelection?: any
  },
) => Promise<MentionData[]> | MentionData[]

/**
 * Trigger function for detecting mention patterns
 */
export type MentionTriggerFunction = (
  text: string,
  editor: LexicalEditor,
) => {
  leadOffset: number
  matchingString: string
  replaceableString: string
  type?: MentionType
} | null

/**
 * Event handlers for mention system
 */
export interface MentionEventHandlers {
  /** Called when a mention is inserted */
  onMentionInsert?: (mention: MentionData, context: { editor: LexicalEditor }) => void
  /** Called when a mention is clicked */
  onMentionClick?: (mention: MentionData, context: { editor: LexicalEditor }) => void
  /** Called when a mention is removed */
  onMentionRemove?: (mention: MentionData, context: { editor: LexicalEditor }) => void
  /** Called when mention search is triggered */
  onMentionSearch?: (query: string, type: MentionType) => void
  /** Called when mention dropdown is shown/hidden */
  onDropdownToggle?: (isVisible: boolean, context: { query?: string; type?: MentionType }) => void
}

/**
 * Mention plugin options
 */
export interface MentionPluginOptions extends MentionEventHandlers {
  /** Search function for mentions */
  onSearch?: MentionSearchFunction
  /** Custom trigger function */
  triggerFn?: MentionTriggerFunction
  /** Configuration options */
  config?: Partial<MentionConfig>
}

/**
 * Mention dropdown state
 */
export interface MentionDropdownState {
  isVisible: boolean
  suggestions: MentionData[]
  selectedIndex: number
  isLoading: boolean
  query: string
  type?: MentionType
  position?: {
    top: number
    left: number
  }
}

/**
 * Mention context for React components
 */
export interface MentionContextValue {
  config: MentionConfig
  state: MentionDropdownState
  actions: {
    search: (query: string, type: MentionType) => Promise<void>
    selectMention: (mention: MentionData) => void
    navigateUp: () => void
    navigateDown: () => void
    closeSuggestions: () => void
  }
}

/**
 * Mention filter function
 */
export type MentionFilterFunction = (
  mentions: MentionData[],
  query: string,
  type: MentionType,
) => MentionData[]

/**
 * Mention transformer for custom formats
 */
export interface MentionTransformer {
  /** Transform mention data for display */
  toDisplay: (mention: MentionData) => string
  /** Transform display text back to mention data */
  fromDisplay: (text: string) => MentionData | null
  /** Check if text matches this transformer */
  test: (text: string) => boolean
}

/**
 * Default mention configuration
 */
export const DEFAULT_MENTION_CONFIG: MentionConfig = {
  enabledTypes: ["feed", "entry"],
  maxSuggestions: 10,
  minSearchLength: 1,
  searchDebounce: 150,
  showAvatars: true,
  showDescriptions: true,
}

/**
 * Mention keyboard shortcuts
 */
export const MENTION_SHORTCUTS = {
  NAVIGATE_UP: "ArrowUp",
  NAVIGATE_DOWN: "ArrowDown",
  SELECT: "Enter",
  SELECT_ALT: "Tab",
  CANCEL: "Escape",
} as const

/**
 * Mention event types
 */
export enum MentionEventType {
  INSERT = "mention:insert",
  CLICK = "mention:click",
  REMOVE = "mention:remove",
  SEARCH = "mention:search",
  DROPDOWN_TOGGLE = "mention:dropdown_toggle",
}

/**
 * Mention validation rules
 */
export interface MentionValidationRules {
  /** Minimum name length */
  minNameLength?: number
  /** Maximum name length */
  maxNameLength?: number
  /** Allowed characters pattern */
  namePattern?: RegExp
  /** Required fields */
  requiredFields?: (keyof MentionData)[]
  /** Custom validation function */
  customValidator?: (mention: MentionData) => boolean | string
}

/**
 * Mention accessibility options
 */
export interface MentionA11yOptions {
  /** ARIA label for mentions */
  mentionLabel?: string | ((mention: MentionData) => string)
  /** ARIA label for dropdown */
  dropdownLabel?: string
  /** ARIA label for suggestions */
  suggestionLabel?: string | ((mention: MentionData, index: number) => string)
  /** Screen reader announcements */
  announcements?: {
    onDropdownOpen?: string
    onDropdownClose?: string
    onSelection?: string | ((mention: MentionData) => string)
    onNavigation?: string | ((direction: "up" | "down", index: number) => string)
  }
}

import { createCommand } from "lexical"

import type { MentionData, MentionType } from "./types"

// Commands
export const MENTION_COMMAND = createCommand<MentionData>("MENTION_COMMAND")
export const MENTION_TYPEAHEAD_COMMAND = createCommand<string>("MENTION_TYPEAHEAD_COMMAND")

// Default configuration
export const DEFAULT_MENTION_TYPES: MentionType[] = ["feed", "entry"]
export const DEFAULT_MAX_SUGGESTIONS = 10

// Mock data for demonstration
export const MOCK_MENTION_DATA: Record<MentionType, MentionData[]> = {
  feed: [
    { id: "1", name: "Feed One", type: "feed" },
    { id: "2", name: "Feed Two", type: "feed" },
  ],
  entry: [
    { id: "3", name: "Entry One", type: "entry" },
    { id: "4", name: "Entry Two", type: "entry" },
  ],
}

// Trigger patterns
export const MENTION_TRIGGER_PATTERN = /(?:^|\s)(@[\w-]*)$/
export const FEED_MENTION_PATTERN = /(?:^|\s)(@#[\w-]*)$/
export const ENTRY_MENTION_PATTERN = /(?:^|\s)(@\+[\w-]*)$/
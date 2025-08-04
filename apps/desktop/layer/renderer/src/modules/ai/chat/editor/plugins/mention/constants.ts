import { createCommand } from "lexical"

import type { MentionData } from "./types"

// Commands
export const MENTION_COMMAND = createCommand<MentionData>("MENTION_COMMAND")
export const MENTION_TYPEAHEAD_COMMAND = createCommand<string>("MENTION_TYPEAHEAD_COMMAND")

// Default configuration

export const DEFAULT_MAX_SUGGESTIONS = 10

// Trigger patterns
export const MENTION_TRIGGER_PATTERN = /(?:^|\s)(@[\w-]*)$/
export const FEED_MENTION_PATTERN = /(?:^|\s)(@#[\w-]*)$/
export const ENTRY_MENTION_PATTERN = /(?:^|\s)(@\+[\w-]*)$/

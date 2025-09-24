import { createCommand } from "lexical"

import type { MentionData } from "./types"

// Commands
export const MENTION_COMMAND = createCommand<MentionData>("MENTION_COMMAND")
export const MENTION_TYPEAHEAD_COMMAND = createCommand<string>("MENTION_TYPEAHEAD_COMMAND")

// Default configuration

export const DEFAULT_MAX_SUGGESTIONS = 10

// Trigger patterns
// Support CJK characters (Chinese, Japanese, Korean) in addition to ASCII
export const MENTION_TRIGGER_PATTERN =
  /(?:^|\s)(@[#+]?[\w\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af-]*)$/

import { createCommand } from "lexical"

import type { ShortcutData } from "./types"

export const SHORTCUT_COMMAND = createCommand<ShortcutData>("SHORTCUT_COMMAND")

export const DEFAULT_MAX_SHORTCUT_SUGGESTIONS = 10

export const SHORTCUT_TRIGGER_PATTERN =
  /(?:^|\s)(\/[\w\-\s\u4E00-\u9FFF\u3400-\u4DBF\u3040-\u309F\u30A0-\u30FF\uAC00-\uD7AF]*)$/

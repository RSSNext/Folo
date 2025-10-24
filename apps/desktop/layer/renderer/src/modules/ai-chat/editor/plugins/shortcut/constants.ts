import { createCommand } from "lexical"

import type { ShortcutData } from "./types"

export const SHORTCUT_COMMAND = createCommand<ShortcutData>("SHORTCUT_COMMAND")

export const DEFAULT_MAX_SHORTCUT_SUGGESTIONS = 10

export const SHORTCUT_TRIGGER_PATTERN =
  /(?:^|\s)(\/[\w\-\s\u4e00-\u9fff\u3400-\u4dbf\u3040-\u309f\u30a0-\u30ff\uac00-\ud7af]*)$/

import type { LexicalEditor } from "lexical"

import { useTextTrigger } from "../../shared/hooks/useTextTrigger"
import type { ShortcutMatch } from "../types"
import { defaultShortcutTriggerFn } from "../utils/triggerDetection"

interface UseShortcutTriggerOptions {
  triggerFn?: (text: string, editor: LexicalEditor) => ShortcutMatch | null
  onTrigger?: (match: ShortcutMatch | null) => void
}

export const useShortcutTrigger = ({
  triggerFn = defaultShortcutTriggerFn,
  onTrigger,
}: UseShortcutTriggerOptions = {}) => {
  const { match, isActive, clear } = useTextTrigger({ triggerFn, onTrigger })
  return { shortcutMatch: match as ShortcutMatch | null, isActive, clearShortcutMatch: clear }
}

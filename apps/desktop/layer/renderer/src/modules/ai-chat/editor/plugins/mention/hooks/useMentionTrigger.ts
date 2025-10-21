import type { LexicalEditor } from "lexical"

import { useTextTrigger } from "../../shared/hooks/useTextTrigger"
import type { MentionMatch } from "../types"
import { defaultTriggerFn } from "../utils/triggerDetection"

interface UseMentionTriggerOptions {
  triggerFn?: (text: string, editor: LexicalEditor) => MentionMatch | null
  onTrigger?: (match: MentionMatch | null) => void
}

export const useMentionTrigger = ({
  triggerFn = defaultTriggerFn,
  onTrigger,
}: UseMentionTriggerOptions = {}) => {
  const { match, isActive, clear } = useTextTrigger({ triggerFn, onTrigger })
  return { mentionMatch: match as MentionMatch | null, isActive, clearMentionMatch: clear }
}

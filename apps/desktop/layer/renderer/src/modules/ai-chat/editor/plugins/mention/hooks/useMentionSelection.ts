import { useTypeaheadSelection } from "../../shared/hooks/useTypeaheadSelection"
import { MENTION_COMMAND } from "../constants"
import type { MentionData, MentionMatch } from "../types"
import { insertMentionNode } from "../utils/textReplacement"

interface UseMentionSelectionOptions {
  mentionMatch: MentionMatch | null
  onMentionInsert?: (mention: MentionData, nodeKey?: string) => void
  onSelectionComplete?: () => void
}

export const useMentionSelection = ({
  mentionMatch,
  onMentionInsert,
  onSelectionComplete,
}: UseMentionSelectionOptions) => {
  const { selectItem } = useTypeaheadSelection<MentionMatch, MentionData>({
    match: mentionMatch,
    command: MENTION_COMMAND,
    replaceWith: (item, match) => insertMentionNode(item, match),
    onInsert: onMentionInsert,
    onComplete: onSelectionComplete,
  })

  return { selectMention: selectItem }
}

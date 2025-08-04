import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"

import { MENTION_TRIGGER_PATTERN } from "../constants"
import type { MentionMatch, MentionType } from "../types"

export const defaultTriggerFn = (): MentionMatch | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null
  }

  const { anchor } = selection
  const { focus } = selection
  const anchorNode = anchor.getNode()

  // Only trigger on text nodes
  if (!$isTextNode(anchorNode) || anchor.key !== focus.key || anchor.offset !== focus.offset) {
    return null
  }

  const textContent = anchorNode.getTextContent()
  const cursorOffset = anchor.offset

  // Look for @ symbol followed by text
  const mentionMatch = textContent.slice(0, cursorOffset).match(MENTION_TRIGGER_PATTERN)

  if (!mentionMatch) {
    return null
  }

  const matchingString = mentionMatch[1] || ""
  const replaceableString = matchingString
  const leadOffset = (mentionMatch.index ?? 0) + (mentionMatch[0]?.startsWith(" ") ? 1 : 0)

  return {
    leadOffset,
    matchingString,
    replaceableString,
  }
}

export const getMentionType = (query: string): MentionType => {
  // Simple heuristic - could be enhanced with more sophisticated detection
  if (query.startsWith("@#")) return "feed"
  if (query.startsWith("@+")) return "entry"
  return "feed"
}

export const cleanQuery = (query: string): string => {
  return query.replace(/^@[#+]?/, "").toLowerCase()
}

export const shouldTriggerMention = (query: string): boolean => {
  return query.startsWith("@") && query.length > 0
}

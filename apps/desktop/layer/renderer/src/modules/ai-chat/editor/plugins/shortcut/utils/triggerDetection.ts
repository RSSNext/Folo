import { $getSelection, $isRangeSelection, $isTextNode } from "lexical"

import { SHORTCUT_TRIGGER_PATTERN } from "../constants"
import type { ShortcutMatch } from "../types"

export const defaultShortcutTriggerFn = (): ShortcutMatch | null => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) {
    return null
  }

  const { anchor, focus } = selection
  const anchorNode = anchor.getNode()

  if (!$isTextNode(anchorNode) || anchor.key !== focus.key || anchor.offset !== focus.offset) {
    return null
  }

  const textContent = anchorNode.getTextContent()
  const cursorOffset = anchor.offset
  const match = textContent.slice(0, cursorOffset).match(SHORTCUT_TRIGGER_PATTERN)

  if (!match) {
    return null
  }

  const matchingString = match[1] || ""
  const replaceableString = matchingString
  const leadOffset = (match.index ?? 0) + (match[0]?.startsWith(" ") ? 1 : 0)

  return {
    leadOffset,
    matchingString,
    replaceableString,
  }
}

export const cleanShortcutQuery = (query: string): string => {
  return query.replace(/^\//, "").trim()
}

export const shouldTriggerShortcut = (query: string): boolean => {
  return query.startsWith("/") && query.length > 0
}

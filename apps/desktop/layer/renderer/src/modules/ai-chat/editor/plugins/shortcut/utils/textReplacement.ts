import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode } from "lexical"

import { $createShortcutNode } from "../ShortcutNode"
import type { ShortcutData, ShortcutMatch } from "../types"

export const insertShortcutNode = (
  shortcutData: ShortcutData,
  shortcutMatch: ShortcutMatch,
): { success: boolean; nodeKey?: string } => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return { success: false }

  const { anchor } = selection
  const anchorNode = anchor.getNode()

  if (!$isTextNode(anchorNode)) return { success: false }

  const textContent = anchorNode.getTextContent()
  const { leadOffset, replaceableString } = shortcutMatch

  const beforeText = textContent.slice(0, leadOffset)
  const afterText = textContent.slice(leadOffset + replaceableString.length)

  const beforeNode = beforeText ? $createTextNode(beforeText) : null
  const shortcutNode = $createShortcutNode(shortcutData)
  const afterNode = afterText ? $createTextNode(afterText) : null

  if (beforeNode) {
    anchorNode.insertBefore(beforeNode)
  }
  anchorNode.insertBefore(shortcutNode)
  if (afterNode) {
    anchorNode.insertBefore(afterNode)
  }

  anchorNode.remove()

  if (afterNode) {
    afterNode.select(0, 0)
  } else {
    const spaceNode = $createTextNode(" ")
    shortcutNode.insertAfter(spaceNode)
    spaceNode.select(1, 1)
  }

  return { success: true, nodeKey: shortcutNode.getKey() }
}

import { $createTextNode, $getSelection, $isRangeSelection, $isTextNode } from "lexical"

import { $createMentionNode } from "../MentionNode"
import type { MentionData, MentionMatch } from "../types"

export const insertMentionNode = (
  mentionData: MentionData,
  mentionMatch: MentionMatch,
): { success: boolean; nodeKey?: string } => {
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.isCollapsed()) return { success: false }

  const { anchor } = selection
  const anchorNode = anchor.getNode()

  if (!$isTextNode(anchorNode)) return { success: false }

  // Replace the mention text with the mention node
  const textContent = anchorNode.getTextContent()
  const { leadOffset, replaceableString } = mentionMatch

  // Split the text node
  const beforeText = textContent.slice(0, leadOffset)
  const afterText = textContent.slice(leadOffset + replaceableString.length)

  // Create new nodes
  const beforeNode = beforeText ? $createTextNode(beforeText) : null
  const mentionNode = $createMentionNode(mentionData)
  const afterNode = afterText ? $createTextNode(afterText) : null

  // Replace the current node
  if (beforeNode) {
    anchorNode.insertBefore(beforeNode)
  }
  anchorNode.insertBefore(mentionNode)
  if (afterNode) {
    anchorNode.insertBefore(afterNode)
  }

  // Remove the original node
  anchorNode.remove()

  // Position cursor after the mention
  if (afterNode) {
    afterNode.select(0, 0)
  } else {
    // Create a space after the mention if there's no following text
    const spaceNode = $createTextNode(" ")
    mentionNode.insertAfter(spaceNode)
    spaceNode.select(1, 1)
  }

  return { success: true, nodeKey: mentionNode.getKey() }
}

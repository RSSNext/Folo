import type { LexicalEditor } from "lexical"
import { $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode } from "lexical"

import type { MentionData, MentionNode,MentionType  } from "../plugins/mention"
import { $createMentionNode, $isMentionNode } from "../plugins/mention"

/**
 * Utility functions for working with mentions in Lexical editor
 */

/**
 * Search for mentions in the editor content
 */
export function $findMentionNodes(editor?: LexicalEditor): MentionNode[] {
  const mentionNodes: MentionNode[] = []

  const root = editor?.getEditorState().read(() => {
    return editor.getRootElement()
  })

  if (!root) return mentionNodes

  // Traverse all nodes to find mentions
  function traverse(node: any) {
    if ($isMentionNode(node)) {
      mentionNodes.push(node)
    }

    if (node.getChildren) {
      const children = node.getChildren()
      for (const child of children) {
        traverse(child)
      }
    }
  }

  editor?.getEditorState().read(() => {
    const rootNode = editor.getRootElement()
    if (rootNode) {
      // This is a simplified traversal - in a real implementation,
      // you'd need to traverse the Lexical node tree properly
    }
  })

  return mentionNodes
}

/**
 * Get all mentions from the editor as data objects
 */
export function $getMentionsFromEditor(editor: LexicalEditor): MentionData[] {
  const mentionNodes = $findMentionNodes(editor)
  return mentionNodes.map((node) => node.getMentionData())
}

/**
 * Replace text with a mention node at the current selection
 */
export function $insertMentionAtSelection(mentionData: MentionData, replaceText?: string): boolean {
  const selection = $getSelection()

  if (!$isRangeSelection(selection)) {
    return false
  }

  const mentionNode = $createMentionNode(mentionData)

  if (replaceText) {
    // Find and replace specific text
    const {anchor} = selection
    const {focus} = selection
    const anchorNode = anchor.getNode()

    if ($isTextNode(anchorNode)) {
      const textContent = anchorNode.getTextContent()
      const replaceIndex = textContent.indexOf(replaceText)

      if (replaceIndex !== -1) {
        // Split the text node and insert mention
        const beforeText = textContent.slice(0, replaceIndex)
        const afterText = textContent.slice(replaceIndex + replaceText.length)

        if (beforeText) {
          selection.insertText(beforeText)
        }

        selection.insertNodes([mentionNode])

        if (afterText) {
          selection.insertText(afterText)
        }

        return true
      }
    }
  } else {
    // Insert at current selection
    selection.insertNodes([mentionNode])
    return true
  }

  return false
}

/**
 * Update a mention node's data
 */
export function $updateMentionNode(nodeKey: string, newData: Partial<MentionData>): boolean {
  const node = $getNodeByKey(nodeKey)

  if (!$isMentionNode(node)) {
    return false
  }

  const currentData = node.getMentionData()
  const updatedData = { ...currentData, ...newData }

  node.setMentionData(updatedData)
  return true
}

/**
 * Remove a mention node by key
 */
export function $removeMentionNode(nodeKey: string): boolean {
  const node = $getNodeByKey(nodeKey)

  if (!$isMentionNode(node)) {
    return false
  }

  node.remove()
  return true
}

/**
 * Validate mention data
 */
export function validateMentionData(data: Partial<MentionData>): data is MentionData {
  return !!(data.id && data.name && data.type && ["feed", "entry"].includes(data.type))
}

/**
 * Create mention data object
 */
export function createMentionData(
  id: string,
  name: string,
  type: MentionType,
): MentionData {
  return {
    id,
    name,
    type,
  }
}

/**
 * Parse mention from text content
 */
export function parseMentionFromText(text: string): {
  type: MentionType
  name: string
} | null {
  // Match patterns like @username, @#feed, @+entry
  const mentionMatch = text.match(/^@([#+]?)([\w-]+)$/)

  if (!mentionMatch) {
    return null
  }

  const [, prefix = "", name = ""] = mentionMatch

  let type: MentionType = "feed"
  if (prefix === "#") {
    type = "feed"
  } else if (prefix === "+") {
    type = "entry"
  }

  return { type, name }
}

/**
 * Format mention for display
 */
export function formatMentionDisplay(mentionData: MentionData): string {
  const prefix = mentionData.type === "feed" ? "#" : mentionData.type === "entry" ? "+" : ""
  return `@${prefix}${mentionData.name}`
}

/**
 * Get mention statistics from editor
 */
export function $getMentionStats(editor: LexicalEditor): {
  total: number
  byType: Record<MentionType, number>
  unique: number
} {
  const mentions = $getMentionsFromEditor(editor)

  const stats = {
    total: mentions.length,
    byType: {
      feed: 0,
      entry: 0,
    } as Record<MentionType, number>,
    unique: 0,
  }

  const uniqueIds = new Set<string>()

  for (const mention of mentions) {
    stats.byType[mention.type]++
    uniqueIds.add(`${mention.type}:${mention.id}`)
  }

  stats.unique = uniqueIds.size

  return stats
}

/**
 * Export mentions to JSON
 */
export function exportMentionsToJSON(mentions: MentionData[]): string {
  return JSON.stringify(mentions, null, 2)
}

/**
 * Import mentions from JSON
 */
export function importMentionsFromJSON(json: string): MentionData[] {
  try {
    const data = JSON.parse(json)
    if (Array.isArray(data)) {
      return data.filter((item) => validateMentionData(item))
    }
    return []
  } catch {
    return []
  }
}

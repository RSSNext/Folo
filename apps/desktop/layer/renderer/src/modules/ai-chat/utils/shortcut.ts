import type { SerializedEditorState, SerializedLexicalNode } from "lexical"

import type { SerializedShortcutNode } from "../editor/plugins/shortcut/ShortcutNode"
import type { SendingUIMessage } from "../store/types"

type SerializedNodeWithChildren = SerializedLexicalNode & {
  children?: SerializedLexicalNode[]
}

const isSerializedShortcutNode = (node: SerializedLexicalNode): node is SerializedShortcutNode =>
  node.type === "shortcut"

const hasChildren = (node: SerializedLexicalNode): node is SerializedNodeWithChildren =>
  Array.isArray((node as SerializedNodeWithChildren).children)

const findShortcutIdInNodes = (nodes: SerializedLexicalNode[]): string | undefined => {
  for (const node of nodes) {
    if (isSerializedShortcutNode(node) && node.shortcutData?.id?.trim()) {
      return node.shortcutData.id.trim()
    }

    if (hasChildren(node)) {
      const match = findShortcutIdInNodes(node.children ?? [])
      if (match) {
        return match
      }
    }
  }

  return undefined
}

export const extractShortcutIdFromSerializedState = (
  state?: SerializedEditorState,
): string | undefined => {
  if (!state?.root || !Array.isArray(state.root.children)) {
    return undefined
  }

  return findShortcutIdInNodes(state.root.children as SerializedLexicalNode[])
}

const parseSerializedState = (
  rawState: string | SerializedEditorState,
): SerializedEditorState | null => {
  if (typeof rawState !== "string") {
    return rawState
  }

  try {
    return JSON.parse(rawState) as SerializedEditorState
  } catch (error) {
    console.error("Failed to parse serialized editor state", error)
    return null
  }
}

export const extractShortcutIdFromMessageParts = (
  parts: SendingUIMessage["parts"],
): string | undefined => {
  for (const part of parts) {
    if (part.type !== "data-rich-text") {
      continue
    }

    const serializedState = parseSerializedState(part.data.state)
    if (!serializedState) {
      continue
    }

    const match = extractShortcutIdFromSerializedState(serializedState)
    if (match) {
      return match
    }
  }

  return undefined
}

export const prefixMessageIdWithShortcut = (baseId: string, shortcutId?: string): string => {
  const normalized = shortcutId?.trim()
  if (!normalized) {
    return baseId
  }

  return `${normalized}-${baseId}`
}

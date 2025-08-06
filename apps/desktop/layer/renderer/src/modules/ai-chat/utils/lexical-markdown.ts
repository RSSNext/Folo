import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import type { LexicalEditor, SerializedEditorState } from "lexical"

/**
 * Message format types
 */
export type MessageFormat = "plaintext" | "richtext"

/**
 * Message content with format information
 */
export interface MessageContent {
  /** The content format */
  format: MessageFormat
  /** Raw content - markdown string for plaintext, Lexical schema for richtext */
  content: string | SerializedEditorState
}

/**
 * Convert Lexical editor state to markdown string for AI communication
 */
export function convertLexicalToMarkdown(editor: LexicalEditor): string {
  let markdown = ""

  editor.getEditorState().read(() => {
    markdown = $convertToMarkdownString(TRANSFORMERS)
  })

  return markdown
}

/**
 * Get markdown string for AI communication from any MessageContent
 */
export function getMarkdownForAI(message: MessageContent, editor?: LexicalEditor): string {
  if (message.format === "plaintext") {
    return message.content as string
  }

  if (message.format === "richtext" && editor) {
    // Set editor state from schema and convert to markdown
    const schema = message.content as SerializedEditorState
    const editorState = editor.parseEditorState(schema)
    editor.setEditorState(editorState)
    return convertLexicalToMarkdown(editor)
  }

  // Fallback
  return ""
}

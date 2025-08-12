import type { SerializedEditorState } from "lexical"

export interface ChatSession {
  chatId: string
  title?: string
  createdAt: Date
  updatedAt: Date
  messageCount: number
}

export type RichTextPart = {
  type: "data-rich-text"
  data: {
    state: SerializedEditorState
    text: string
  }
}

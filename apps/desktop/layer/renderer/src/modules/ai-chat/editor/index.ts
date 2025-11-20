import { LexicalRichEditorNodes } from "@follow/components/ui/lexical-rich-editor/nodes.js"

import { FileAttachmentNode, MentionNode, SelectedTextNode, ShortcutNode } from "./plugins"

export * from "./plugins"

export const LexicalAIEditorNodes = [
  ...LexicalRichEditorNodes,
  MentionNode,
  ShortcutNode,
  FileAttachmentNode,
  SelectedTextNode,
]

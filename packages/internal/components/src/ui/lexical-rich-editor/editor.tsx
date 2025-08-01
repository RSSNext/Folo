import type { CreateEditorArgs } from "lexical"
import { createEditor } from "lexical"

import { LexicalRichEditorNodes } from "./nodes"
import { defaultLexicalTheme } from "./theme"

export const createLexicalEditor = (options: CreateEditorArgs) => {
  const editor = createEditor({
    theme: defaultLexicalTheme,
    nodes: LexicalRichEditorNodes,
    ...options,
  })
  return editor
}

export const createDefaultLexicalEditor = () => {
  return createLexicalEditor({
    namespace: "LexicalRichEditor",
    theme: defaultLexicalTheme,
    nodes: LexicalRichEditorNodes,
  })
}

import type { CreateEditorArgs } from "lexical"
import { createEditor } from "lexical"

import { LexicalRichEditorNodes } from "./nodes"
import { defaultLexicalTheme } from "./theme"
import type { LexicalPluginFC } from "./types"

export const createLexicalEditor = (options: CreateEditorArgs) => {
  const editor = createEditor({
    theme: defaultLexicalTheme,
    nodes: LexicalRichEditorNodes,
    ...options,
  })
  return editor
}

export const createDefaultLexicalEditor = (plugins?: LexicalPluginFC<unknown>[]) => {
  const pluginNodes = plugins?.flatMap((plugin) => plugin.nodes || []) || []

  const allNodes = [...LexicalRichEditorNodes, ...pluginNodes]
  return createLexicalEditor({
    namespace: "LexicalRichEditor",
    theme: defaultLexicalTheme,
    nodes: allNodes,
  })
}

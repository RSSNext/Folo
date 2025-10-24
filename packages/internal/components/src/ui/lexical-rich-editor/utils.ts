import { $convertToMarkdownString, TRANSFORMERS } from "@lexical/markdown"
import type { LexicalEditor } from "lexical"

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

export function getEditorStateJSONString(plainText: string): string {
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: "normal",
              style: "",
              text: plainText,
              type: "text",
              version: 1,
            },
          ],
          direction: "ltr",
          format: "",
          indent: 0,
          type: "paragraph",
          version: 1,
        },
      ],
      direction: "ltr",
      format: "",
      indent: 0,
      type: "root",
      version: 1,
    },
  })
}

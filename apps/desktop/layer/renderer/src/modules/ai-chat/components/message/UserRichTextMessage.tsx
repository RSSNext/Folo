import { defaultLexicalTheme } from "@follow/components/ui/lexical-rich-editor/theme.js"
import { cn } from "@follow/utils"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import type { SerializedEditorState } from "lexical"
import * as React from "react"
import isEqual from "react-fast-compare"

import { LexicalAIEditorNodes } from "../../editor"
import { getShortcutMarkdownValue } from "../../editor/plugins/shortcut/utils/shortcutTextValue"

function onError(error: Error) {
  console.error("Lexical Read-Only Editor Error:", error)
}

function replaceShortcutTagsWithMarkdown(state: string): string {
  try {
    const parsed = JSON.parse(state) as Record<string, any>
    const textNodes: Array<{ text: string }> = []

    const traverse = (node: any) => {
      if (!node) return
      if (Array.isArray(node.children)) {
        node.children.forEach(traverse)
      }
      if (node.type === "text" && typeof node.text === "string") {
        textNodes.push(node)
      }
    }

    traverse(parsed.root)

    textNodes.forEach((node) => {
      node.text = node.text.replaceAll(/<shortcut id="([^"]+)"><\/shortcut>/g, (_, id: string) => {
        return getShortcutMarkdownValue(id)
      })
    })

    return JSON.stringify(parsed)
  } catch (error) {
    console.error("Failed to transform shortcut tags to markdown:", error)
    return state
  }
}

interface UserRichTextMessageProps {
  data: {
    state: SerializedEditorState | string // Serialized editor state as a JSON string
    text: string
  }
  className?: string
}

export const UserRichTextMessage: React.FC<UserRichTextMessageProps> = React.memo(
  ({ data, className }) => {
    const sanitizedState = React.useMemo(() => {
      const rawState = typeof data.state === "string" ? data.state : JSON.stringify(data.state)
      return replaceShortcutTagsWithMarkdown(rawState)
    }, [data.state])

    const editorState = sanitizedState

    let initialConfig: InitialConfigType = null!
    if (!initialConfig) {
      initialConfig = {
        namespace: "AIRichTextDisplay",
        theme: defaultLexicalTheme,
        onError,
        editable: false,
        editorState,
        nodes: LexicalAIEditorNodes,
      }
    }
    return (
      <div className={cn("relative cursor-text text-sm text-text", className)}>
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="focus:outline-none" style={{ outline: "none" }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={null}
          />
          <ListenableContentChangedPlugin state={editorState} />
        </LexicalComposer>
      </div>
    )
  },
)

const ListenableContentChangedPlugin = ({ state }: { state: string }) => {
  const [editor] = useLexicalComposerContext()
  React.useEffect(() => {
    const editorState = editor.getEditorState()
    editorState.read(() => {
      const text = editorState.toJSON()

      if (isEqual(text, state)) {
        return
      }
      editor.setEditorState(editor.parseEditorState(state))
    })
  }, [editor, state])
  return null
}

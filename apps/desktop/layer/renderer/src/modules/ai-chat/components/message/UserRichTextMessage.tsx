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

import { useAISettingValue } from "~/atoms/settings/ai"

import { LexicalAIEditorNodes } from "../../editor"
import { MentionComponent } from "../../editor/plugins/mention"

function onError(error: Error) {
  console.error("Lexical Read-Only Editor Error:", error)
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
    const aiSettings = useAISettingValue()
    const { shortcuts } = aiSettings

    const shortcutMention = React.useMemo(() => {
      const rawText = data.text
      const normalizedText = rawText.trim()
      if (!normalizedText) {
        return null
      }

      const matchedShortcut = shortcuts.find((shortcut) => {
        if (!shortcut.enabled) {
          return false
        }

        if (shortcut.prompt === rawText) {
          return true
        }

        return shortcut.prompt.trim() === normalizedText
      })

      if (!matchedShortcut) {
        return null
      }

      return {
        id: matchedShortcut.id,
        name: matchedShortcut.name,
        type: "shortcut" as const,
        value: matchedShortcut.prompt,
      }
    }, [data.text, shortcuts])

    if (shortcutMention) {
      return (
        <div className={cn("text-text relative cursor-text text-sm", className)}>
          <MentionComponent mentionData={shortcutMention} />
        </div>
      )
    }

    const editorState = typeof data.state === "object" ? JSON.stringify(data.state) : data.state

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
      <div className={cn("text-text relative cursor-text text-sm", className)}>
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

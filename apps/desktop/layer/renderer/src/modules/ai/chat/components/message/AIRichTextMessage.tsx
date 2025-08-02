import { LexicalRichEditorNodes } from "@follow/components/ui/lexical-rich-editor/nodes.js"
import { defaultLexicalTheme } from "@follow/components/ui/lexical-rich-editor/theme.js"
import { cn } from "@follow/utils"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import type { SerializedEditorState } from "lexical"
import * as React from "react"

function onError(error: Error) {
  console.error("Lexical Read-Only Editor Error:", error)
}

interface AIRichTextMessageProps {
  data: {
    state: SerializedEditorState
    text: string
  }
  className?: string
}

export const AIRichTextMessage: React.FC<AIRichTextMessageProps> = React.memo(
  ({ data, className }) => {
    const initialConfig: InitialConfigType = {
      namespace: "AIRichTextDisplay",
      theme: defaultLexicalTheme,
      onError,
      editable: false, // Read-only mode
      editorState: JSON.stringify(data.state),
      nodes: LexicalRichEditorNodes,
    }

    return (
      <div className={cn("text-text relative text-sm", className)}>
        <LexicalComposer initialConfig={initialConfig}>
          <RichTextPlugin
            contentEditable={
              <ContentEditable className="focus:outline-none" style={{ outline: "none" }} />
            }
            ErrorBoundary={LexicalErrorBoundary}
            placeholder={null}
          />
        </LexicalComposer>
      </div>
    )
  },
)

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

import { FileAttachmentNode } from "../../editor"
import { MentionNode } from "../../editor/plugins/mention/MentionNode"

function onError(error: Error) {
  console.error("Lexical Read-Only Editor Error:", error)
}

interface AIRichTextMessageProps {
  data: {
    state: SerializedEditorState | string // Serialized editor state as a JSON string
    text: string
  }
  className?: string
}

export const AIRichTextMessage: React.FC<AIRichTextMessageProps> = React.memo(
  ({ data, className }) => {
    let initialConfig: InitialConfigType = null!
    if (!initialConfig) {
      initialConfig = {
        namespace: "AIRichTextDisplay",
        theme: defaultLexicalTheme,
        onError,
        editable: false,
        editorState: typeof data.state === "object" ? JSON.stringify(data.state) : data.state,
        nodes: [...LexicalRichEditorNodes, MentionNode, FileAttachmentNode],
      }
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

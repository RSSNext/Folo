import { cn } from "@follow/utils"
import { TRANSFORMERS } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useImperativeHandle, useRef, useState } from "react"

import { LexicalRichEditorNodes } from "./nodes"
import { KeyboardPlugin } from "./plugins"
import { defaultLexicalTheme } from "./theme"
import type { LexicalRichEditorProps, LexicalRichEditorRef } from "./types"

function onError(error: Error) {
  console.error("Lexical Editor Error:", error)
}
const defaultEnabledPlugins = {
  history: true,
  markdown: true,
  list: true,
  link: true,
  autoFocus: true,
}

export const LexicalRichEditor = ({
  ref,
  placeholder = "Enter your message...",
  className,
  onChange,
  onKeyDown,
  autoFocus = false,
  namespace = "LexicalRichEditor",
  theme = defaultLexicalTheme,
  enabledPlugins = defaultEnabledPlugins,
  initalEditorState,
}: LexicalRichEditorProps & { ref?: React.RefObject<LexicalRichEditorRef | null> }) => {
  const editorRef = useRef<LexicalEditor | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const initialConfig: InitialConfigType = {
    namespace,
    theme,
    onError,
    nodes: LexicalRichEditorNodes,
    editorState: initalEditorState,
  }

  useImperativeHandle(ref, () => ({
    getEditor: () => editorRef.current!,
    focus: () => {
      editorRef.current?.focus()
    },
    clear: () => {
      editorRef.current?.update(() => {
        const root = $getRoot()
        root.clear()
      })
    },
    isEmpty: () => isEmpty,
  }))

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
    editorRef.current = editor

    // Check if editor is empty
    editorState.read(() => {
      const root = $getRoot()
      const textContent = root.getTextContent().trim()
      setIsEmpty(textContent === "")
    })

    onChange?.(editorState, editor)
  }

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn("relative", className)}>
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              className={cn(
                "scrollbar-none text-text placeholder:text-text-secondary",
                "max-h-40 min-h-14 w-full resize-none bg-transparent px-5 py-3.5 pr-14",
                "text-sm !outline-none transition-all duration-200 focus:outline-none",
              )}
              aria-placeholder={placeholder}
              placeholder={
                <div className="text-text-secondary pointer-events-none absolute left-5 top-3.5 text-sm">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />

        {enabledPlugins.history && <HistoryPlugin />}
        {enabledPlugins.markdown && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
        {enabledPlugins.list && <ListPlugin />}
        {enabledPlugins.link && <LinkPlugin />}

        <KeyboardPlugin onKeyDown={onKeyDown} />
        {autoFocus && enabledPlugins.autoFocus && <AutoFocusPlugin />}
      </div>
    </LexicalComposer>
  )
}

LexicalRichEditor.displayName = "LexicalRichEditor"

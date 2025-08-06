import { cn } from "@follow/utils"
import { TRANSFORMERS } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import type { InitialConfigType } from "@lexical/react/LexicalComposer"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { EditorRefPlugin } from "@lexical/react/LexicalEditorRefPlugin"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useCallback, useImperativeHandle, useState } from "react"

import { LexicalRichEditorNodes } from "./nodes"
import { KeyboardPlugin } from "./plugins"
import { defaultLexicalTheme } from "./theme"
import type { BuiltInPlugins, LexicalRichEditorProps, LexicalRichEditorRef } from "./types"

function onError(error: Error) {
  console.error("Lexical Editor Error:", error)
}
const defaultEnabledPlugins: BuiltInPlugins = {
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
  plugins,
}: LexicalRichEditorProps & { ref?: React.RefObject<LexicalRichEditorRef | null> }) => {
  const [editorRef, setEditorRef] = useState<LexicalEditor | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  // Collect nodes from plugins
  const pluginNodes = plugins?.flatMap((plugin) => plugin.nodes || []) || []

  // Merge base nodes with custom nodes and plugin nodes
  const allNodes = [...LexicalRichEditorNodes, ...pluginNodes]

  const initialConfig: InitialConfigType = {
    namespace,
    theme,
    onError,
    nodes: allNodes,
    editorState: initalEditorState,
  }

  useImperativeHandle(
    ref,
    useCallback(
      () => ({
        getEditor: () => editorRef!,
        focus: () => {
          editorRef?.focus()
        },
        clear: () => {
          editorRef?.update(() => {
            const root = $getRoot()
            root.clear()
          })
        },
        isEmpty: () => isEmpty,
      }),
      [isEmpty, editorRef],
    ),
  )

  const handleChange = (editorState: EditorState, editor: LexicalEditor) => {
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
                "scrollbar-none text-text placeholder:text-text-secondary cursor-text",
                "h-14 w-full resize-none bg-transparent",
                "text-sm !outline-none transition-all duration-200 focus:outline-none",
              )}
              aria-placeholder={placeholder}
              placeholder={
                <div className="text-text-secondary pointer-events-none absolute left-0 top-0 text-sm">
                  {placeholder}
                </div>
              }
            />
          }
          ErrorBoundary={LexicalErrorBoundary}
        />
        <OnChangePlugin onChange={handleChange} />
        <EditorRefPlugin editorRef={setEditorRef} />

        {enabledPlugins.history && <HistoryPlugin />}
        {enabledPlugins.markdown && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
        {enabledPlugins.list && <ListPlugin />}
        {enabledPlugins.link && <LinkPlugin />}

        {plugins?.map((Plugin) => (
          <Plugin key={Plugin.id} />
        ))}

        <KeyboardPlugin onKeyDown={onKeyDown} />
        {autoFocus && enabledPlugins.autoFocus && <AutoFocusPlugin />}
      </div>
    </LexicalComposer>
  )
}

LexicalRichEditor.displayName = "LexicalRichEditor"

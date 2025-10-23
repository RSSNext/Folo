import { cn, stopPropagation } from "@follow/utils"
import { TRANSFORMERS } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { AutoLinkPlugin } from "@lexical/react/LexicalAutoLinkPlugin"
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
import { TabIndentationPlugin } from "@lexical/react/LexicalTabIndentationPlugin"
import type { LexicalEditor } from "lexical"
import { $getRoot } from "lexical"
import { useImperativeHandle, useState } from "react"

import { LexicalRichEditorNodes } from "./nodes"
import {
  CodeHighlightingPlugin,
  ExitCodeBoundaryPlugin,
  KeyboardPlugin,
  TripleBacktickTogglePlugin,
} from "./plugins"
import { StringLengthChangePlugin } from "./plugins/string-length-change"
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
  autoLink: true,
  tabIndentation: true,
}

const URL_MATCHER =
  /((https?:\/\/(www\.)?)|(www\.))[-\w@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-\w()@:%+.~#?&/=]*)/

const MATCHERS = [
  (text: string) => {
    const match = URL_MATCHER.exec(text)
    if (match === null) {
      return null
    }
    const fullMatch = match[0]
    return {
      index: match.index,
      length: fullMatch.length,
      text: fullMatch,
      url: fullMatch.startsWith("http") ? fullMatch : `https://${fullMatch}`,
      attributes: { rel: "noreferrer", target: "_blank" },
    }
  },
]
export const LexicalRichEditor = function LexicalRichEditor({
  ref,
  placeholder = "Enter your message...",
  className,
  namespace = "LexicalRichEditor",
  autoFocus = false,
  theme = defaultLexicalTheme,
  enabledPlugins = defaultEnabledPlugins,
  initalEditorState,
  plugins,
  accessories,

  onKeyDown,
  onChange,
  onLengthChange,
}: LexicalRichEditorProps & { ref?: React.RefObject<LexicalRichEditorRef | null> }) {
  const [editorRef, setEditorRef] = useState<LexicalEditor | null>(null)

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

  useImperativeHandle(ref, () => ({
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
    isEmpty: () =>
      editorRef?.getEditorState().read(() => $getRoot().getTextContent().trim() === "") || false,
  }))

  return (
    <LexicalComposer initialConfig={initialConfig}>
      <div className={cn("relative cursor-text", className)}>
        {accessories}
        <RichTextPlugin
          contentEditable={
            <ContentEditable
              onContextMenu={stopPropagation}
              className={cn(
                "scrollbar-none text-text placeholder:text-text-secondary size-full cursor-text",
                "size-full resize-none bg-transparent",
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

        {onChange && <OnChangePlugin onChange={onChange} />}
        {onLengthChange && <StringLengthChangePlugin onChange={onLengthChange} />}
        <EditorRefPlugin editorRef={setEditorRef} />
        {enabledPlugins.tabIndentation && <TabIndentationPlugin />}
        {enabledPlugins.autoLink && <AutoLinkPlugin matchers={MATCHERS} />}
        {enabledPlugins.history && <HistoryPlugin />}
        {enabledPlugins.markdown && <MarkdownShortcutPlugin transformers={TRANSFORMERS} />}
        {enabledPlugins.list && <ListPlugin />}
        {enabledPlugins.link && <LinkPlugin />}

        {plugins?.map((Plugin) => (
          <Plugin key={Plugin.id} />
        ))}

        <ExitCodeBoundaryPlugin />
        <CodeHighlightingPlugin />
        <TripleBacktickTogglePlugin />
        <KeyboardPlugin onKeyDown={onKeyDown} />
        {autoFocus && enabledPlugins.autoFocus && <AutoFocusPlugin />}
      </div>
    </LexicalComposer>
  )
}

LexicalRichEditor.displayName = "LexicalRichEditor"

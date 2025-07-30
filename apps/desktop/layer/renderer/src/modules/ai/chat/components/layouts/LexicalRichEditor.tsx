import { cn } from "@follow/utils"
import { CodeHighlightNode, CodeNode } from "@lexical/code"
import { LinkNode } from "@lexical/link"
import { ListItemNode, ListNode } from "@lexical/list"
import { MarkNode } from "@lexical/mark"
import { TRANSFORMERS } from "@lexical/markdown"
import { AutoFocusPlugin } from "@lexical/react/LexicalAutoFocusPlugin"
import { LexicalComposer } from "@lexical/react/LexicalComposer"
import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import { ContentEditable } from "@lexical/react/LexicalContentEditable"
import { LexicalErrorBoundary } from "@lexical/react/LexicalErrorBoundary"
import { HistoryPlugin } from "@lexical/react/LexicalHistoryPlugin"
import { LinkPlugin } from "@lexical/react/LexicalLinkPlugin"
import { ListPlugin } from "@lexical/react/LexicalListPlugin"
import { MarkdownShortcutPlugin } from "@lexical/react/LexicalMarkdownShortcutPlugin"
import { OnChangePlugin } from "@lexical/react/LexicalOnChangePlugin"
import { RichTextPlugin } from "@lexical/react/LexicalRichTextPlugin"
import { HeadingNode, QuoteNode } from "@lexical/rich-text"
import type { EditorState, LexicalEditor } from "lexical"
import { $getRoot, ParagraphNode, TextNode } from "lexical"
import { useEffect, useImperativeHandle, useRef, useState } from "react"

const theme = {
  paragraph: "mb-1",
  text: {
    bold: "font-semibold",
    italic: "italic",
    strikethrough: "line-through",
    underline: "underline",
    code: "bg-fill px-1 py-0.5 rounded text-sm font-mono",
  },
  heading: {
    h1: "text-2xl font-bold mb-2",
    h2: "text-xl font-bold mb-2",
    h3: "text-lg font-bold mb-1",
    h4: "text-base font-bold mb-1",
    h5: "text-sm font-bold mb-1",
    h6: "text-xs font-bold mb-1",
  },
  list: {
    nested: {
      listitem: "list-none",
    },
    ol: "list-decimal list-inside mb-2",
    ul: "list-disc list-inside mb-2",
    listitem: "mb-1",
  },
  quote: "border-l-4 border-accent pl-4 italic mb-2",
  code: "bg-fill px-3 py-2 rounded font-mono text-sm mb-2 block overflow-x-auto",
  codeHighlight: {
    atrule: "text-purple-400",
    attr: "text-blue-400",
    boolean: "text-orange-400",
    builtin: "text-purple-400",
    cdata: "text-gray-400",
    char: "text-green-400",
    class: "text-blue-400",
    "class-name": "text-blue-400",
    comment: "text-gray-400",
    constant: "text-orange-400",
    deleted: "text-red-400",
    doctype: "text-gray-400",
    entity: "text-orange-400",
    function: "text-yellow-400",
    important: "text-red-400",
    inserted: "text-green-400",
    keyword: "text-purple-400",
    namespace: "text-blue-400",
    number: "text-orange-400",
    operator: "text-pink-400",
    prolog: "text-gray-400",
    property: "text-blue-400",
    punctuation: "text-gray-300",
    regex: "text-green-400",
    selector: "text-green-400",
    string: "text-green-400",
    symbol: "text-orange-400",
    tag: "text-red-400",
    url: "text-blue-400",
    variable: "text-orange-400",
  },
  link: "text-accent underline hover:text-accent/80",
  mark: "bg-yellow-200 px-1 py-0.5 rounded",
}

function onError(error: Error) {
  console.error("Lexical Editor Error:", error)
}

export interface LexicalRichEditorRef {
  getEditor: () => LexicalEditor
  focus: () => void
  clear: () => void
  isEmpty: () => boolean
}

interface LexicalRichEditorProps {
  placeholder?: string
  className?: string
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void
  onKeyDown?: (event: KeyboardEvent) => boolean
  autoFocus?: boolean
}

function KeyboardPlugin({ onKeyDown }: { onKeyDown?: (event: KeyboardEvent) => boolean }) {
  const [editor] = useLexicalComposerContext()

  useEffect(() => {
    if (!onKeyDown) return

    const handleKeyDown = (event: KeyboardEvent) => {
      onKeyDown(event)
    }

    return editor.registerRootListener((rootElement, prevRootElement) => {
      if (prevRootElement !== null) {
        prevRootElement.removeEventListener("keydown", handleKeyDown)
      }
      if (rootElement !== null) {
        rootElement.addEventListener("keydown", handleKeyDown)
      }
    })
  }, [editor, onKeyDown])

  return null
}

export const LexicalRichEditor = ({
  ref,
  placeholder = "Enter your message...",
  className,
  onChange,
  onKeyDown,
  autoFocus = false,
}: LexicalRichEditorProps & { ref?: React.RefObject<LexicalRichEditorRef | null> }) => {
  const editorRef = useRef<LexicalEditor | null>(null)
  const [isEmpty, setIsEmpty] = useState(true)

  const initialConfig = {
    namespace: "AIChatRichEditor",
    theme,
    onError,
    nodes: [
      // Core nodes
      ParagraphNode,
      TextNode,

      // Rich text nodes
      HeadingNode, // For HEADING transformer
      QuoteNode, // For QUOTE transformer

      // List nodes
      ListNode, // For UNORDERED_LIST, ORDERED_LIST transformers
      ListItemNode,

      // Code nodes
      CodeNode, // For CODE transformer (multiline)
      CodeHighlightNode, // For code syntax highlighting

      // Link nodes
      LinkNode, // For LINK transformer

      // Text format nodes
      MarkNode, // For HIGHLIGHT transformer
    ],
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
        <HistoryPlugin />
        <MarkdownShortcutPlugin transformers={TRANSFORMERS} />
        <ListPlugin />
        <LinkPlugin />

        <KeyboardPlugin onKeyDown={onKeyDown} />
        {autoFocus && <AutoFocusPlugin />}
      </div>
    </LexicalComposer>
  )
}

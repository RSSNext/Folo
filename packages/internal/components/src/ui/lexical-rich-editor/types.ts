import type { EditorState, LexicalEditor } from "lexical"

export interface LexicalRichEditorRef {
  getEditor: () => LexicalEditor
  focus: () => void
  clear: () => void
  isEmpty: () => boolean
}

export interface LexicalRichEditorProps {
  placeholder?: string
  className?: string
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void
  onKeyDown?: (event: KeyboardEvent) => boolean
  autoFocus?: boolean
  namespace?: string
  theme?: any
  enabledPlugins?: {
    history?: boolean
    markdown?: boolean
    list?: boolean
    link?: boolean
    autoFocus?: boolean
  }
  initalEditorState?: EditorState
}

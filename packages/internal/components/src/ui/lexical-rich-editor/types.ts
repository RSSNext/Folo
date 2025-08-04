import type { EditorState, Klass, LexicalEditor, LexicalNode } from "lexical"

export interface LexicalRichEditorRef {
  getEditor: () => LexicalEditor
  focus: () => void
  clear: () => void
  isEmpty: () => boolean
}

export interface BuiltInPlugins {
  history?: boolean
  markdown?: boolean
  list?: boolean
  link?: boolean
  autoFocus?: boolean
}
export interface LexicalRichEditorProps {
  placeholder?: string
  className?: string
  onChange?: (editorState: EditorState, editor: LexicalEditor) => void
  onKeyDown?: (event: KeyboardEvent) => boolean
  autoFocus?: boolean
  namespace?: string
  theme?: any
  enabledPlugins?: BuiltInPlugins
  initalEditorState?: EditorState
  plugins?: LexicalPluginFC[]
}
export type LexicalPluginFC<T = unknown> = React.FC<T> & {
  id: string
  nodes?: ReadonlyArray<Klass<LexicalNode>>
}

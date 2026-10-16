import type { LexicalEditor } from "lexical"

/**
 * Whether the editor still holds the stored (stringified) state of a message.
 * Both sides go through this editor's parse and serialization, so keys that
 * serialize as `undefined` or were written by an older editor do not count as edits.
 */
export const isEditorStateUnchanged = (editor: LexicalEditor, storedState: string) => {
  const current = JSON.stringify(editor.getEditorState().toJSON())
  const stored = JSON.stringify(editor.parseEditorState(storedState).toJSON())
  return current === stored
}

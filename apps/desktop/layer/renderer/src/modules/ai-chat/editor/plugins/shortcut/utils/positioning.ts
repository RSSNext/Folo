import type { LexicalEditor } from "lexical"

import { calculateDropdownPosition } from "../../shared/utils/positioning"

export const calculateShortcutDropdownPosition = (editor: LexicalEditor) =>
  calculateDropdownPosition(editor)

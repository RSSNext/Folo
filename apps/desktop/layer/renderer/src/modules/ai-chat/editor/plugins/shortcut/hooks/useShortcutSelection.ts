import { useTypeaheadSelection } from "../../shared/hooks/useTypeaheadSelection"
import { SHORTCUT_COMMAND } from "../constants"
import type { ShortcutData, ShortcutMatch } from "../types"
import { insertShortcutNode } from "../utils/textReplacement"

interface UseShortcutSelectionOptions {
  shortcutMatch: ShortcutMatch | null
  onShortcutInsert?: (shortcut: ShortcutData, nodeKey?: string) => void
  onSelectionComplete?: () => void
}

export const useShortcutSelection = ({
  shortcutMatch,
  onShortcutInsert,
  onSelectionComplete,
}: UseShortcutSelectionOptions) => {
  const { selectItem } = useTypeaheadSelection<ShortcutMatch, ShortcutData>({
    match: shortcutMatch,
    command: SHORTCUT_COMMAND,
    replaceWith: (item, match) => insertShortcutNode(item, match),
    onInsert: onShortcutInsert,
    onComplete: onSelectionComplete,
  })

  return { selectShortcut: selectItem }
}

import { useLexicalComposerContext } from "@lexical/react/LexicalComposerContext"
import type { LexicalCommand } from "lexical"
import { COMMAND_PRIORITY_LOW } from "lexical"
import { useCallback, useEffect } from "react"

export interface ReplaceHandlerResult {
  success: boolean
  nodeKey?: string
}

export interface UseTypeaheadSelectionOptions<TMatch, TItem> {
  match: TMatch | null
  command: string | LexicalCommand<TItem>
  replaceWith: (item: TItem, match: TMatch) => ReplaceHandlerResult
  onInsert?: (item: TItem, nodeKey?: string) => void
  onComplete?: () => void
}

export const useTypeaheadSelection = <TMatch, TItem>({
  match,
  command,
  replaceWith,
  onInsert,
  onComplete,
}: UseTypeaheadSelectionOptions<TMatch, TItem>) => {
  const [editor] = useLexicalComposerContext()

  const selectItem = useCallback(
    (item: TItem) => {
      if (!match) return false

      let result: ReplaceHandlerResult = { success: false, nodeKey: undefined }
      editor.update(() => {
        result = replaceWith(item, match)
        if (result.success && result.nodeKey) onInsert?.(item, result.nodeKey)
      })
      if (result.success) {
        setTimeout(() => onComplete?.(), 0)
      }
      return result.success
    },
    [editor, match, onInsert, onComplete, replaceWith],
  )

  useEffect(() => {
    const remove = editor.registerCommand(
      // Support both LexicalCommand and string keys (cast for string case)
      command as unknown as any,
      (item: TItem) => selectItem(item),
      COMMAND_PRIORITY_LOW,
    )
    return remove
  }, [editor, command, selectItem])

  return { selectItem }
}

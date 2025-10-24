import { useEntry } from "@follow/store/entry/hooks"
import type { EntryModel } from "@follow/store/entry/types"

import { useRouteParamsSelector } from "./useRouteParams"

const selector = (state: EntryModel) => state.read
export function useEntryIsRead(entryId?: string) {
  const entryRead = useEntry(entryId, selector)

  return useRouteParamsSelector(
    (params) => {
      if (params.isCollection) {
        return true
      }
      if (entryRead === undefined) return false
      return entryRead
    },
    [entryRead],
  )
}

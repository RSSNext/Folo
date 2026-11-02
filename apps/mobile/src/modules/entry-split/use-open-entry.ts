import { use, useCallback } from "react"

import { useNavigation } from "@/src/lib/navigation/hooks"
import { EntryDetailScreen } from "@/src/screens/(stack)/entries/[entryId]/EntryDetailScreen"

import type { OpenedEntry } from "./context"
import { EntrySplitContext } from "./context"

/** Opens an entry of a list next to it when the window is wide enough, otherwise pushes the reader */
export const useOpenEntry = () => {
  const navigation = useNavigation()
  const split = use(EntrySplitContext)
  return useCallback(
    (entry: OpenedEntry) => {
      if (split) {
        split.openEntry(entry)
      } else {
        navigation.pushControllerView(EntryDetailScreen, entry)
      }
    },
    [navigation, split],
  )
}

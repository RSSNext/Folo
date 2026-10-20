import { useRefValue } from "@follow/hooks"
import { jotaiStore } from "@follow/utils"
import type { Atom, PrimitiveAtom } from "jotai"
import { atom, useAtomValue } from "jotai"
import { createContext, useEffect, useMemo, useState } from "react"

import { appendLoadedEntryIds, shouldLoadMoreEntries } from "./adjacent-entries"

interface EntryListSnapshot {
  entryIds: readonly string[]
  hasNextPage: boolean
}

/**
 * The list an entry was opened from. The reader steps through its entries, asks it for its next
 * page near the last loaded one, and scrolls it along so going back shows the entry read last.
 */
export interface EntryListSource {
  snapshotAtom: Atom<EntryListSnapshot>
  fetchNextPage: () => void
  revealEntry: (entryId: string) => void
}

export const EntryListSourceContext = createContext<EntryListSource | undefined>(undefined)

/** The source a list hands to the entries it opens. It stays the same while the list is mounted */
export const useEntryListSourceValue = ({
  entryIds,
  hasNextPage,
  fetchNextPage,
  revealEntry,
}: {
  entryIds: readonly string[] | null
  hasNextPage: boolean
  fetchNextPage: () => void
  revealEntry: (entryId: string) => void
}): EntryListSource => {
  const fetchNextPageRef = useRefValue(fetchNextPage)
  const revealEntryRef = useRefValue(revealEntry)
  const [snapshotAtom] = useState<PrimitiveAtom<EntryListSnapshot>>(() =>
    atom<EntryListSnapshot>({ entryIds: entryIds ?? [], hasNextPage }),
  )
  useEffect(() => {
    jotaiStore.set(snapshotAtom, { entryIds: entryIds ?? [], hasNextPage })
  }, [entryIds, hasNextPage, snapshotAtom])

  return useMemo(
    () => ({
      snapshotAtom,
      fetchNextPage: () => fetchNextPageRef.current(),
      revealEntry: (entryId: string) => revealEntryRef.current(entryId),
    }),
    [fetchNextPageRef, revealEntryRef, snapshotAtom],
  )
}

const noListSnapshotAtom = atom<EntryListSnapshot>({ entryIds: [], hasNextPage: false })
const noEntryIds: readonly string[] = []

/**
 * The entries the reader steps through: those of the list when the entry was opened, followed by
 * the pages the list loads while the reader nears the end of them.
 */
export const useNavigableEntryIds = (
  entryId: string,
  openedEntryIds: readonly string[] | undefined,
  source: EntryListSource | undefined,
) => {
  const { entryIds: listEntryIds, hasNextPage } = useAtomValue(
    source?.snapshotAtom ?? noListSnapshotAtom,
  )
  const entryIds = useMemo(
    () => (openedEntryIds ? appendLoadedEntryIds(openedEntryIds, listEntryIds) : noEntryIds),
    [listEntryIds, openedEntryIds],
  )

  useEffect(() => {
    if (source && hasNextPage && shouldLoadMoreEntries(entryIds, entryId)) {
      source.fetchNextPage()
    }
  }, [entryId, entryIds, hasNextPage, source])

  return entryIds
}

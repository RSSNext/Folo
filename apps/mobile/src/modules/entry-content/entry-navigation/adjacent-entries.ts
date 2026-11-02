export type EntryNavigationDirection = "previous" | "next"

/** How many entries before the last loaded one the reader asks the list for its next page */
const LOAD_MORE_ENTRIES_AHEAD = 5

/** The entries before and after `entryId` in the order the list shows them */
export const getAdjacentEntryIds = (
  entryIds: readonly string[],
  entryId: string,
): { previousEntryId?: string; nextEntryId?: string } => {
  const index = entryIds.indexOf(entryId)
  if (index === -1) return {}
  return { previousEntryId: entryIds[index - 1], nextEntryId: entryIds[index + 1] }
}

/**
 * The entries the reader steps through: those the list showed when the entry was opened, then
 * those the list has loaded after them since. Entries the list adds above or drops later leave
 * the order as it was, so stepping back finds the same entries.
 */
export const appendLoadedEntryIds = (
  openedEntryIds: readonly string[],
  listEntryIds: readonly string[],
): readonly string[] => {
  const listIndexes = new Map(listEntryIds.map((id, index) => [id, index]))
  // The entries loaded since follow the last opened entry the list still has
  for (let i = openedEntryIds.length - 1; i >= 0; i--) {
    const anchorIndex = listIndexes.get(openedEntryIds[i]!)
    if (anchorIndex === undefined) continue

    const opened = new Set(openedEntryIds)
    const loaded = listEntryIds.slice(anchorIndex + 1).filter((id) => !opened.has(id))
    return loaded.length > 0 ? [...openedEntryIds, ...loaded] : openedEntryIds
  }
  return openedEntryIds
}

/** Whether the reader is close enough to the last loaded entry to load the list's next page */
export const shouldLoadMoreEntries = (entryIds: readonly string[], entryId: string) => {
  const index = entryIds.indexOf(entryId)
  return index !== -1 && entryIds.length - 1 - index <= LOAD_MORE_ENTRIES_AHEAD
}

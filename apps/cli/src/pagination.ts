/** The most entries the API returns for one request */
export const MAX_PAGE_SIZE = 100

export interface EntryPage<T> {
  entries: T[]
  /** Pass as --cursor to get the next page */
  nextCursor: string | null
  hasNext: boolean
}

export interface EntryPageRequest {
  limit: number
  /** Entries before this time, newest first: the API calls the cursor publishedAfter */
  publishedAfter?: string
}

/**
 * One page of entries, newest first, and the cursor of the next one.
 *
 * A page shorter than the limit does not mean the list ended: the API caps a page at
 * MAX_PAGE_SIZE and leaves out some entries after limiting its query, such as those of the
 * onboarding feed, so a small page of a new account can even come back empty. Only a page
 * that stays empty when asked for MAX_PAGE_SIZE entries ends the list.
 */
export const fetchEntryPage = async <T>({
  limit,
  cursor,
  fetchEntries,
  getCursor,
}: {
  limit: number
  cursor?: string
  fetchEntries: (request: EntryPageRequest) => Promise<T[]>
  /** When the entry was published, or collected for collections */
  getCursor: (entry: T) => string | null | undefined
}): Promise<EntryPage<T>> => {
  const pageSize = Math.min(limit, MAX_PAGE_SIZE)
  let entries = await fetchEntries({ limit: pageSize, publishedAfter: cursor })

  // The page may have held only entries the API left out: look past them before ending
  if (entries.length === 0 && pageSize < MAX_PAGE_SIZE) {
    const wider = await fetchEntries({ limit: MAX_PAGE_SIZE, publishedAfter: cursor })
    entries = wider.slice(0, pageSize)
  }

  const last = entries.at(-1)
  const nextCursor = (last && getCursor(last)) || null
  return { entries, nextCursor, hasNext: nextCursor !== null }
}

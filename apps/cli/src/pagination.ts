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
  /** Entries after this time */
  publishedBefore?: string
}

const isSameTime = (left: string | null | undefined, right: string | null | undefined) =>
  !!left && !!right && Date.parse(left) === Date.parse(right)

const shiftTime = (time: string, milliseconds: number) =>
  new Date(Date.parse(time) + milliseconds).toISOString()

/**
 * One page of entries, newest first, and the cursor of the next one.
 *
 * A page shorter than the limit does not mean the list ended: the API caps a page at
 * MAX_PAGE_SIZE and leaves out some entries after limiting its query, such as those of the
 * onboarding feed, so a small page of a new account can even come back empty. Only a page
 * that stays empty when asked for MAX_PAGE_SIZE entries ends the list.
 *
 * The next page holds the entries older than the last one of this page, so entries of that
 * same time, such as feed items dated in the future that the API all clamps to now, would be
 * skipped. This page takes all of them instead, which can make it longer than the limit.
 */
export const fetchEntryPage = async <T>({
  limit,
  cursor,
  fetchEntries,
  getCursor,
  getId,
}: {
  limit: number
  cursor?: string
  fetchEntries: (request: EntryPageRequest) => Promise<T[]>
  /** When the entry was published, or collected for collections */
  getCursor: (entry: T) => string | null | undefined
  getId: (entry: T) => string
}): Promise<EntryPage<T>> => {
  const pageSize = Math.min(limit, MAX_PAGE_SIZE)
  // One entry more than the page tells whether the next one has the time of the last
  const fetchSize = Math.min(pageSize + 1, MAX_PAGE_SIZE)
  let fetched = await fetchEntries({ limit: fetchSize, publishedAfter: cursor })

  // The page may have held only entries the API left out: look past them before ending
  if (fetched.length === 0 && fetchSize < MAX_PAGE_SIZE) {
    fetched = await fetchEntries({ limit: MAX_PAGE_SIZE, publishedAfter: cursor })
  }

  let entries = fetched.slice(0, pageSize)
  const last = entries.at(-1)
  const nextCursor = (last && getCursor(last)) || null
  if (!nextCursor) {
    return { entries, nextCursor: null, hasNext: false }
  }

  const next = fetched[pageSize]
  // Without an entry after the page to compare with, a full page may end within a time
  const timeContinues = next ? isSameTime(getCursor(next), nextCursor) : fetched.length >= fetchSize
  if (timeContinues) {
    const sameTime = await fetchEntries({
      limit: MAX_PAGE_SIZE,
      publishedAfter: shiftTime(nextCursor, 1),
      publishedBefore: shiftTime(nextCursor, -1),
    })
    const ids = new Set(entries.map(getId))
    entries = [
      ...entries,
      ...sameTime.filter(
        (entry) => isSameTime(getCursor(entry), nextCursor) && !ids.has(getId(entry)),
      ),
    ]
  }

  return { entries, nextCursor, hasNext: true }
}

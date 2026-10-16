import type { ImportConflictItem, ImportErrorItem, ImportSuccessItem } from "@follow-app/client-sdk"

import type { ParsedFeedItem } from "./types"

export interface OpmlImportResult {
  successfulItems: ImportSuccessItem[]
  conflictItems: ImportConflictItem[]
  parsedErrorItems: ImportErrorItem[]
}

/**
 * Picks out the selected feeds the user already follows. The server leaves them out of the import
 * without reporting them as conflicts, so the result would not account for them.
 */
export const splitFollowedOpmlItems = (
  items: ParsedFeedItem[],
  followedFeedIdByUrl: ReadonlyMap<string, string>,
) => {
  const followed: ImportConflictItem[] = []
  const rest: ParsedFeedItem[] = []
  for (const item of items) {
    const feedId = followedFeedIdByUrl.get(item.url)
    if (feedId) {
      followed.push({ id: feedId, url: item.url, title: item.title })
    } else {
      rest.push(item)
    }
  }
  return { followed, rest }
}

// Counts the followed feeds as already subscribed, unless the server reported them itself
export const addFollowedToImportResult = (
  result: OpmlImportResult,
  followed: ImportConflictItem[],
): OpmlImportResult => {
  const reportedUrls = new Set(
    [...result.successfulItems, ...result.conflictItems, ...result.parsedErrorItems].map(
      (item) => item.url,
    ),
  )
  return {
    ...result,
    conflictItems: [
      ...result.conflictItems,
      ...followed.filter((item) => !reportedUrls.has(item.url)),
    ],
  }
}

import { getStorageNS } from "@follow/utils/ns"
import { atom } from "jotai"
import { atomWithStorage } from "jotai/utils"

import { createAtomHooks } from "~/lib/jotai"

export type FeedListSortBy = "count" | "alphabetical"
export type FeedListSortOrder = "asc" | "desc"
const [, , useFeedListSort, , getFeedListSort, setFeedListSort, useFeedListSortSelector] =
  createAtomHooks(
    atomWithStorage(
      getStorageNS("feedListSort"),
      {
        by: "count" as FeedListSortBy,
        order: "desc" as FeedListSortOrder,
      },
      undefined,
      { getOnInit: true },
    ),
  )

export { getFeedListSort, useFeedListSort, useFeedListSortSelector }

export const setFeedListSortBy = (by: FeedListSortBy) => {
  setFeedListSort({
    ...getFeedListSort(),
    by,
  })
}

export const setFeedListSortOrder = (order: FeedListSortOrder) => {
  setFeedListSort({
    ...getFeedListSort(),
    order,
  })
}

const flipOrder = (order: FeedListSortOrder): FeedListSortOrder =>
  order === "asc" ? "desc" : "asc"

/**
 * Switch between sorting by unread count and by name. The order flips with it, so the most
 * unread first goes with A to Z, as it always did on this button.
 */
export const toggleFeedListSortBy = () => {
  const { by, order } = getFeedListSort()
  setFeedListSort({
    by: by === "count" ? "alphabetical" : "count",
    order: flipOrder(order),
  })
}

/**
 * Versions before the name order was fixed listed "ascending" from Z to A and "descending" from
 * A to Z. Flipping a stored name order keeps the list in the order its user saw.
 */
export const migrateFeedListSortByName = () => {
  const { by, order } = getFeedListSort()
  if (by !== "alphabetical") return
  setFeedListSort({ by, order: flipOrder(order) })
}

const SELECT_NOTHING = []
export const [
  ,
  useSelectedFeedIdsState,
  ,
  ,
  getSelectedFeedIds,
  setSelectedFeedIds,
  useSelectedFeedIdsSelector,
] = createAtomHooks(atom<string[]>(SELECT_NOTHING))
export const resetSelectedFeedIds = () => {
  setSelectedFeedIds(SELECT_NOTHING)
}

export const [, , useFeedAreaScrollProgressValue, , , setFeedAreaScrollProgressValue] =
  createAtomHooks(atom(0))

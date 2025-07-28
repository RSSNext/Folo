import { FeedViewType } from "@follow/constants"

import { getEntry } from "../entry/getter"
import { getInboxList } from "../inbox/getters"
import { getListFeedIds } from "../list/getters"
import { folderFeedsByFeedIdSelector } from "./selectors"
import { useSubscriptionStore } from "./store"
import { getDefaultCategory } from "./utils"

export const getSubscriptionById = (id: string | undefined) => {
  if (!id) return
  return useSubscriptionStore.getState().data[id]
}
export const getSubscriptionByFeedId = (feedId: string | undefined) => getSubscriptionById(feedId)

export const getSubscriptionByEntryId = (entryId: string | undefined) => {
  if (!entryId) return
  const entry = getEntry(entryId)
  if (!entry) return
  const { feedId, sources } = entry
  const possibleSource = (sources?.concat(feedId || "") ?? []).filter((s) => !!s && s !== "feed")
  if (!possibleSource || possibleSource.length === 0) return
  return possibleSource.map((id) => getSubscriptionByFeedId(id)).find((s) => !!s)
}

export const getSubscribedFeedIdAndInboxHandlesByView = ({
  view,
  excludePrivate,
  excludeHidden,
}: {
  view: FeedViewType | undefined
  excludePrivate: boolean
  excludeHidden: boolean
}): string[] => {
  if (typeof view !== "number") return []
  const state = useSubscriptionStore.getState()
  return Array.from(state.feedIdByView[view])
    .filter((i) => !excludePrivate || !state.data[i]?.isPrivate)
    .filter((i) => !excludeHidden || !state.data[i]?.hideFromTimeline)
    .concat(view === FeedViewType.Articles ? getInboxList().map((i) => i.id) : [])
    .concat(
      Array.from(state.listIdByView[view])
        .filter((i) => !excludePrivate || !state.data[i]?.isPrivate)
        .filter((i) => !excludeHidden || !state.data[i]?.hideFromTimeline)
        .flatMap((id) => getListFeedIds(id) ?? []),
    )
}

export const getSubscribedFeedIdsByView = (view: FeedViewType): string[] => {
  const state = useSubscriptionStore.getState()
  return Array.from(state.feedIdByView[view])
}

export const getSubscriptionByCategory = ({
  category,
  view,
}: {
  category: string
  view: FeedViewType
}): string[] => {
  const state = useSubscriptionStore.getState()

  const ids = [] as string[]
  for (const id of Object.keys(state.data)) {
    const subscriptionCategory = state.data[id]
      ? state.data[id].category || getDefaultCategory(state.data[id])
      : null
    if (subscriptionCategory === category && state.data[id]!.view === view) {
      ids.push(id)
    }
  }
  return ids
}

export const getFolderFeedsByFeedId = ({ feedId, view }: { feedId?: string; view: FeedViewType }) =>
  folderFeedsByFeedIdSelector({ feedId, view })(useSubscriptionStore.getState())

export const getCategoryFeedIds = (category: string, view: FeedViewType): string[] => {
  const feedIds = [] as string[]
  const state = useSubscriptionStore.getState()
  for (const id of state.feedIdByView[view].keys()) {
    const subscription = state.data[id]
    if (!subscription) continue
    if (
      subscription.view === view &&
      (subscription.category === category || getDefaultCategory(subscription) === category)
    ) {
      feedIds.push(id)
    }
  }
  return feedIds
}

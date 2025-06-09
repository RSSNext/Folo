import { FeedViewType } from "@follow/constants"

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

export const getSubscriptionByView = (view: FeedViewType): string[] => {
  const state = useSubscriptionStore.getState()
  return Array.from(state.feedIdByView[view])
    .concat(view === FeedViewType.Articles ? getInboxList().map((i) => i.id) : [])
    .concat(Array.from(state.listIdByView[view]).flatMap((id) => getListFeedIds(id) ?? []))
}

export const getFeedSubscriptionByView = (view: FeedViewType): string[] => {
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

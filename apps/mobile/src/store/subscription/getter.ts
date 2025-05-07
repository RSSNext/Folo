import type { FeedViewType } from "@follow/constants"

import { getListFeedIds } from "../list/getters"
import type { SubscriptionModel } from "./store"
import { useSubscriptionStore } from "./store"
import { getDefaultCategory } from "./utils"

const get = useSubscriptionStore.getState
export const getSubscription = (id?: string): SubscriptionModel | undefined => {
  if (!id) return
  return get().data[id]
}

export const getSubscriptionByView = (view: FeedViewType): string[] => {
  const state = get()
  return Array.from(state.feedIdByView[view])
    .concat(Array.from(state.inboxIdByView[view]))
    .concat(Array.from(state.listIdByView[view]).flatMap((id) => getListFeedIds(id) ?? []))
}

export const getFeedSubscriptionByView = (view: FeedViewType): string[] => {
  const state = get()
  return Array.from(state.feedIdByView[view])
}

export const getSubscriptionByCategory = ({
  category,
  view,
}: {
  category: string
  view: FeedViewType
}): string[] => {
  const state = get()

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

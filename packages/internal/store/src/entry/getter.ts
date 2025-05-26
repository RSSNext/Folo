import { FeedViewType } from "@follow/constants"

import type { SelectedFeed, SelectedTimeline } from "@/src/modules/screen/atoms"

import { getSubscriptionByCategory } from "../subscription/getter"
import { useEntryStore } from "./store"
import type { EntryModel, FetchEntriesProps } from "./types"
import { FEED_COLLECTION_LIST } from "./utils"

const get = useEntryStore.getState

export const getEntry = (id: string): EntryModel | undefined => {
  return get().data[id]
}

export const getFetchEntryPayload = (
  selectedFeed: SelectedTimeline | SelectedFeed,
  view: FeedViewType = FeedViewType.Articles,
): FetchEntriesProps | null => {
  if (!selectedFeed) {
    return null
  }

  let payload: FetchEntriesProps = {}
  switch (selectedFeed.type) {
    case "view": {
      payload = { view: selectedFeed.viewId }
      break
    }
    case "feed": {
      payload = { feedId: selectedFeed.feedId }
      break
    }
    case "category": {
      payload = {
        feedIdList: getSubscriptionByCategory({ category: selectedFeed.categoryName, view }),
      }
      break
    }
    case "list": {
      payload = { listId: selectedFeed.listId }
      break
    }
    case "inbox": {
      payload = { inboxId: selectedFeed.inboxId }
      break
    }
    // No default
  }
  const isCollection =
    selectedFeed && selectedFeed.type === "feed" && selectedFeed?.feedId === FEED_COLLECTION_LIST
  if (isCollection) {
    payload.view = view
    payload.isCollection = true
  }

  return payload
}

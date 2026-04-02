import { FeedViewType } from "@follow/constants"

import { getServerConfigs } from "~/atoms/server-configs"

import { FEED_COLLECTION_LIST, ROUTE_FEED_PENDING } from "../constants/app"

export function getEntriesParams({
  feedId,
  inboxId,
  listId,
  view,
}: {
  feedId?: number | string
  inboxId?: number | string
  listId?: number | string
  view?: number
}) {
  const params: {
    feedId?: string
    feedIdList?: string[]
    isCollection?: boolean
    withContent?: boolean
    inboxId?: string
    listId?: string
  } = {}
  if (inboxId) {
    params.inboxId = `${inboxId}`
  } else if (listId) {
    params.listId = `${listId}`
  } else if (feedId) {
    if (feedId === FEED_COLLECTION_LIST) {
      params.isCollection = true
    } else if (feedId !== ROUTE_FEED_PENDING) {
      if (feedId.toString().includes(",")) {
        params.feedIdList = `${feedId}`.split(",")
      } else {
        params.feedId = `${feedId}`
      }
    }
  }
  if (view === FeedViewType.SocialMedia) {
    params.withContent = true
  }
  return {
    view,
    ...params,
  }
}

export const getLevelMultiplier = (level: number) => {
  if (level === 0) {
    return 0.1
  }

  return 1
}

export const getBlockchainExplorerUrl = () => {
  const serverConfigs = getServerConfigs()

  if (serverConfigs?.IS_RSS3_TESTNET) {
    return `https://scan.testnet.rss3.io`
  } else {
    return `https://scan.rss3.io`
  }
}

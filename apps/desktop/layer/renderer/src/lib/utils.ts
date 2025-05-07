import { FeedViewType } from "@follow/constants"

import { getServerConfigs } from "~/atoms/server-configs"
import type { RSSHubRoute } from "~/modules/discover/types"

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

const rsshubCategoryMap: Partial<Record<string, FeedViewType>> = {
  design: FeedViewType.Pictures,
  forecast: FeedViewType.Notifications,
  live: FeedViewType.Notifications,
  picture: FeedViewType.Pictures,
  "program-update": FeedViewType.Notifications,
  "social-media": FeedViewType.SocialMedia,
}

export const getViewFromRoute = (route: RSSHubRoute) => {
  if (route.view) {
    return route.view
  }
  for (const categories of route.categories) {
    if (rsshubCategoryMap[categories]) {
      return rsshubCategoryMap[categories]
    }
  }
  return null
}

export const getLevelMultiplier = (level: number) => {
  if (level === 0) {
    return 0.1
  }
  const serverConfigs = getServerConfigs()
  if (!serverConfigs) {
    return 1
  }
  const level1Range = serverConfigs?.LEVEL_PERCENTAGES[3]! - serverConfigs?.LEVEL_PERCENTAGES[2]!
  const percentageIndex = serverConfigs.LEVEL_PERCENTAGES.length - level
  let levelCurrentRange
  if (percentageIndex - 1 < 0) {
    levelCurrentRange = serverConfigs?.LEVEL_PERCENTAGES[percentageIndex]
  } else {
    levelCurrentRange =
      serverConfigs?.LEVEL_PERCENTAGES[percentageIndex]! -
      serverConfigs?.LEVEL_PERCENTAGES[percentageIndex - 1]!
  }
  const rangeMultiplier = levelCurrentRange / level1Range

  const poolMultiplier =
    serverConfigs?.DAILY_POWER_PERCENTAGES[level]! / serverConfigs?.DAILY_POWER_PERCENTAGES[1]!

  return (poolMultiplier / rangeMultiplier).toFixed(0)
}

export const getBlockchainExplorerUrl = () => {
  const serverConfigs = getServerConfigs()

  if (serverConfigs?.IS_RSS3_TESTNET) {
    return `https://scan.testnet.rss3.io`
  } else {
    return `https://scan.rss3.io`
  }
}

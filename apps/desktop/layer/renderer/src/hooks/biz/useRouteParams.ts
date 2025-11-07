import {
  getReadonlyRoute,
  useReadonlyRoute,
  useReadonlyRouteSelector,
} from "@follow/components/atoms/route.js"
import { FeedViewType } from "@follow/constants"
import { getListById } from "@follow/store/list/getters"
import { useMemo } from "react"
import type { Params } from "react-router"
import { useParams } from "react-router"

import {
  FEED_COLLECTION_LIST,
  ROUTE_ENTRY_PENDING,
  ROUTE_FEED_IN_FOLDER,
  ROUTE_FEED_IN_INBOX,
  ROUTE_FEED_IN_LIST,
  ROUTE_FEED_PENDING,
  ROUTE_TIMELINE_OF_VIEW,
  ROUTE_VIEW_ALL,
} from "~/constants"

export const useRouteEntryId = () => {
  const { entryId } = useParams()
  return entryId
}

export const useRouteFeedId = () => {
  const { feedId } = useParams()
  return feedId
}

export interface BizRouteParams {
  view: FeedViewType
  entryId?: string
  feedId?: string
  isCollection: boolean
  isAllFeeds: boolean
  isPendingEntry: boolean
  folderName?: string
  inboxId?: string
  listId?: string
  timelineId?: string
}

const VIEW_SLUG_BY_VIEW: Record<FeedViewType, string> = {
  [FeedViewType.All]: ROUTE_VIEW_ALL,
  [FeedViewType.Articles]: "articles",
  [FeedViewType.SocialMedia]: "social-media",
  [FeedViewType.Pictures]: "pictures",
  [FeedViewType.Videos]: "videos",
  [FeedViewType.Audios]: "audios",
  [FeedViewType.Notifications]: "notifications",
}

const VIEW_PARAM_ALIAS_MAP: Record<string, FeedViewType> = Object.entries(VIEW_SLUG_BY_VIEW).reduce(
  (acc, [view, slug]) => {
    if (slug === ROUTE_VIEW_ALL) return acc
    const numericView = Number(view)
    if (Number.isNaN(numericView)) return acc
    acc[slug] = numericView as FeedViewType
    return acc
  },
  {} as Record<string, FeedViewType>,
)

const FEED_VIEW_VALUES = new Set<FeedViewType>(
  Object.values(FeedViewType).filter((value): value is FeedViewType => typeof value === "number"),
)

const isFeedViewTypeValue = (value: number): value is FeedViewType =>
  Number.isInteger(value) && FEED_VIEW_VALUES.has(value as FeedViewType)

export const getTimelineIdByView = (view: FeedViewType) =>
  VIEW_SLUG_BY_VIEW[view] ?? `${ROUTE_TIMELINE_OF_VIEW}${view}`

export function parseView(input: string | undefined): FeedViewType | undefined {
  if (!input) return undefined

  const normalizedInput = input.toLowerCase()

  if (normalizedInput === ROUTE_VIEW_ALL) return FeedViewType.All

  const aliasView = VIEW_PARAM_ALIAS_MAP[normalizedInput]
  if (aliasView !== undefined) return aliasView

  if (normalizedInput.startsWith(ROUTE_TIMELINE_OF_VIEW)) {
    const view = Number.parseInt(normalizedInput.slice(ROUTE_TIMELINE_OF_VIEW.length), 10)
    if (isFeedViewTypeValue(view)) {
      return view
    }
  }

  const numericView = Number.parseInt(normalizedInput, 10)

  if (isFeedViewTypeValue(numericView)) {
    return numericView
  }
}

const parseRouteParams = (params: Params<any>, _searchParams: URLSearchParams): BizRouteParams => {
  const listId = params.feedId?.startsWith(ROUTE_FEED_IN_LIST)
    ? params.feedId.slice(ROUTE_FEED_IN_LIST.length)
    : undefined
  const list = listId ? getListById(listId) : undefined

  return {
    view: parseView(params.timelineId) ?? list?.view ?? FeedViewType.Articles,
    entryId: params.entryId || undefined,
    feedId: params.feedId || undefined,
    // alias
    isCollection: params.feedId === FEED_COLLECTION_LIST,
    isAllFeeds: params.feedId === ROUTE_FEED_PENDING,
    isPendingEntry: params.entryId === ROUTE_ENTRY_PENDING,
    folderName: params.feedId?.startsWith(ROUTE_FEED_IN_FOLDER)
      ? params.feedId.slice(ROUTE_FEED_IN_FOLDER.length)
      : undefined,
    inboxId: params.feedId?.startsWith(ROUTE_FEED_IN_INBOX)
      ? params.feedId.slice(ROUTE_FEED_IN_INBOX.length)
      : undefined,
    listId,
    timelineId: params.timelineId,
  }
}

export const useRouteParams = () => {
  const route = useReadonlyRoute()
  return useMemo(
    () => parseRouteParams(route.params, route.searchParams),
    [route.params, route.searchParams],
  )
}

const noop = [] as any[]

export const useRouteParamsSelector = <T>(
  selector: (params: BizRouteParams) => T,
  deps = noop,
): T =>
  useReadonlyRouteSelector((route) => {
    const { params, searchParams } = route

    return selector(parseRouteParams(params, searchParams))
  }, deps)

export const getRouteParams = () => {
  const route = getReadonlyRoute()
  const { params, searchParams } = route
  return parseRouteParams(params, searchParams)
}

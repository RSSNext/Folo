import { FeedViewType } from "@follow/constants"
import { usePrefetchEntries } from "@follow/store/entry/hooks"
import type { FetchEntriesProps } from "@follow/store/entry/types"
import { FEED_COLLECTION_LIST } from "@follow/store/entry/utils"
import { useFeed } from "@follow/store/feed/hooks"
import { useInbox } from "@follow/store/inbox/hooks"
import { useList } from "@follow/store/list/hooks"
import { getSubscriptionByCategory } from "@follow/store/subscription/getter"
import { jotaiStore } from "@follow/utils"
import { EventBus } from "@follow/utils/event-bus"
import { atom, useAtomValue } from "jotai"
import { selectAtom } from "jotai/utils"
import { createContext, use, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { useFetchEntriesSettings } from "@/src/atoms/settings/general"
import { views } from "@/src/constants/views"

export type SelectedTimeline = {
  type: "view"
  viewId: FeedViewType
}

export type SelectedFeed =
  | {
      type: "feed"
      feedId: string
    }
  | {
      type: "category"
      categoryName: string
    }
  | {
      type: "list"
      listId: string
    }
  | {
      type: "inbox"
      inboxId: string
    }
  | null

const selectedTimelineAtom = atom<SelectedTimeline>({
  type: "view",
  viewId: FeedViewType.Articles,
})

const selectedFeedAtom = atom<SelectedFeed>(null)

export const EntryListContext = createContext<{ type: "timeline" | "feed" | "subscriptions" }>({
  type: "timeline",
})
export const useEntryListContext = () => {
  return use(EntryListContext)
}

export function useSelectedView() {
  return useAtomValue(useMemo(() => selectAtom(selectedTimelineAtom, (state) => state.viewId), []))
}

export const getSelectedView = () => {
  return jotaiStore.get(selectedTimelineAtom).viewId
}

export function useSelectedFeed(): SelectedTimeline | SelectedFeed
export function useSelectedFeed<T>(
  selector?: (selectedFeed: SelectedTimeline | SelectedFeed) => T,
): T | null
export function useSelectedFeed<T>(
  selector?: (selectedFeed: SelectedTimeline | SelectedFeed) => T,
) {
  const entryListContext = useEntryListContext()

  const [stableSelector] = useState(() => selector)
  return useAtomValue(
    useMemo(
      () =>
        atom((get) => {
          const selectedTimeline = get(selectedTimelineAtom)
          const selectedFeed = get(selectedFeedAtom)
          const result = entryListContext.type === "feed" ? selectedFeed : selectedTimeline
          if (stableSelector) {
            return stableSelector(result)
          }
          return result
        }),
      [entryListContext, stableSelector],
    ),
  )
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

export function useFetchEntriesControls() {
  const selectedFeed = useSelectedFeed()
  const view = useSelectedView()

  const payload = getFetchEntryPayload(selectedFeed, view)
  const options = useFetchEntriesSettings()
  return usePrefetchEntries({ ...payload, ...options })
}

export const useSelectedFeedTitle = () => {
  const selectedFeed = useSelectedFeed()

  const viewDef = useViewDefinition(
    selectedFeed && selectedFeed.type === "view" ? selectedFeed.viewId : undefined,
  )
  const feed = useFeed(selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "")
  const list = useList(selectedFeed && selectedFeed.type === "list" ? selectedFeed.listId : "")
  const inbox = useInbox(selectedFeed && selectedFeed.type === "inbox" ? selectedFeed.inboxId : "")
  const { t } = useTranslation("common")

  if (!selectedFeed) {
    return ""
  }

  switch (selectedFeed.type) {
    case "view": {
      return viewDef?.name ? t(viewDef.name) : ""
    }
    case "feed": {
      return selectedFeed.feedId === FEED_COLLECTION_LIST ? t("words.starred") : (feed?.title ?? "")
    }
    case "category": {
      return selectedFeed.categoryName
    }
    case "list": {
      return list?.title
    }
    case "inbox": {
      return inbox?.title ?? t("words.inbox")
    }
  }
}

declare module "@follow/utils/event-bus" {
  export interface CustomEvent {
    SELECT_TIMELINE: {
      view: SelectedTimeline
      target: string | undefined
    }
  }
}

export const selectTimeline = (state: SelectedTimeline, target?: string) => {
  jotaiStore.set(selectedTimelineAtom, state)
  EventBus.dispatch("SELECT_TIMELINE", {
    view: state,
    target,
  })
}

export const selectFeed = (state: SelectedFeed) => {
  jotaiStore.set(selectedFeedAtom, state)
}

export const useViewDefinition = (view?: FeedViewType) => {
  const viewDef = useMemo(() => views.find((v) => v.view === view), [view])
  return viewDef
}

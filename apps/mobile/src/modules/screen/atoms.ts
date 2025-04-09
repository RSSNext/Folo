import { FeedViewType } from "@follow/constants"
import { jotaiStore } from "@follow/utils"
import { EventBus } from "@follow/utils/src/event-bus"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { createContext, useCallback, useContext, useMemo } from "react"
import { useTranslation } from "react-i18next"

import { views } from "@/src/constants/views"
import { getFetchEntryPayload } from "@/src/store/entry/getter"
import { usePrefetchEntries } from "@/src/store/entry/hooks"
import { FEED_COLLECTION_LIST } from "@/src/store/entry/utils"
import { useFeed } from "@/src/store/feed/hooks"
import { useInbox } from "@/src/store/inbox/hooks"
import { useList } from "@/src/store/list/hooks"
import { useSubscription } from "@/src/store/subscription/hooks"
// drawer open state

const drawerOpenAtom = atom<boolean>(false)

export function useFeedDrawer() {
  const [state, setState] = useAtom(drawerOpenAtom)

  return {
    isDrawerOpen: state,
    openDrawer: useCallback(() => setState(true), [setState]),
    closeDrawer: useCallback(() => setState(false), [setState]),
    toggleDrawer: useCallback(() => setState(!state), [setState, state]),
  }
}

export const closeDrawer = () => jotaiStore.set(drawerOpenAtom, false)

// is drawer swipe disabled

const isDrawerSwipeDisabledAtom = atom<boolean>(true)

export function useIsDrawerSwipeDisabled() {
  return useAtomValue(isDrawerSwipeDisabledAtom)
}

export function useSetDrawerSwipeDisabled() {
  return useSetAtom(isDrawerSwipeDisabledAtom)
}

// collection panel selected state

type CollectionPanelState = {
  type: "view"
  viewId: FeedViewType
}

const collectionPanelStateAtom = atom<CollectionPanelState>({
  type: "view",
  viewId: FeedViewType.Articles,
})

export function useSelectedCollection() {
  return useAtomValue(collectionPanelStateAtom)
}
export const selectCollection = (state: CollectionPanelState) => {
  jotaiStore.set(collectionPanelStateAtom, state)
  if (state.type === "view" || state.type === "list") {
    jotaiStore.set(selectedTimelineAtom, state)
  }
}

// feed panel selected state

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
  return useContext(EntryListContext)
}

export function useSelectedView() {
  const selectedTimeLine = useAtomValue(selectedTimelineAtom)
  const selectedFeed = useAtomValue(selectedFeedAtom)

  const list = useList(selectedFeed?.type === "list" ? selectedFeed.listId : "")
  const subscription = useSubscription(
    selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "",
  )

  if (selectedTimeLine.type === "view") {
    return selectedTimeLine.viewId
  }
  if (selectedTimeLine.type === "list") {
    return list?.view
  }
  if (selectedFeed?.type === "feed") {
    return subscription?.view
  }
}

export function useSelectedFeed() {
  const entryListContext = useEntryListContext()

  const selectedTimeline = useAtomValue(selectedTimelineAtom)
  const selectedFeed = useAtomValue(selectedFeedAtom)
  // console.log("selectedFeed", entryListContext, selectedTimeline, selectedFeed)

  return entryListContext.type === "feed" ? selectedFeed : selectedTimeline
}

export function useFetchEntriesControls() {
  const selectedFeed = useSelectedFeed()
  const view = useSelectedView()

  const payload = getFetchEntryPayload(selectedFeed, view)
  return usePrefetchEntries(payload)
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
      return selectedFeed.feedId === FEED_COLLECTION_LIST ? "Collections" : (feed?.title ?? "")
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

declare module "@follow/utils/src/event-bus" {
  export interface CustomEvent {
    SELECT_TIMELINE: {
      view: SelectedTimeline
      manual: boolean
    }
  }
}

export const selectTimeline = (state: SelectedTimeline, manual = true) => {
  jotaiStore.set(selectedTimelineAtom, state)
  EventBus.dispatch("SELECT_TIMELINE", {
    view: state,
    manual,
  })
}

export const selectFeed = (state: SelectedFeed) => {
  jotaiStore.set(selectedFeedAtom, state)
}

export const useViewDefinition = (view?: FeedViewType) => {
  const viewDef = useMemo(() => views.find((v) => v.view === view), [view])
  return viewDef
}

// horizontal scrolling state

const horizontalScrollingAtom = atom<boolean>(false)

export const setHorizontalScrolling = (value: boolean) =>
  jotaiStore.set(horizontalScrollingAtom, value)

export const getHorizontalScrolling = () => jotaiStore.get(horizontalScrollingAtom)

export const useHorizontalScrolling = () => {
  return useAtomValue(horizontalScrollingAtom)
}

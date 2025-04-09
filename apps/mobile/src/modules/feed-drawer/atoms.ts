import { FeedViewType } from "@follow/constants"
import { jotaiStore } from "@follow/utils"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { createContext, useCallback, useContext, useMemo } from "react"

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

type CollectionPanelState =
  | {
      type: "view"
      viewId: FeedViewType
    }
  | {
      type: "list"
      listId: string
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

export type SelectedTimeline =
  | {
      type: "view"
      viewId: FeedViewType
    }
  | {
      type: "list"
      listId: string
    }
  | {
      type: "inbox"
      inboxId: string
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
  | null

const selectedTimelineAtom = atom<SelectedTimeline>({
  type: "view",
  viewId: FeedViewType.Articles,
})

const selectedFeedAtom = atom<SelectedFeed>(null)

export const EntryListContext = createContext<{ type: "timeline" | "feed" }>({ type: "timeline" })
export const useEntryListContext = () => {
  return useContext(EntryListContext)
}

function useSelectedView() {
  const selectedTimeLine = useAtomValue(selectedTimelineAtom)
  const selectedFeed = useAtomValue(selectedFeedAtom)

  const list = useList(selectedTimeLine.type === "list" ? selectedTimeLine.listId : "")
  const subscription = useSubscription(
    selectedFeed && selectedFeed.type === "feed" ? selectedFeed.feedId : "",
  )
  const view =
    selectedTimeLine.type === "view"
      ? selectedTimeLine.viewId
      : selectedTimeLine.type === "list"
        ? list?.view
        : selectedFeed?.type === "feed"
          ? subscription?.view
          : undefined
  return view
}

export function useSelectedFeed() {
  const entryListContext = useEntryListContext()

  const selectedTimeline = useAtomValue(selectedTimelineAtom)
  const selectedFeed = useAtomValue(selectedFeedAtom)
  const view = useSelectedView()

  const payload = getFetchEntryPayload(
    entryListContext.type === "feed" ? selectedFeed : selectedTimeline,
    view,
  )
  usePrefetchEntries(payload)

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

  if (!selectedFeed) {
    return ""
  }

  switch (selectedFeed.type) {
    case "view": {
      return viewDef?.name
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
      return inbox?.title ?? "Inbox"
    }
  }
}

export const selectTimeline = (state: SelectedTimeline) => {
  jotaiStore.set(selectedTimelineAtom, state)
}

export const selectFeed = (state: SelectedFeed) => {
  jotaiStore.set(selectedFeedAtom, state)
}

export const useViewDefinition = (view?: FeedViewType) => {
  const viewDef = useMemo(() => views.find((v) => v.view === view), [view])
  return viewDef
}

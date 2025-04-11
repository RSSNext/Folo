import { FeedViewType } from "@follow/constants"
import { jotaiStore } from "@follow/utils"
import { EventBus } from "@follow/utils/src/event-bus"
import { atom, useAtom, useAtomValue, useSetAtom } from "jotai"
import { selectAtom } from "jotai/utils"
import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"

import { views } from "@/src/constants/views"
import { getFetchEntryPayload } from "@/src/store/entry/getter"
import { usePrefetchEntries } from "@/src/store/entry/hooks"
import { FEED_COLLECTION_LIST } from "@/src/store/entry/utils"
import { useFeed } from "@/src/store/feed/hooks"
import { useInbox } from "@/src/store/inbox/hooks"
import { useList } from "@/src/store/list/hooks"
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

// horizontal scrolling state

const horizontalScrollingAtom = atom<boolean>(false)

export const setHorizontalScrolling = (value: boolean) =>
  jotaiStore.set(horizontalScrollingAtom, value)

export const getHorizontalScrolling = () => jotaiStore.get(horizontalScrollingAtom)

export const useHorizontalScrolling = () => {
  return useAtomValue(horizontalScrollingAtom)
}

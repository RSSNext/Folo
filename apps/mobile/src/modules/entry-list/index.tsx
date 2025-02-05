import type { FeedViewType } from "@follow/constants"
import { useIsFocused } from "@react-navigation/native"
import { useEffect } from "react"

import { useSelectedFeed, useSetDrawerSwipeDisabled } from "@/src/modules/feed-drawer/atoms"
import {
  useEntryIdsByCategory,
  useEntryIdsByFeedId,
  useEntryIdsByInboxId,
  useEntryIdsByView,
} from "@/src/store/entry/hooks"
import { useList } from "@/src/store/list/hooks"

import { EntryListScreen } from "./entry-list"

export function EntryList() {
  const setDrawerSwipeDisabled = useSetDrawerSwipeDisabled()
  const isFocused = useIsFocused()
  useEffect(() => {
    if (isFocused) {
      setDrawerSwipeDisabled(false)
    } else {
      setDrawerSwipeDisabled(true)
    }
  }, [setDrawerSwipeDisabled, isFocused])

  const selectedFeed = useSelectedFeed()

  switch (selectedFeed.type) {
    case "view": {
      return <ViewEntryList viewId={selectedFeed.viewId} />
    }
    case "feed": {
      return <FeedEntryList feedId={selectedFeed.feedId} />
    }
    case "category": {
      return <CategoryEntryList categoryName={selectedFeed.categoryName} />
    }
    case "list": {
      return <ListEntryList listId={selectedFeed.listId} />
    }
    case "inbox": {
      return <InboxEntryList inboxId={selectedFeed.inboxId} />
    }
    // No default
  }
}

function ViewEntryList({ viewId }: { viewId: FeedViewType }) {
  const entryIds = useEntryIdsByView(viewId)
  return <EntryListScreen entryIds={entryIds} />
}

function FeedEntryList({ feedId }: { feedId: string }) {
  const entryIds = useEntryIdsByFeedId(feedId)
  return <EntryListScreen entryIds={entryIds} />
}

function CategoryEntryList({ categoryName }: { categoryName: string }) {
  const entryIds = useEntryIdsByCategory(categoryName)
  return <EntryListScreen entryIds={entryIds} />
}

function ListEntryList({ listId }: { listId: string }) {
  const list = useList(listId)
  if (!list) return null

  return <EntryListScreen entryIds={list.entryIds ?? []} />
}

function InboxEntryList({ inboxId }: { inboxId: string }) {
  const entryIds = useEntryIdsByInboxId(inboxId)
  return <EntryListScreen entryIds={entryIds} />
}

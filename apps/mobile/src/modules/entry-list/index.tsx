import { FeedViewType } from "@follow/constants"
import {
  useEntryIdsByCategory,
  useEntryIdsByFeedId,
  useEntryIdsByInboxId,
  useEntryIdsByListId,
  useEntryIdsByView,
} from "@follow/store/entry/hooks"
import { memo, useMemo } from "react"

import { useSelectedFeed, useSelectedView } from "@/src/modules/screen/atoms"
import { PagerList } from "@/src/modules/screen/PagerList"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"

import { EntryListSelector } from "./EntryListSelector"

const renderViewItem = (view: FeedViewType, active: boolean) => (
  <ViewEntryList key={view} viewId={view} active={active} />
)
export function EntryList() {
  const selectedFeed = useSelectedFeed()

  const Content = useMemo(() => {
    if (!selectedFeed) return null
    switch (selectedFeed.type) {
      case "view": {
        return <PagerList renderItem={renderViewItem} />
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
    }
  }, [selectedFeed])
  if (!Content) return null

  return (
    <>
      <TimelineHeader />
      {Content}
    </>
  )
}

const ViewEntryList = memo(({ viewId, active }: { viewId: FeedViewType; active: boolean }) => {
  const entryIds = useEntryIdsByView(viewId)

  return <EntryListSelector entryIds={entryIds} viewId={viewId} active={active} />
})

const FeedEntryList = memo(({ feedId }: { feedId: string }) => {
  const view = useSelectedView() ?? FeedViewType.Articles
  const entryIds = useEntryIdsByFeedId(feedId)
  return <EntryListSelector entryIds={entryIds} viewId={view} />
})

const CategoryEntryList = memo(({ categoryName }: { categoryName: string }) => {
  const view = useSelectedView() ?? FeedViewType.Articles
  const entryIds = useEntryIdsByCategory(categoryName)
  return <EntryListSelector entryIds={entryIds} viewId={view} />
})

const ListEntryList = memo(({ listId }: { listId: string }) => {
  const view = useSelectedView() ?? FeedViewType.Articles
  const entryIds = useEntryIdsByListId(listId)
  if (!entryIds) return null
  return <EntryListSelector entryIds={entryIds} viewId={view} />
})

const InboxEntryList = memo(({ inboxId }: { inboxId: string }) => {
  const view = useSelectedView() ?? FeedViewType.Articles
  const entryIds = useEntryIdsByInboxId(inboxId)
  return <EntryListSelector entryIds={entryIds} viewId={view} />
})

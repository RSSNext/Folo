import { FeedViewType } from "@follow/constants"
import { memo, useMemo } from "react"

import { useEntries, useSelectedFeed, useSelectedView } from "@/src/modules/screen/atoms"
import { PagerList } from "@/src/modules/screen/PagerList"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"

import { EntryListSelector } from "./EntryListSelector"

const renderViewItem = (view: FeedViewType, active: boolean) => (
  <ViewEntryList key={view} viewId={view} active={active} />
)
export function EntryList() {
  const selectedFeed = useSelectedFeed()
  const view = useSelectedView() ?? FeedViewType.Articles
  const Content = useMemo(() => {
    if (!selectedFeed) return null
    switch (selectedFeed.type) {
      case "view": {
        return <PagerList renderItem={renderViewItem} />
      }
      default: {
        return <NormalEntryList viewId={view} />
      }
    }
  }, [selectedFeed, view])
  if (!Content) return null

  return (
    <>
      <TimelineHeader />
      {Content}
    </>
  )
}

const ViewEntryList = memo(({ viewId, active }: { viewId: FeedViewType; active: boolean }) => {
  const { entriesIds } = useEntries({ viewId, active })
  return <EntryListSelector entryIds={entriesIds} viewId={viewId} active={active} />
})

const NormalEntryList = memo(({ viewId }: { viewId: FeedViewType }) => {
  const { entriesIds } = useEntries()
  return <EntryListSelector entryIds={entriesIds} viewId={viewId} />
})

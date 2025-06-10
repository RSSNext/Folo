import { FeedViewType } from "@follow/constants"
import { useMemo } from "react"

import { useSelectedFeed, useSelectedView } from "@/src/modules/screen/atoms"
import { PagerList } from "@/src/modules/screen/PagerList"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"

import { EntryListSelector } from "./EntryListSelector"

const renderViewItem = (view: FeedViewType, active: boolean) => (
  <EntryListSelector key={view} viewId={view} active={active} />
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
        return <EntryListSelector viewId={view} />
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

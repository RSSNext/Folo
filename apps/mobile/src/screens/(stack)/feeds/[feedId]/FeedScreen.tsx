import { FeedViewType } from "@follow/constants"
import { useFeedById } from "@follow/store/feed/hooks"
import { useMemo } from "react"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { EntryListSelector } from "@/src/modules/entry-list/EntryListSelector"
import { EntryListContext, useEntries, useSelectedView } from "@/src/modules/screen/atoms"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"

export const FeedScreen: NavigationControllerView<{
  feedId: string
}> = ({ feedId: feedIdentifier }) => {
  const insets = useSafeAreaInsets()
  const feed = useFeedById(feedIdentifier)

  return (
    <EntryListContext value={useMemo(() => ({ type: "feed" }), [])}>
      <RootSiblingParent>
        <BottomTabBarHeightContext value={insets.bottom}>
          <TimelineHeader feedId={feed?.id} />
          <FeedScreenEntryList />
        </BottomTabBarHeightContext>
      </RootSiblingParent>
    </EntryListContext>
  )
}

function FeedScreenEntryList() {
  const { entriesIds } = useEntries()
  const view = useSelectedView() ?? FeedViewType.Articles
  return <EntryListSelector viewId={view} entryIds={entriesIds} />
}

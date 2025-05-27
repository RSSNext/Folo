import { FeedViewType } from "@follow/constants"
import { useCollectionEntryList } from "@follow/store/collection/hooks"
import {
  useEntryIdsByCategory,
  useEntryIdsByFeedId,
  useEntryIdsByInboxId,
  useEntryIdsByListId,
} from "@follow/store/entry/hooks"
import { FEED_COLLECTION_LIST } from "@follow/store/entry/utils"
import { useFeed } from "@follow/store/feed/hooks"
import { useMemo } from "react"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { EntryListSelector } from "@/src/modules/entry-list/EntryListSelector"
import { EntryListContext, useSelectedView } from "@/src/modules/screen/atoms"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"

export const FeedScreen: NavigationControllerView<{
  feedId: string
}> = ({ feedId: feedIdentifier }) => {
  const insets = useSafeAreaInsets()
  const feed = useFeed(feedIdentifier)

  const isCollection = feedIdentifier === FEED_COLLECTION_LIST
  const view = useSelectedView() ?? FeedViewType.Articles
  const collectionEntryIds = useCollectionEntryList(view)

  const entryIdsByFeedId = useEntryIdsByFeedId(feedIdentifier)
  const entryIdsByCategory = useEntryIdsByCategory(feedIdentifier)
  const entryIdsByListId = useEntryIdsByListId(feedIdentifier)
  const entryIdsByInboxId = useEntryIdsByInboxId(feedIdentifier)

  const entryIds = isCollection
    ? collectionEntryIds
    : getEntryIdsFromMultiplePlace(
        entryIdsByFeedId,
        entryIdsByCategory,
        entryIdsByListId,
        entryIdsByInboxId,
      )

  return (
    <EntryListContext value={useMemo(() => ({ type: "feed" }), [])}>
      <RootSiblingParent>
        <BottomTabBarHeightContext value={insets.bottom}>
          <TimelineHeader feedId={feed?.id} />

          <EntryListSelector entryIds={entryIds} viewId={view} />
        </BottomTabBarHeightContext>
      </RootSiblingParent>
    </EntryListContext>
  )
}

function getEntryIdsFromMultiplePlace(...entryIds: Array<string[] | undefined | null>) {
  return entryIds.find((ids) => ids?.length) ?? []
}

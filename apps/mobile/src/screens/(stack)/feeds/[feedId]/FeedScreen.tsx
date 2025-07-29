import { FeedViewType } from "@follow/constants"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsSubscribed } from "@follow/store/subscription/hooks"
import { isBizId } from "@follow/utils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable } from "react-native"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { EntryListSelector } from "@/src/modules/entry-list/EntryListSelector"
import { EntryListContext, useEntries, useSelectedView } from "@/src/modules/screen/atoms"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"

export const FeedScreen: NavigationControllerView<{
  feedId: string
}> = ({ feedId: feedIdentifier }) => {
  const insets = useSafeAreaInsets()
  const feed = useFeedById(feedIdentifier)
  const navigation = useNavigation()
  const isSubscribed = useIsSubscribed(feedIdentifier)
  const { t } = useTranslation("common")

  return (
    <EntryListContext value={useMemo(() => ({ type: "feed" }), [])}>
      <RootSiblingParent>
        <BottomTabBarHeightContext value={insets.bottom}>
          <TimelineHeader feedId={feed?.id} />
          <FeedScreenEntryList />
          {!isSubscribed && isBizId(feedIdentifier) && (
            <Pressable
              className="bg-accent absolute bottom-10 left-1/2 z-10 m-2 mx-auto -translate-x-1/2 rounded-full px-4 py-2"
              onPress={() => {
                navigation.presentControllerView(FollowScreen, {
                  id: feedIdentifier,
                  type: "feed",
                })
              }}
            >
              <Text className="font-bold text-white">{t("words.follow")}</Text>
            </Pressable>
          )}
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

import { FeedViewType } from "@follow/constants"
import { useFeedById } from "@follow/store/feed/hooks"
import { useIsSubscribed } from "@follow/store/subscription/hooks"
import { isBizId, withOpacity } from "@follow/utils"
import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Pressable, StyleSheet } from "react-native"
import { RootSiblingParent } from "react-native-root-siblings"
import { useSafeAreaInsets } from "react-native-safe-area-context"

import { ThemedBlurView } from "@/src/components/common/ThemedBlurView"
import { BottomTabBarHeightContext } from "@/src/components/layouts/tabbar/contexts/BottomTabBarHeightContext"
import { Text } from "@/src/components/ui/typography/Text"
import { useNavigation } from "@/src/lib/navigation/hooks"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { EntryListSelector } from "@/src/modules/entry-list/EntryListSelector"
import { useFloatingPlayerBarInset } from "@/src/modules/player/hooks"
import { EntryListContext, useEntries, useSelectedView } from "@/src/modules/screen/atoms"
import { TimelineHeader } from "@/src/modules/screen/TimelineSelectorProvider"
import { FollowScreen } from "@/src/screens/(modal)/FollowScreen"
import { accentColor } from "@/src/theme/colors"

export const FeedScreen: NavigationControllerView<{
  feedId: string
}> = ({ feedId: feedIdentifier }) => {
  const insets = useSafeAreaInsets()
  const floatingPlayerBarInset = useFloatingPlayerBarInset()
  const feed = useFeedById(feedIdentifier)
  const navigation = useNavigation()
  const isSubscribed = useIsSubscribed(feedIdentifier)
  const isPreview = !isSubscribed && isBizId(feedIdentifier)
  const { t } = useTranslation("common")
  const entryListContextValue = useMemo(() => ({ type: "feed" as const, isPreview }), [isPreview])

  return (
    <EntryListContext value={entryListContextValue}>
      <RootSiblingParent>
        <BottomTabBarHeightContext value={insets.bottom + floatingPlayerBarInset}>
          <TimelineHeader feedId={feed?.id} />
          <FeedScreenEntryList />
          {isPreview && (
            <Pressable
              className="absolute left-1/2 z-10 min-w-[112px] -translate-x-1/2 items-center justify-center overflow-hidden rounded-full bg-accent px-5 py-3"
              hitSlop={12}
              style={{
                bottom: Math.max(20, insets.bottom + 12) + floatingPlayerBarInset,
              }}
              onPress={() => {
                navigation.presentControllerView(FollowScreen, {
                  id: feedIdentifier,
                  type: "feed",
                })
              }}
            >
              <ThemedBlurView
                useGlass
                style={StyleSheet.absoluteFill}
                tintColor={withOpacity(accentColor, 0.6)}
              />
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

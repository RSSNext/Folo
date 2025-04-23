import { useMemo } from "react"
import { View } from "react-native"

import { DefaultHeaderBackButton } from "@/src/components/layouts/header/NavigationHeader"
import { NavigationBlurEffectHeader } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { TIMELINE_VIEW_SELECTOR_HEIGHT } from "@/src/constants/ui"
import {
  ActionGroup,
  FeedShareActionButton,
  HomeLeftAction,
  MarkAllAsReadActionButton,
  UnreadOnlyActionButton,
} from "@/src/modules/screen/action"
import { TimelineViewSelector } from "@/src/modules/screen/TimelineViewSelector"

import { useEntryListContext, useFetchEntriesControls, useSelectedFeedTitle } from "./atoms"

export function TimelineHeader({ feedId }: { feedId?: string }) {
  const viewTitle = useSelectedFeedTitle()
  const screenType = useEntryListContext().type

  const isFeed = screenType === "feed"
  const isTimeline = screenType === "timeline"
  const isSubscriptions = screenType === "subscriptions"

  const { isFetching } = useFetchEntriesControls()

  return (
    <NavigationBlurEffectHeader
      title={viewTitle}
      isLoading={(isFeed || isTimeline) && isFetching}
      headerLeft={useMemo(
        () =>
          isTimeline || isSubscriptions
            ? () => <HomeLeftAction />
            : () => <DefaultHeaderBackButton canDismiss={false} canGoBack={true} />,
        [isTimeline, isSubscriptions],
      )}
      headerRight={useMemo(() => {
        const Component = (() => {
          if (isTimeline || isFeed)
            return () => (
              <ActionGroup>
                <UnreadOnlyActionButton />
                <MarkAllAsReadActionButton />
                <FeedShareActionButton feedId={feedId} />
              </ActionGroup>
            )
          if (isSubscriptions)
            return () => (
              <ActionGroup>
                <MarkAllAsReadActionButton />
              </ActionGroup>
            )
        })()

        if (Component)
          return () => <View className="flex-row items-center justify-end">{Component()}</View>
        return
      }, [isFeed, isTimeline, isSubscriptions, feedId])}
      headerHideableBottom={isTimeline || isSubscriptions ? TimelineViewSelector : undefined}
      headerHideableBottomHeight={TIMELINE_VIEW_SELECTOR_HEIGHT}
    />
  )
}

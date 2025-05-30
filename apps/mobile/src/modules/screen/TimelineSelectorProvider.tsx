import { useMemo } from "react"
import { View } from "react-native"

import { TimelineSearchHeader } from "@/src/components/layout/TimelineSearchHeader"
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

const SEARCH_BAR_HEIGHT = 44 // Approximate height for the search bar

const TimelineHeaderContentWrapper = ({ viewTitle }: { viewTitle: string }) => {
  return (
    <View>
      <TimelineSearchHeader currentViewTitle={viewTitle} />
      <TimelineViewSelector />
    </View>
  )
}

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
        return () => (
          <View className="flex-row items-center justify-end">
            <ActionGroup>
              <UnreadOnlyActionButton />
              <MarkAllAsReadActionButton />
              <FeedShareActionButton feedId={feedId} />
            </ActionGroup>
          </View>
        )
      }, [feedId])}
      headerHideableBottom={
        isTimeline || isSubscriptions
          ? () => <TimelineHeaderContentWrapper viewTitle={viewTitle} />
          : undefined
      }
      headerHideableBottomHeight={
        isTimeline || isSubscriptions ? TIMELINE_VIEW_SELECTOR_HEIGHT + SEARCH_BAR_HEIGHT : 0
      }
    />
  )
}

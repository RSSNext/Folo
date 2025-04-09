import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Share, View } from "react-native"
import { useColor } from "react-native-uikit-colors"

import { DefaultHeaderBackButton } from "@/src/components/layouts/header/NavigationHeader"
import { NavigationBlurEffectHeader } from "@/src/components/layouts/views/SafeNavigationScrollView"
import { UIBarButton } from "@/src/components/ui/button/UIBarButton"
import { TIMELINE_VIEW_SELECTOR_HEIGHT } from "@/src/constants/ui"
import { Share3CuteReIcon } from "@/src/icons/share_3_cute_re"
import { proxyEnv } from "@/src/lib/proxy-env"
import {
  ActionGroup,
  HomeLeftAction,
  HomeSharedRightAction,
  UnreadOnlyActionButton,
} from "@/src/modules/screen/action"
import { TimelineViewSelector } from "@/src/modules/screen/TimelineViewSelector"
import { getFeed } from "@/src/store/feed/getter"

import { useEntryListContext, useFetchEntriesControls, useSelectedFeedTitle } from "./atoms"

export function TimelineSelectorProvider({
  children,
  feedId,
}: {
  children: React.ReactNode
  feedId?: string
}) {
  const viewTitle = useSelectedFeedTitle()
  const screenType = useEntryListContext().type

  const isFeed = screenType === "feed"
  const isTimeline = screenType === "timeline"
  const isSubscriptions = screenType === "subscriptions"

  const { isFetching } = useFetchEntriesControls()

  return (
    <>
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
            const buttonVariant = isFeed ? "secondary" : "primary"
            if (isTimeline)
              return () => (
                <HomeSharedRightAction>
                  <UnreadOnlyActionButton variant={buttonVariant} />
                </HomeSharedRightAction>
              )
            if (isSubscriptions) return () => <HomeSharedRightAction />
            if (isFeed)
              return () => (
                <ActionGroup>
                  <UnreadOnlyActionButton variant={buttonVariant} />
                  <FeedShareAction feedId={feedId} />
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
      {children}
    </>
  )
}

function FeedShareAction({ feedId }: { feedId?: string }) {
  const { t } = useTranslation()
  const label = useColor("label")

  if (!feedId) return null
  return (
    <UIBarButton
      label={t("operation.share")}
      normalIcon={<Share3CuteReIcon height={24} width={24} color={label} />}
      onPress={() => {
        const feed = getFeed(feedId)
        if (!feed) return
        const url = `${proxyEnv.WEB_URL}/share/feeds/${feedId}`
        Share.share({
          message: `Check out ${feed.title} on Folo: ${url}`,
          title: feed.title!,
          url,
        })
      }}
    />
  )
}

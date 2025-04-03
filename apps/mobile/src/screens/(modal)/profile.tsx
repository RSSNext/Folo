import type { FeedViewType } from "@follow/constants"
import { Fragment, useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { FlatList, Image, Share, Text, TouchableOpacity, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { ReAnimatedScrollView } from "@/src/components/common/AnimatedComponents"
import { BlurEffect } from "@/src/components/common/BlurEffect"
import {
  InternalNavigationHeader,
  UINavigationHeaderActionButton,
} from "@/src/components/layouts/header/NavigationHeader"
import { getDefaultHeaderHeight } from "@/src/components/layouts/utils"
import {
  GROUPED_ICON_TEXT_GAP,
  GROUPED_LIST_ITEM_PADDING,
  GROUPED_LIST_MARGIN,
} from "@/src/components/ui/grouped/constants"
import {
  GroupedInsetListCard,
  GroupedInsetListSectionHeader,
} from "@/src/components/ui/grouped/GroupedList"
import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import type { FeedIconRequiredFeed } from "@/src/components/ui/icon/feed-icon"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { Share3CuteReIcon } from "@/src/icons/share_3_cute_re"
import type { apiClient } from "@/src/lib/api-fetch"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { useShareSubscription } from "@/src/modules/settings/hooks/useShareSubscription"
import { UserHeaderBanner } from "@/src/modules/settings/UserHeaderBanner"
import { ItemSeparator } from "@/src/modules/subscription/ItemSeparator"
import type { FeedModel } from "@/src/store/feed/types"
import type { ListModel } from "@/src/store/list/store"
import { useUser, useWhoami } from "@/src/store/user/hooks"
import { useColor } from "@/src/theme/colors"

type Subscription = Awaited<ReturnType<typeof apiClient.subscriptions.$get>>["data"][number]

export const ProfileScreen: NavigationControllerView<{
  userId: string
}> = ({ userId }) => {
  const whoami = useWhoami()

  if (!whoami) {
    return null
  }
  return <ProfileScreenImpl userId={userId || whoami?.id} />
}

function ProfileScreenImpl(props: { userId: string }) {
  const { t } = useTranslation()
  const scrollY = useSharedValue(0)
  const {
    data: subscriptions,
    isLoading,
    isError,
  } = useShareSubscription({
    userId: props.userId,
  })

  const headerOpacity = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
    headerOpacity.value = scrollY.value / 100
  })

  const user = useUser(props.userId)
  useEffect(() => {
    if (isError) {
      toast.error("Failed to fetch subscriptions")
    }
  }, [isError])

  const insets = useSafeAreaInsets()

  const textLabelColor = useColor("label")
  const openShareUrl = useCallback(() => {
    if (!user?.id) return
    Share.share({
      url: `https://app.follow.is/share/users/${user.id}`,
      title: `Folo | ${user.name}'s Profile`,
    })
  }, [user?.id, user?.name])

  const frame = useSafeAreaFrame()
  const headerHeight = getDefaultHeaderHeight(frame, false, 0)

  return (
    <View className="bg-system-grouped-background flex-1">
      <Animated.View
        pointerEvents="box-none"
        className="border-system-fill border-hairline absolute inset-x-0 top-0 z-[99]"
        style={{ opacity: headerOpacity }}
      >
        <BlurEffect />
        <InternalNavigationHeader
          title={t("profile.title", {
            name: user?.name,
          })}
          headerRight={
            <UINavigationHeaderActionButton onPress={openShareUrl}>
              <Share3CuteReIcon color={textLabelColor} />
            </UINavigationHeaderActionButton>
          }
        />
      </Animated.View>
      <ReAnimatedScrollView
        nestedScrollEnabled
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingBottom: insets.bottom, paddingTop: headerHeight }}
      >
        <UserHeaderBanner scrollY={scrollY} userId={props.userId} />

        {isLoading && <PlatformActivityIndicator className="mt-24" size={28} />}
        {!isLoading && subscriptions && <SubscriptionList subscriptions={subscriptions.data} />}
      </ReAnimatedScrollView>

      <Animated.View
        style={useAnimatedStyle(() => ({
          opacity: interpolate(headerOpacity.value, [0, 1], [1, 0]),
        }))}
        className="absolute top-5 flex w-full flex-row items-center justify-between px-4"
      >
        <View />
        <TouchableOpacity onPress={openShareUrl}>
          <Share3CuteReIcon color="#fff" />
        </TouchableOpacity>
      </Animated.View>
    </View>
  )
}

type PickedListModel = Pick<ListModel, "id" | "title" | "image" | "description" | "view"> & {
  customTitle?: string | null
}
type PickedFeedModel = Pick<
  FeedModel,
  "id" | "title" | "description" | "siteUrl" | "url" | "image"
> & {
  customTitle?: string | null
  view: FeedViewType
}
const SubscriptionList = ({ subscriptions }: { subscriptions: Subscription[] }) => {
  const { t: tCommon } = useTranslation("common")
  const { t } = useTranslation()
  const { lists, feeds, groupedFeeds } = useMemo(() => {
    const lists = [] as PickedListModel[]
    const feeds = [] as PickedFeedModel[]

    const groupedFeeds = {} as Record<string, PickedFeedModel[]>

    for (const subscription of subscriptions) {
      if ("listId" in subscription) {
        lists.push({
          id: subscription.listId,
          title: subscription.lists.title!,
          image: subscription.lists.image!,
          description: subscription.lists.description!,
          view: subscription.lists.view,
          customTitle: subscription.title,
        })
        continue
      }

      if ("feedId" in subscription && "feeds" in subscription) {
        const feed = {
          id: subscription.feedId,
          title: subscription.feeds.title!,
          image: subscription.feeds.image!,
          description: subscription.feeds.description!,
          siteUrl: subscription.feeds.siteUrl!,
          url: subscription.feeds.url!,
          view: subscription.view as FeedViewType,
          customTitle: subscription.title,
        }

        if (subscription.category) {
          groupedFeeds[subscription.category] = [
            ...(groupedFeeds[subscription.category] || []),
            feed,
          ]
        } else {
          feeds.push(feed)
        }
      }
    }
    return { lists, feeds, groupedFeeds }
  }, [subscriptions])

  const hasFeeds = Object.keys(groupedFeeds).length > 0 || feeds.length > 0
  return (
    <View>
      {lists.length > 0 && (
        <Fragment>
          <SectionHeader title={tCommon("words.lists")} />

          <GroupedInsetListCard>
            <FlatList
              scrollEnabled={false}
              data={lists}
              renderItem={renderListItems}
              ItemSeparatorComponent={ItemSeparator}
            />
          </GroupedInsetListCard>
        </Fragment>
      )}
      {hasFeeds && (
        <View className="mt-4">
          <SectionHeader title={tCommon("words.feeds")} />
          {Object.entries(groupedFeeds).map(([category, feeds]) => (
            <Fragment key={category}>
              <GroupedInsetListSectionHeader label={category} marginSize="small" />
              <GroupedInsetListCard>
                <FlatList
                  scrollEnabled={false}
                  data={feeds}
                  renderItem={renderFeedItems}
                  ItemSeparatorComponent={ItemSeparator}
                />
              </GroupedInsetListCard>
            </Fragment>
          ))}

          <GroupedInsetListSectionHeader
            label={t("profile.uncategorized_feeds")}
            marginSize="small"
          />
          <GroupedInsetListCard>
            <FlatList
              scrollEnabled={false}
              data={feeds}
              renderItem={renderFeedItems}
              ItemSeparatorComponent={ItemSeparator}
            />
          </GroupedInsetListCard>
        </View>
      )}
    </View>
  )
}
const renderListItems = ({ item }: { item: PickedListModel }) => (
  <View
    className="bg-secondary-system-grouped-background flex h-12 flex-row items-center"
    style={{ paddingHorizontal: GROUPED_LIST_ITEM_PADDING }}
  >
    <View className="overflow-hidden rounded">
      {!!item.image && (
        <Image source={{ uri: item.image, width: 24, height: 24 }} resizeMode="cover" />
      )}
      {!item.image && <FallbackIcon title={item.title} size={24} />}
    </View>

    <Text className="text-text" style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}>
      {item.title}
    </Text>
  </View>
)

const renderFeedItems = ({ item }: { item: PickedFeedModel }) => (
  <View
    className="bg-secondary-system-grouped-background flex h-12 flex-row items-center"
    style={{ paddingHorizontal: GROUPED_LIST_ITEM_PADDING }}
  >
    <View className="overflow-hidden rounded">
      <FeedIcon
        feed={
          {
            id: item.id,
            title: item.title,
            url: item.url,
            image: item.image,
            type: item.view,
            siteUrl: item.siteUrl || "",
          } as FeedIconRequiredFeed
        }
        size={24}
      />
    </View>
    <Text className="text-text" style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}>
      {item.title}
    </Text>
  </View>
)

const SectionHeader = ({ title }: { title: string }) => (
  <View className="mb-2 mt-5" style={{ marginHorizontal: GROUPED_LIST_MARGIN }}>
    <Text
      className="text-label text-xl font-medium"
      style={{ marginLeft: GROUPED_LIST_ITEM_PADDING }}
    >
      {title}
    </Text>
  </View>
)

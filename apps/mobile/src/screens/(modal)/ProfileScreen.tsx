import type { FeedViewType } from "@follow/constants"
import type { FeedModel } from "@follow/store/feed/types"
import type { ListModel } from "@follow/store/list/store"
import { getSubscription } from "@follow/store/subscription/getter"
import { subscriptionSyncService } from "@follow/store/subscription/store"
import { useUser, useWhoami } from "@follow/store/user/hooks"
import { userSyncService } from "@follow/store/user/store"
import { useQuery } from "@tanstack/react-query"
import { createContext, Fragment, use, useCallback, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Alert, FlatList, Image, Share, Text, TouchableOpacity, View } from "react-native"
import Animated, {
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
} from "react-native-reanimated"
import { useSafeAreaFrame, useSafeAreaInsets } from "react-native-safe-area-context"

import { ReAnimatedScrollView } from "@/src/components/common/AnimatedComponents"
import { BlurEffect } from "@/src/components/common/BlurEffect"
import { SwipeableItem } from "@/src/components/common/SwipeableItem"
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
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { ShareForwardCuteReIcon } from "@/src/icons/share_forward_cute_re"
import type { apiClient } from "@/src/lib/api-fetch"
import { Navigation } from "@/src/lib/navigation/Navigation"
import type { NavigationControllerView } from "@/src/lib/navigation/types"
import { toast } from "@/src/lib/toast"
import { useShareSubscription } from "@/src/modules/settings/hooks/useShareSubscription"
import { UserHeaderBanner } from "@/src/modules/settings/UserHeaderBanner"
import { ItemSeparator } from "@/src/modules/subscription/ItemSeparator"
import { useColor } from "@/src/theme/colors"

import { FeedScreen } from "../(stack)/feeds/[feedId]/FeedScreen"
import { FollowScreen } from "./FollowScreen"

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

const IsMyProfileContext = createContext<boolean>(false)

const ActionContext = createContext<{
  removeItemById: (id: string) => void
}>({
  removeItemById: () => {},
})
const usePrefetchUser = (userId: string) => {
  const { data } = useQuery({
    queryKey: ["user", userId],
    queryFn: () => userSyncService.fetchUser(userId),
    enabled: !!userId,
    staleTime: 1000 * 60 * 5,
  })
  return data
}
function ProfileScreenImpl(props: { userId: string }) {
  const { t } = useTranslation()
  const scrollY = useSharedValue(0)
  const {
    data: subscriptions,
    isLoading,
    isError,

    removeItemById,
  } = useShareSubscription({
    userId: props.userId,
  })

  const headerOpacity = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y
    headerOpacity.value = scrollY.value / 100
  })

  usePrefetchUser(props.userId)
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
    const shareUrl = `https://app.follow.is/share/users/${user.id}`
    Share.share({
      message: shareUrl,
      url: shareUrl,
      title: `Folo | ${user.name}'s Profile`,
    })
  }, [user?.id, user?.name])

  const frame = useSafeAreaFrame()
  const headerHeight = getDefaultHeaderHeight(frame, false, 0)

  const whoami = useWhoami()
  const isMyProfile = user?.id === whoami?.id
  const actionCtx = useMemo(() => ({ removeItemById }), [removeItemById])

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
            name: user?.name || user?.handle,
          })}
          headerRight={
            <UINavigationHeaderActionButton onPress={openShareUrl}>
              <ShareForwardCuteReIcon color={textLabelColor} />
            </UINavigationHeaderActionButton>
          }
        />
      </Animated.View>
      <ReAnimatedScrollView
        nestedScrollEnabled
        onScroll={scrollHandler}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24, paddingTop: headerHeight }}
      >
        <UserHeaderBanner scrollY={scrollY} userId={props.userId} />

        {isLoading && <PlatformActivityIndicator className="mt-24" size={28} />}
        <IsMyProfileContext value={isMyProfile}>
          <ActionContext value={actionCtx}>
            {!isLoading && subscriptions && <SubscriptionList subscriptions={subscriptions.data} />}
          </ActionContext>
        </IsMyProfileContext>
      </ReAnimatedScrollView>

      <Animated.View
        style={useAnimatedStyle(() => ({
          opacity: interpolate(headerOpacity.value, [0, 1], [1, 0]),
          top: insets.top + 17,
        }))}
        className="absolute flex w-full flex-row items-center justify-between px-4"
      >
        <View />
        <TouchableOpacity onPress={openShareUrl}>
          <ShareForwardCuteReIcon color="#fff" />
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
  <ItemPressable
    className="bg-secondary-system-grouped-background flex h-12 flex-row items-center"
    style={{ paddingHorizontal: GROUPED_LIST_ITEM_PADDING }}
    onPress={() => {
      if (getSubscription(item.id))
        Navigation.rootNavigation.pushControllerView(FeedScreen, {
          feedId: item.id,
        })
      else {
        Navigation.rootNavigation.pushControllerView(FollowScreen, {
          type: "list",
          id: item.id,
        })
      }
    }}
  >
    <View className="overflow-hidden rounded">
      {!!item.image && (
        <Image source={{ uri: item.image, width: 24, height: 24 }} resizeMode="cover" />
      )}
      {!item.image && <FallbackIcon title={item.title} size={24} />}
    </View>

    <Text
      className="text-text mr-4"
      numberOfLines={1}
      style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}
    >
      {item.title}
    </Text>
  </ItemPressable>
)

const renderFeedItems = ({ item }: { item: PickedFeedModel }) => (
  <MaybeSwipeable id={item.id}>
    <ItemPressable
      className="bg-secondary-system-grouped-background flex h-12 flex-row items-center"
      style={{ paddingHorizontal: GROUPED_LIST_ITEM_PADDING }}
      onPress={() => {
        if (getSubscription(item.id))
          Navigation.rootNavigation.pushControllerView(FeedScreen, {
            feedId: item.id,
          })
        else {
          Navigation.rootNavigation.pushControllerView(FollowScreen, {
            type: "feed",
            id: item.id,
          })
        }
      }}
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
      <Text
        className="text-text mr-4"
        numberOfLines={1}
        style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}
      >
        {item.title}
      </Text>
    </ItemPressable>
  </MaybeSwipeable>
)

const MaybeSwipeable = ({ id, children }: { id: string; children: React.ReactNode }) => {
  const isMyProfile = use(IsMyProfileContext)
  const { t } = useTranslation()
  const { removeItemById } = use(ActionContext)
  if (!isMyProfile) {
    return children
  }
  return (
    <SwipeableItem
      rightActions={[
        {
          onPress: () => {
            // unsubscribe
            Alert.alert("Unsubscribe?", "This will remove the feed from your subscriptions", [
              {
                text: "Cancel",
                style: "cancel",
              },
              {
                text: t("operation.unfollow"),
                style: "destructive",
                onPress: () => {
                  subscriptionSyncService.unsubscribe(id)
                  removeItemById(id)
                },
              },
            ])
          },
          backgroundColor: "red",
          label: t("operation.unfollow"),
        },
      ]}
    >
      {children}
    </SwipeableItem>
  )
}

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

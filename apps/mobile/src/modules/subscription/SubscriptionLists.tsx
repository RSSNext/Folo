import { FeedViewType } from "@follow/constants"
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs"
import { useHeaderHeight } from "@react-navigation/elements"
import { useAtom } from "jotai"
import { memo, useEffect, useMemo, useRef, useState } from "react"
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native"
import PagerView from "react-native-pager-view"
import ReAnimated, { LinearTransition } from "react-native-reanimated"
import { useSafeAreaInsets } from "react-native-safe-area-context"
import { useEventCallback } from "usehooks-ts"

import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { StarCuteFiIcon } from "@/src/icons/star_cute_fi"
import { FEED_COLLECTION_LIST } from "@/src/store/entry/utils"
import {
  useGroupedSubscription,
  useInboxSubscription,
  useListSubscription,
  usePrefetchSubscription,
  useSortedGroupedSubscription,
  useSortedListSubscription,
  useSortedUngroupedSubscription,
} from "@/src/store/subscription/hooks"
import { subscriptionSyncService } from "@/src/store/subscription/store"

import { closeDrawer, selectFeed } from "../feed-drawer/atoms"
import { useFeedListSortMethod, useFeedListSortOrder, viewAtom } from "./atoms"
import { CategoryGrouped } from "./CategoryGrouped"
import { ViewTabHeight } from "./constants"
import { useViewPageCurrentView, ViewPageCurrentViewProvider } from "./ctx"
import { InboxItem } from "./items/InboxItem"
import { ListSubscriptionItem } from "./items/ListSubscriptionItem"
import { SubscriptionItem } from "./items/SubscriptionItem"
import { ItemSeparator } from "./ItemSeparator"

export const SubscriptionLists = memo(() => {
  const [currentView, setCurrentView] = useAtom(viewAtom)

  const pagerRef = useRef<PagerView>(null)

  useEffect(() => {
    pagerRef.current?.setPage(currentView)
  }, [currentView])

  return (
    <PagerView
      pageMargin={1}
      onPageSelected={({ nativeEvent }) => {
        setCurrentView(nativeEvent.position)
      }}
      scrollEnabled
      style={style.flex}
      initialPage={0}
      ref={pagerRef}
      offscreenPageLimit={3}
    >
      {[
        FeedViewType.Articles,
        FeedViewType.SocialMedia,
        FeedViewType.Pictures,
        FeedViewType.Videos,
        FeedViewType.Audios,
        FeedViewType.Notifications,
      ].map((view) => {
        return (
          <ViewPageCurrentViewProvider key={view} value={view}>
            <SubscriptionList view={view} additionalOffsetTop={ViewTabHeight * 2 + 23} />
          </ViewPageCurrentViewProvider>
        )
      })}
    </PagerView>
  )
})
const keyExtractor = (item: string | { category: string; subscriptionIds: string[] }) => {
  if (typeof item === "string") {
    return item
  }
  return item.category
}
export const SubscriptionList = ({
  view,
  additionalOffsetTop,
}: {
  view: FeedViewType
  additionalOffsetTop?: number
}) => {
  const headerHeight = useHeaderHeight()
  const insets = useSafeAreaInsets()
  const tabHeight = useBottomTabBarHeight()

  usePrefetchSubscription(view)
  const { grouped, unGrouped } = useGroupedSubscription(view)

  const sortBy = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()
  const sortedGrouped = useSortedGroupedSubscription(grouped, sortBy, sortOrder)
  const sortedUnGrouped = useSortedUngroupedSubscription(unGrouped, sortBy, sortOrder)
  const data = useMemo(
    () => [...sortedGrouped, ...sortedUnGrouped],
    [sortedGrouped, sortedUnGrouped],
  )

  const [refreshing, setRefreshing] = useState(false)
  const onRefresh = useEventCallback(() => {
    return subscriptionSyncService.fetch(view)
  })

  const offsetTop = headerHeight - insets.top + (additionalOffsetTop || 0)

  return (
    <ReAnimated.FlatList
      refreshControl={
        <RefreshControl
          progressViewOffset={headerHeight}
          onRefresh={() => {
            setRefreshing(true)
            onRefresh().finally(() => {
              setRefreshing(false)
            })
          }}
          refreshing={refreshing}
        />
      }
      className={"bg-system-grouped-background"}
      contentInsetAdjustmentBehavior="automatic"
      scrollIndicatorInsets={{
        bottom: tabHeight - insets.bottom,
        top: offsetTop,
      }}
      contentContainerStyle={{
        paddingTop: offsetTop,
        paddingBottom: tabHeight,
      }}
      ItemSeparatorComponent={ItemSeparator}
      data={data}
      ListHeaderComponent={ListHeaderComponent}
      renderItem={ItemRender}
      keyExtractor={keyExtractor}
      itemLayoutAnimation={LinearTransition}
      extraData={{
        total: data.length,
      }}
    />
  )
}

const ItemRender = ({
  item,
  index,
  extraData,
}: {
  item: string | { category: string; subscriptionIds: string[] }
  index: number
  extraData?: {
    total: number
  }
}) => {
  if (typeof item === "string") {
    return (
      <SubscriptionItem
        id={item}
        className={extraData && index === extraData.total - 1 ? "border-b-transparent" : ""}
      />
    )
  }
  const { category, subscriptionIds } = item

  return <CategoryGrouped category={category} subscriptionIds={subscriptionIds} />
}

const ListHeaderComponent = () => {
  const view = useViewPageCurrentView()

  return (
    <>
      <StarItem />
      {view === FeedViewType.Articles && <InboxList />}
      <ListList />
      <Text className="text-secondary-label mb-2 ml-3 mt-4 text-sm font-medium">Feeds</Text>
    </>
  )
}

const InboxList = () => {
  const inboxes = useInboxSubscription(FeedViewType.Articles)
  if (inboxes.length === 0) return null
  return (
    <View>
      <Text className="text-secondary-label mb-2 ml-3 mt-4 text-sm font-medium">Inboxes</Text>

      <FlatList
        data={inboxes}
        renderItem={renderInboxItems}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  )
}
const renderInboxItems = ({ item }: { item: string }) => <InboxItem id={item} />

const StarItem = () => {
  return (
    <ItemPressable
      onPress={() => {
        selectFeed({ type: "feed", feedId: FEED_COLLECTION_LIST })
        closeDrawer()
      }}
      className="mt-4 h-12 w-full flex-row items-center px-3"
    >
      <StarCuteFiIcon color="rgb(245, 158, 11)" height={20} width={20} />
      <Text className="text-text ml-2">Collections</Text>
    </ItemPressable>
  )
}

const ListList = () => {
  const currentView = useViewPageCurrentView()
  const listIds = useListSubscription(currentView)
  const sortedListIds = useSortedListSubscription(listIds, "alphabet")
  if (sortedListIds.length === 0) return null
  return (
    <View className="mt-4">
      <Text className="text-secondary-label mb-2 ml-3 text-sm font-medium">Lists</Text>

      <FlatList
        data={sortedListIds}
        renderItem={renderListItems}
        ItemSeparatorComponent={ItemSeparator}
      />
    </View>
  )
}
const renderListItems = ({ item }: { item: string }) => <ListSubscriptionItem id={item} />

const style = StyleSheet.create({
  flex: {
    flex: 1,
  },
})

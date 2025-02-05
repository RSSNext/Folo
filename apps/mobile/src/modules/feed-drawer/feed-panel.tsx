import { cn } from "@follow/utils"
import { BottomTabBarHeightContext } from "@react-navigation/bottom-tabs"
import { HeaderHeightContext } from "@react-navigation/elements"
import type { FC } from "react"
import { createContext, memo, useContext, useState } from "react"
import {
  ActivityIndicator,
  Animated,
  Easing,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useAnimatedValue,
  View,
} from "react-native"
import { useSharedValue } from "react-native-reanimated"

import { AccordionItem } from "@/src/components/ui/accordion/AccordionItem"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { MingcuteRightLine } from "@/src/icons/mingcute_right_line"
import { useFeed, usePrefetchFeed } from "@/src/store/feed/hooks"
import { useList } from "@/src/store/list/hooks"
import { useSortedUngroupedSubscription, useSubscription } from "@/src/store/subscription/hooks"
import { useUnreadCount, useUnreadCounts } from "@/src/store/unread/hooks"

import {
  SubscriptionFeedCategoryContextMenu,
  SubscriptionFeedItemContextMenu,
} from "../context-menu/feeds"
import { useCurrentView, useFeedListSortMethod, useFeedListSortOrder } from "../subscription/atoms"
import { ViewPageCurrentViewProvider } from "../subscription/ctx"
import { SubscriptionList } from "../subscription/SubscriptionLists"
import { closeDrawer, selectFeed, useSelectedCollection } from "./atoms"
import { ListHeaderComponent, ViewHeaderComponent } from "./header"

export const FeedPanel = () => {
  const selectedCollection = useSelectedCollection()
  const [headerHeight, setHeaderHeight] = useState(0)

  if (selectedCollection.type === "view") {
    return (
      <View className="flex flex-1 overflow-hidden">
        <ViewHeaderComponent
          view={selectedCollection.viewId}
          onLayout={(e) => {
            setHeaderHeight(e.nativeEvent.layout.height)
          }}
        />

        <HeaderHeightContext.Provider value={headerHeight}>
          <BottomTabBarHeightContext.Provider value={0}>
            <ViewPageCurrentViewProvider
              key={selectedCollection.viewId}
              value={selectedCollection.viewId}
            >
              <SubscriptionList view={selectedCollection.viewId} />
            </ViewPageCurrentViewProvider>
          </BottomTabBarHeightContext.Provider>
        </HeaderHeightContext.Provider>
      </View>
    )
  }

  return (
    <View className="flex flex-1 overflow-hidden">
      <ListHeaderComponent listId={selectedCollection.listId} />
      <ListView listId={selectedCollection.listId} />
    </View>
  )
}

const ListView = ({ listId }: { listId: string }) => {
  const list = useList(listId)
  if (!list) {
    console.warn("list not found:", listId)
    return null
  }
  const { feedIds } = list

  return (
    <ScrollView>
      {feedIds.map((item, index) => (
        <ItemRender key={item} item={item} index={index} />
      ))}
      {/* Just a placeholder */}
      <View className="h-10" />
    </ScrollView>
  )
}

const ItemRender = ({
  item,
}: {
  item: string | { category: string; subscriptionIds: string[] }
  index: number
  extraData?: {
    total: number
  }
}) => {
  if (typeof item === "string") {
    return <SubscriptionItem id={item} />
  }
  const { category, subscriptionIds } = item

  return <CategoryGrouped category={category} subscriptionIds={subscriptionIds} />
}

const UnGroupedList: FC<{
  subscriptionIds: string[]
}> = ({ subscriptionIds }) => {
  const sortBy = useFeedListSortMethod()
  const sortOrder = useFeedListSortOrder()
  const sortedSubscriptionIds = useSortedUngroupedSubscription(subscriptionIds, sortBy, sortOrder)
  const lastSubscriptionId = sortedSubscriptionIds.at(-1)

  return sortedSubscriptionIds.map((id) => {
    return (
      <SubscriptionItem
        key={id}
        id={id}
        className={id === lastSubscriptionId ? "border-b-transparent" : ""}
      />
    )
  })
}

const GroupedContext = createContext<string | null>(null)

const AnimatedTouchableOpacity = Animated.createAnimatedComponent(TouchableOpacity)

const CategoryGrouped = memo(
  ({ category, subscriptionIds }: { category: string; subscriptionIds: string[] }) => {
    const unreadCounts = useUnreadCounts(subscriptionIds)
    const isExpanded = useSharedValue(false)
    const rotateValue = useAnimatedValue(1)
    const selectedCollection = useSelectedCollection()
    const view = selectedCollection.type === "view" ? selectedCollection.viewId : undefined
    if (view === undefined) {
      console.warn("view is undefined", selectedCollection)
      return null
    }
    return (
      <SubscriptionFeedCategoryContextMenu
        view={view}
        category={category}
        feedIds={subscriptionIds}
      >
        <ItemPressable
          onPress={() => {
            selectFeed({
              type: "category",
              categoryName: category,
            })
            closeDrawer()
          }}
          className="h-12 flex-row items-center px-3"
        >
          <AnimatedTouchableOpacity
            hitSlop={10}
            onPress={() => {
              Animated.timing(rotateValue, {
                toValue: isExpanded.value ? 1 : 0,
                easing: Easing.linear,

                useNativeDriver: true,
              }).start()
              isExpanded.value = !isExpanded.value
            }}
            style={[
              {
                transform: [
                  {
                    rotate: rotateValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ["90deg", "0deg"],
                    }),
                  },
                ],
              },
              style.accordionIcon,
            ]}
          >
            <MingcuteRightLine color="gray" height={18} width={18} />
          </AnimatedTouchableOpacity>
          <Text className="text-text ml-3">{category}</Text>
          {!!unreadCounts && (
            <Text className="text-tertiary-label ml-auto text-xs">{unreadCounts}</Text>
          )}
        </ItemPressable>
        <AccordionItem isExpanded={isExpanded} viewKey={category}>
          <GroupedContext.Provider value={category}>
            <UnGroupedList subscriptionIds={subscriptionIds} />
          </GroupedContext.Provider>
        </AccordionItem>
      </SubscriptionFeedCategoryContextMenu>
    )
  },
)

const SubscriptionItem = memo(({ id, className }: { id: string; className?: string }) => {
  const subscription = useSubscription(id)
  const unreadCount = useUnreadCount(id)
  const feed = useFeed(id)!
  const inGrouped = !!useContext(GroupedContext)
  const view = useCurrentView()
  const { isLoading } = usePrefetchFeed(id, { enabled: !feed })

  if (isLoading) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  if (!subscription && !feed) return null

  return (
    <SubscriptionFeedItemContextMenu id={id} view={view}>
      <ItemPressable
        className={cn(
          "flex h-12 flex-row items-center",
          inGrouped ? "pl-8 pr-4" : "px-4",
          className,
        )}
        onPress={() => {
          selectFeed({
            type: "feed",
            feedId: id,
          })
          closeDrawer()
        }}
      >
        <View className="dark:border-tertiary-system-background mr-3 size-5 items-center justify-center overflow-hidden rounded-full border border-transparent dark:bg-[#222]">
          <FeedIcon feed={feed} />
        </View>
        <Text numberOfLines={1} className="text-text flex-1">
          {subscription?.title || feed.title}
        </Text>
        {!!unreadCount && (
          <Text className="text-tertiary-label ml-auto text-xs">{unreadCount}</Text>
        )}
      </ItemPressable>
    </SubscriptionFeedItemContextMenu>
  )
})

const style = StyleSheet.create({
  accordionIcon: {
    height: 20,
    width: 20,
    alignItems: "center",
    justifyContent: "center",
  },
})

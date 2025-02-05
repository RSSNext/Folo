import { cn } from "@follow/utils"
import { memo, useContext } from "react"
import { ActivityIndicator, Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"

import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { useFeed, usePrefetchFeed } from "@/src/store/feed/hooks"
import { useSubscription } from "@/src/store/subscription/hooks"
import { useUnreadCount } from "@/src/store/unread/hooks"

import { SubscriptionFeedItemContextMenu } from "../../context-menu/feeds"
import { closeDrawer, selectFeed } from "../../feed-drawer/atoms"
import { GroupedContext, useViewPageCurrentView } from "../ctx"

// const renderRightActions = () => {
//   return (
//     <ReAnimated.View entering={FadeIn} className="flex-row items-center">
//       <TouchableOpacity
//         className="bg-red h-full justify-center px-4"
//         onPress={() => {
//           // TODO: Handle unsubscribe
//         }}
//       >
//         <Text className="text-base font-semibold text-white">Unsubscribe</Text>
//       </TouchableOpacity>
//     </ReAnimated.View>
//   )
// }
// const renderLeftActions = () => {
//   return (
//     <ReAnimated.View entering={FadeIn} className="flex-row items-center">
//       <TouchableOpacity
//         className="bg-blue h-full justify-center px-4"
//         onPress={() => {
//           // TODO: Handle unsubscribe
//         }}
//       >
//         <Text className="text-base font-semibold text-white">Read</Text>
//       </TouchableOpacity>
//     </ReAnimated.View>
//   )
// }
// let prevOpenedRow: SwipeableMethods | null = null
export const SubscriptionItem = memo(({ id, className }: { id: string; className?: string }) => {
  const subscription = useSubscription(id)
  const unreadCount = useUnreadCount(id)
  const feed = useFeed(id)!
  const inGrouped = !!useContext(GroupedContext)
  const view = useViewPageCurrentView()
  const { isLoading } = usePrefetchFeed(id, { enabled: !subscription && !feed })

  if (isLoading) {
    return (
      <View className="mt-24 flex-1 flex-row items-start justify-center">
        <ActivityIndicator />
      </View>
    )
  }

  // const swipeableRef: SwipeableRef = useRef(null)
  if (!subscription && !feed) return null

  return (
    // FIXME: Here leads to very serious performance issues, the frame rate of both the UI and JS threads has dropped
    // <Swipeable
    //   renderRightActions={renderRightActions}
    //   renderLeftActions={renderLeftActions}
    //   leftThreshold={40}
    //   rightThreshold={40}
    //   ref={swipeableRef}
    //   onSwipeableWillOpen={() => {
    //     if (prevOpenedRow && prevOpenedRow !== swipeableRef.current) {
    //       prevOpenedRow.close()
    //     }
    //     prevOpenedRow = swipeableRef.current
    //   }}
    // >
    // <ReAnimated.View key={id} layout={CurvedTransition} exiting={FadeOut}>
    <Animated.View exiting={FadeOutUp}>
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
            <Text className="text-tertiary-label ml-auto pl-2 text-xs">{unreadCount}</Text>
          )}
        </ItemPressable>
      </SubscriptionFeedItemContextMenu>
    </Animated.View>
    // </Swipeable>
  )
})

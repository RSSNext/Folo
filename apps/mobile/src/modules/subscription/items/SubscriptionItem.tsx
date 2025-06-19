import { useFeedById, usePrefetchFeed } from "@follow/store/feed/hooks"
import { useSubscriptionById } from "@follow/store/subscription/hooks"
import { useUnreadById } from "@follow/store/unread/hooks"
import { cn } from "@follow/utils"
import { memo, use } from "react"
import { Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"
import { useColor } from "react-native-uikit-colors"

import { OouiUserAnonymous } from "@/src/components/icons/OouiUserAnonymous"
import { GROUPED_ICON_TEXT_GAP, GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"
import { FeedIcon } from "@/src/components/ui/icon/feed-icon"
import { PlatformActivityIndicator } from "@/src/components/ui/loading/PlatformActivityIndicator"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { WifiOffCuteReIcon } from "@/src/icons/wifi_off_cute_re"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { selectFeed } from "@/src/modules/screen/atoms"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"

import { SubscriptionFeedItemContextMenu } from "../../context-menu/feeds"
import { GroupedContext } from "../ctx"
import { ItemSeparator, SecondaryItemSeparator } from "../ItemSeparator"
import type { SubscriptionItemBaseProps } from "./types"
import { UnreadCount } from "./UnreadCount"

export const SubscriptionItem = memo(
  ({ id, isFirst, isLast, className }: SubscriptionItemBaseProps) => {
    const red = useColor("red")
    const colorLabel = useColor("label")
    const subscription = useSubscriptionById(id)
    const unreadCount = useUnreadById(id)
    const feed = useFeedById(id)!
    const inGrouped = !!use(GroupedContext)
    const { isLoading } = usePrefetchFeed(id, { enabled: !subscription && !feed })

    const navigation = useNavigation()
    if (isLoading) {
      return (
        <View className="mt-24 flex-1 flex-row items-start justify-center">
          <PlatformActivityIndicator />
        </View>
      )
    }

    if (!subscription && !feed) return null

    return (
      <>
        <Animated.View
          exiting={FadeOutUp}
          style={{ marginHorizontal: GROUPED_LIST_MARGIN }}
          className={cn("overflow-hidden", {
            "rounded-t-[10px]": isFirst,
            "rounded-b-[10px]": isLast,
          })}
        >
          <SubscriptionFeedItemContextMenu id={id}>
            <ItemPressable
              itemStyle={ItemPressableStyle.Grouped}
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

                navigation.pushControllerView(FeedScreen, {
                  feedId: id,
                })
              }}
            >
              <View className="dark:border-tertiary-system-background size-5 items-center justify-center overflow-hidden rounded border border-transparent dark:bg-[#222]">
                <FeedIcon feed={feed} />
              </View>
              <View className="flex-1 flex-row items-center gap-2">
                <Text
                  numberOfLines={1}
                  className={cn("text-text shrink font-medium", feed.errorAt && "text-red")}
                  style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}
                >
                  {subscription?.title || feed.title}
                </Text>
                {!!feed.errorAt && <WifiOffCuteReIcon color={red} height={18} width={18} />}
                {!!subscription?.isPrivate && (
                  <OouiUserAnonymous color={colorLabel} height={18} width={18} />
                )}
              </View>
              <UnreadCount unread={unreadCount} className="ml-auto" />
            </ItemPressable>
          </SubscriptionFeedItemContextMenu>
        </Animated.View>
        {!isLast && (inGrouped ? <SecondaryItemSeparator /> : <ItemSeparator />)}
      </>
    )
  },
)
SubscriptionItem.displayName = "SubscriptionItem"

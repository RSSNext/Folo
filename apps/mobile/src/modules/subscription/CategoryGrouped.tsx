import { cn } from "@follow/utils"
import { memo, useState } from "react"
import { Text, TouchableOpacity, View } from "react-native"
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from "react-native-reanimated"

import { GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { RightCuteFiIcon } from "@/src/icons/right_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import {
  closeDrawer,
  getHorizontalScrolling,
  selectFeed,
  useSelectedFeed,
} from "@/src/modules/screen/atoms"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]"
import { useUnreadCounts } from "@/src/store/unread/hooks"
import { useColor } from "@/src/theme/colors"

import { SubscriptionFeedCategoryContextMenu } from "../context-menu/feeds"
import { GroupedContext } from "./ctx"
import { UnreadCount } from "./items/UnreadCount"
import { ItemSeparator } from "./ItemSeparator"
import { UnGroupedList } from "./UnGroupedList"

export const CategoryGrouped = memo(
  ({
    category,
    subscriptionIds,
    isFirst,
    isLast,
  }: {
    category: string
    subscriptionIds: string[]
    isFirst: boolean
    isLast: boolean
  }) => {
    const unreadCounts = useUnreadCounts(subscriptionIds)
    const [expanded, setExpanded] = useState(false)
    const rotateSharedValue = useSharedValue(0)
    const rotateStyle = useAnimatedStyle(() => {
      return {
        transform: [{ rotate: `${rotateSharedValue.value}deg` }],
      }
    }, [rotateSharedValue])

    const secondaryLabelColor = useColor("label")
    const selectedFeed = useSelectedFeed()
    const navigation = useNavigation()
    if (selectedFeed?.type !== "view") {
      return null
    }
    const view = selectedFeed.viewId

    return (
      <>
        <View style={{ marginHorizontal: GROUPED_LIST_MARGIN }}>
          <SubscriptionFeedCategoryContextMenu
            category={category}
            feedIds={subscriptionIds}
            view={view}
            asChild
          >
            <ItemPressable
              itemStyle={ItemPressableStyle.Grouped}
              onPress={() => {
                const isHorizontalScrolling = getHorizontalScrolling()
                if (isHorizontalScrolling) {
                  return
                }
                selectFeed({
                  type: "category",
                  categoryName: category,
                })
                closeDrawer()
                navigation.pushControllerView(FeedScreen, {
                  feedId: category,
                })
              }}
              className={cn("h-12 flex-row items-center px-3", {
                "rounded-t-[10px]": isFirst,
                "rounded-b-[10px]": isLast && !expanded,
              })}
            >
              <TouchableOpacity
                hitSlop={10}
                onPress={() => {
                  rotateSharedValue.value = withSpring(expanded ? 0 : 90, {})
                  setExpanded(!expanded)
                }}
                className="size-5 flex-row items-center justify-center"
              >
                <Animated.View style={rotateStyle} className="ml-2">
                  <RightCuteFiIcon color={secondaryLabelColor} height={14} width={14} />
                </Animated.View>
              </TouchableOpacity>
              <Text className="text-text ml-4 font-medium">{category}</Text>
              <UnreadCount unread={unreadCounts} className="text-secondary-label ml-auto text-xs" />
            </ItemPressable>
          </SubscriptionFeedCategoryContextMenu>
        </View>

        {!isLast && <ItemSeparator />}
        {expanded && (
          <GroupedContext.Provider value={category}>
            <UnGroupedList subscriptionIds={subscriptionIds} isGroupLast={isLast} />
          </GroupedContext.Provider>
        )}
      </>
    )
  },
)

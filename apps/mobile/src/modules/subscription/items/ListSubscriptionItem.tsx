import { cn } from "@follow/utils"
import { memo } from "react"
import { Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"

import { GROUPED_ICON_TEXT_GAP, GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"
import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { Image } from "@/src/components/ui/image/Image"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]"
import { useList } from "@/src/store/list/hooks"
import { useListUnreadCount } from "@/src/store/unread/hooks"

import { SubscriptionListItemContextMenu } from "../../context-menu/lists"
import { getHorizontalScrolling, selectFeed } from "../../screen/atoms"
import { ItemSeparator } from "../ItemSeparator"
import type { SubscriptionItemBaseProps } from "./types"
import { UnreadCount } from "./UnreadCount"

interface ListSubscriptionItemProps extends SubscriptionItemBaseProps {}
export const ListSubscriptionItem = memo(({ id, isFirst, isLast }: ListSubscriptionItemProps) => {
  const list = useList(id)
  const unreadCount = useListUnreadCount(id)
  const navigation = useNavigation()

  if (!list) return null
  return (
    <Animated.View
      exiting={FadeOutUp}
      style={{ marginHorizontal: GROUPED_LIST_MARGIN }}
      className={cn("overflow-hidden", {
        "rounded-t-[10px]": isFirst,
        "rounded-b-[10px]": isLast,
      })}
    >
      <SubscriptionListItemContextMenu id={id}>
        <ItemPressable
          itemStyle={ItemPressableStyle.Grouped}
          className="h-12 flex-row items-center px-3"
          onPress={() => {
            const isHorizontalScrolling = getHorizontalScrolling()
            if (isHorizontalScrolling) {
              return
            }
            selectFeed({
              type: "list",
              listId: id,
            })
            navigation.pushControllerView(FeedScreen, {
              feedId: id,
            })
          }}
        >
          <View className="ml-1 overflow-hidden rounded">
            {!!list.image && (
              <Image
                proxy={{
                  width: 20,
                  height: 20,
                }}
                style={{ height: 20, width: 20 }}
                source={{ uri: list.image }}
              />
            )}
            {!list.image && <FallbackIcon title={list.title} size={20} />}
          </View>

          <Text className="text-label font-medium" style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}>
            {list.title}
          </Text>
          <UnreadCount unread={unreadCount} className="ml-auto" />
        </ItemPressable>
      </SubscriptionListItemContextMenu>
      {!isLast && <ItemSeparator />}
    </Animated.View>
  )
})

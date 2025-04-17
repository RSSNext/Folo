import { cn } from "@follow/utils"
import { useColorScheme } from "nativewind"
import { memo } from "react"
import { Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"

import { GROUPED_ICON_TEXT_GAP, GROUPED_LIST_MARGIN } from "@/src/components/ui/grouped/constants"
import { ItemPressableStyle } from "@/src/components/ui/pressable/enum"
import { ItemPressable } from "@/src/components/ui/pressable/ItemPressable"
import { InboxCuteFiIcon } from "@/src/icons/inbox_cute_fi"
import { useNavigation } from "@/src/lib/navigation/hooks"
import { getHorizontalScrolling, selectFeed } from "@/src/modules/screen/atoms"
import { FeedScreen } from "@/src/screens/(stack)/feeds/[feedId]/FeedScreen"
import { useSubscription } from "@/src/store/subscription/hooks"
import { getInboxStoreId } from "@/src/store/subscription/utils"
import { useUnreadCount } from "@/src/store/unread/hooks"

import type { SubscriptionItemBaseProps } from "./types"
import { UnreadCount } from "./UnreadCount"

export const InboxItem = memo(({ id, isFirst, isLast }: SubscriptionItemBaseProps) => {
  const subscription = useSubscription(getInboxStoreId(id))
  const unreadCount = useUnreadCount(id)
  const { colorScheme } = useColorScheme()
  const navigation = useNavigation()
  if (!subscription) return null
  return (
    <Animated.View
      exiting={FadeOutUp}
      style={{ marginHorizontal: GROUPED_LIST_MARGIN }}
      className={cn("overflow-hidden", {
        "rounded-t-[10px]": isFirst,
        "rounded-b-[10px]": isLast,
      })}
    >
      <ItemPressable
        itemStyle={ItemPressableStyle.Grouped}
        className="h-12 flex-row items-center px-3"
        onPress={() => {
          const isHorizontalScrolling = getHorizontalScrolling()
          if (isHorizontalScrolling) {
            return
          }
          selectFeed({ type: "inbox", inboxId: id })
          navigation.pushControllerView(FeedScreen, {
            feedId: id,
          })
        }}
      >
        <View className="ml-0.5 overflow-hidden rounded">
          <InboxCuteFiIcon
            height={20}
            width={20}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        </View>

        <Text className="text-label font-medium" style={{ marginLeft: GROUPED_ICON_TEXT_GAP }}>
          {subscription.title}
        </Text>
        <UnreadCount unread={unreadCount} className="ml-auto" />
      </ItemPressable>
    </Animated.View>
  )
})

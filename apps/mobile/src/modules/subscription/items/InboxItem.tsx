import { useColorScheme } from "nativewind"
import { memo } from "react"
import { Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"

import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { InboxCuteFiIcon } from "@/src/icons/inbox_cute_fi"
import { useSubscription } from "@/src/store/subscription/hooks"
import { getInboxStoreId } from "@/src/store/subscription/utils"
import { useUnreadCount } from "@/src/store/unread/hooks"

import { closeDrawer, selectFeed } from "../../feed-drawer/atoms"

export const InboxItem = memo(({ id }: { id: string }) => {
  const subscription = useSubscription(getInboxStoreId(id))
  const unreadCount = useUnreadCount(id)
  const { colorScheme } = useColorScheme()
  if (!subscription) return null
  return (
    <Animated.View exiting={FadeOutUp}>
      <ItemPressable
        className="h-12 flex-row items-center px-3"
        onPress={() => {
          selectFeed({ type: "inbox", inboxId: id })
          closeDrawer()
        }}
      >
        <View className="ml-0.5 overflow-hidden rounded">
          <InboxCuteFiIcon
            height={20}
            width={20}
            color={colorScheme === "dark" ? "white" : "black"}
          />
        </View>

        <Text className="text-text ml-2.5">{subscription.title}</Text>
        {!!unreadCount && (
          <Text className="text-tertiary-label ml-auto text-xs">{unreadCount}</Text>
        )}
      </ItemPressable>
    </Animated.View>
  )
})

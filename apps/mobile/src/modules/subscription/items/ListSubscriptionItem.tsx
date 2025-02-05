import { memo } from "react"
import { Image, Text, View } from "react-native"
import Animated, { FadeOutUp } from "react-native-reanimated"

import { FallbackIcon } from "@/src/components/ui/icon/fallback-icon"
import { ItemPressable } from "@/src/components/ui/pressable/item-pressable"
import { useList } from "@/src/store/list/hooks"
import { useUnreadCount } from "@/src/store/unread/hooks"

import { SubscriptionListItemContextMenu } from "../../context-menu/lists"
import { closeDrawer, selectFeed } from "../../feed-drawer/atoms"

export const ListSubscriptionItem = memo(({ id }: { id: string; className?: string }) => {
  const list = useList(id)
  const unreadCount = useUnreadCount(id)
  if (!list) return null
  return (
    <Animated.View exiting={FadeOutUp}>
      <SubscriptionListItemContextMenu id={id}>
        <ItemPressable
          className="h-12 flex-row items-center px-3"
          onPress={() => {
            selectFeed({
              type: "list",
              listId: id,
            })
            closeDrawer()
          }}
        >
          <View className="overflow-hidden rounded">
            {!!list.image && (
              <Image source={{ uri: list.image, width: 24, height: 24 }} resizeMode="cover" />
            )}
            {!list.image && <FallbackIcon title={list.title} size={24} />}
          </View>

          <Text className="text-text ml-2">{list.title}</Text>
          {!!unreadCount && <View className="bg-tertiary-label ml-auto size-1 rounded-full" />}
        </ItemPressable>
      </SubscriptionListItemContextMenu>
    </Animated.View>
  )
})

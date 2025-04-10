import { cn } from "@follow/utils"
import { Text, View } from "react-native"

import { useUISettingKey } from "@/src/atoms/settings/ui"

export function UnreadCount({ unread, className }: { unread?: number; className?: string }) {
  const showUnreadCount = useUISettingKey("showUnreadCountViewAndSubscriptionMobile")

  if (!unread) return null
  return showUnreadCount ? (
    <Text className={cn("text-tertiary-label text-xs", className)}>{unread}</Text>
  ) : (
    <View className={cn("bg-tertiary-label size-1 rounded-full", className)} />
  )
}

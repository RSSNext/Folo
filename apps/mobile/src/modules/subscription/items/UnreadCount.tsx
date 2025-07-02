import { cn } from "@follow/utils"
import { Text, View } from "react-native"
import type { AnimatedProps } from "react-native-reanimated"

import { useUISettingKey } from "@/src/atoms/settings/ui"

export function UnreadCount({
  unread,
  className,
  textClassName,
  dotClassName,
  max = Infinity,
  ...rest
}: {
  unread?: number
  className?: string
  textClassName?: string
  dotClassName?: string
  max?: number
} & AnimatedProps<object>) {
  const showUnreadCount = useUISettingKey("showUnreadCountViewAndSubscriptionMobile")

  if (!unread) return null
  return showUnreadCount ? (
    <Text
      numberOfLines={1}
      ellipsizeMode="clip"
      className={cn("text-tertiary-label text-xs", className, textClassName)}
      {...rest}
    >
      {unread > max ? `${max}+` : unread}
    </Text>
  ) : (
    <View
      className={cn("bg-tertiary-label size-1 rounded-full", className, dotClassName)}
      {...rest}
    />
  )
}

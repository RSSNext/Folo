import { cn } from "@follow/utils"
import type { AnimatedProps } from "react-native-reanimated"
import Animated from "react-native-reanimated"

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
    <Animated.Text
      className={cn("text-tertiary-label text-xs", className, textClassName)}
      {...rest}
    >
      {unread > max ? `${max}+` : unread}
    </Animated.Text>
  ) : (
    <Animated.View
      className={cn("bg-tertiary-label size-1 rounded-full", className, dotClassName)}
      {...rest}
    />
  )
}
